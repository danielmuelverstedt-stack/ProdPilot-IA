import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { deriveErpWorkOrderStatus, matchesErpWorkOrderFilters, summarizeErpWorkOrder } from "../src/features/work-orders/services/erp-work-order-summary.ts";

const base = { workOrderId: "OF-500", articleCode: "A100", description: "Bride", dueDate: "2026-07-20", workOrder: { customerName: "EXAIL" }, delayDays: null, department: "Fraisage" };

function op(overrides) {
  return { ...base, id: `${base.workOrderId}-${overrides.operationNumber ?? 1}`, machine: "DMU50", effectiveStatus: "not-started", ...overrides };
}

test("deriveErpWorkOrderStatus priorise bloquée > en cours > terminée (toutes) > à faire", () => {
  assert.equal(deriveErpWorkOrderStatus([op({ effectiveStatus: "not-started" }), op({ effectiveStatus: "blocked" }), op({ effectiveStatus: "completed" })]), "blocked");
  assert.equal(deriveErpWorkOrderStatus([op({ effectiveStatus: "not-started" }), op({ effectiveStatus: "in-progress" })]), "in-progress");
  assert.equal(deriveErpWorkOrderStatus([op({ effectiveStatus: "completed" }), op({ effectiveStatus: "completed" })]), "completed");
  assert.equal(deriveErpWorkOrderStatus([op({ effectiveStatus: "not-started" }), op({ effectiveStatus: "completed" })]), "not-started");
});

test("summarizeErpWorkOrder dérive client/article/échéance depuis la première opération et le statut/la progression depuis l'ensemble", () => {
  const rows = [
    op({ operationNumber: 1, effectiveStatus: "completed" }),
    op({ operationNumber: 2, effectiveStatus: "in-progress", machine: "DMU60", department: "Tournage" }),
    op({ operationNumber: 3, effectiveStatus: "not-started" }),
  ];
  const summary = summarizeErpWorkOrder(rows);
  assert.equal(summary.id, "OF-500");
  assert.equal(summary.customer, "EXAIL");
  assert.equal(summary.article, "A100");
  assert.equal(summary.dueDate, "2026-07-20");
  assert.equal(summary.status, "in-progress");
  assert.equal(summary.machine, "DMU60", "la machine affichée est celle de l'opération en cours, pas la première");
  assert.equal(summary.department, "Tournage");
  assert.equal(summary.progress, 33, "1 opération terminée sur 3");
  assert.equal(summary.operationCount, 3);
});

test("summarizeErpWorkOrder signale le retard dès qu'une seule opération est en retard, sans inventer de délai", () => {
  const onTime = summarizeErpWorkOrder([op({ delayDays: -2 }), op({ delayDays: null })]);
  assert.equal(onTime.isLate, false);
  const late = summarizeErpWorkOrder([op({ delayDays: -2 }), op({ delayDays: 5 })]);
  assert.equal(late.isLate, true);
});

test("matchesErpWorkOrderFilters combine recherche, statut, machine, département et retard", () => {
  const item = { id: "OF-1", customer: "EXAIL", article: "A100", description: "Bride", dueDate: "2026-07-20", status: "in-progress", machine: "DMU50", department: "Fraisage", progress: 50, isLate: true, operationCount: 2 };
  const labels = { "not-started": "À faire", "in-progress": "En cours", completed: "Terminée", blocked: "Bloquée", unknown: "À qualifier" };
  const empty = { search: "", statusLabel: "Tous", machine: "Toutes", department: "Tous", delay: "Tous" };
  assert.equal(matchesErpWorkOrderFilters(item, empty, labels), true);
  assert.equal(matchesErpWorkOrderFilters(item, { ...empty, search: "exail" }, labels), true);
  assert.equal(matchesErpWorkOrderFilters(item, { ...empty, search: "introuvable" }, labels), false);
  assert.equal(matchesErpWorkOrderFilters(item, { ...empty, statusLabel: "Bloquée" }, labels), false);
  assert.equal(matchesErpWorkOrderFilters(item, { ...empty, machine: "DMU60" }, labels), false);
  assert.equal(matchesErpWorkOrderFilters(item, { ...empty, department: "Tournage" }, labels), false);
  assert.equal(matchesErpWorkOrderFilters(item, { ...empty, delay: "À l’heure" }, labels), false);
  assert.equal(matchesErpWorkOrderFilters(item, { ...empty, delay: "En retard" }, labels), true);
});

test("le module OF réutilise le regroupement et les hooks existants sans dupliquer de logique", async () => {
  const listModule = await readFile(new URL("../src/features/work-orders/components/WorkOrdersModule.tsx", import.meta.url), "utf8");
  assert.match(listModule, /groupErpPlanningRows\(rows, "work-order", machines\)/);
  assert.match(listModule, /useWorkshopOperations\(machines, visibleTaskCategoryCodes\)/);
  assert.match(listModule, /useErpImportActive\(\)/);
  assert.match(listModule, /summarizeErpWorkOrder/);
});

test("la fiche OF garde la démonstration comme repli et le lien d'action inchangé en mode ERP", async () => {
  const detail = await readFile(new URL("../src/features/work-orders/components/WorkOrderDetail.tsx", import.meta.url), "utf8");
  assert.match(detail, /useErpImportActive/);
  assert.match(detail, /hasActiveImport \? <ErpWorkOrderDetail id={id} \/> : <DemoWorkOrderDetail id={id} \/>/);
  const contextLinkOccurrences = detail.match(/module: "workOrder", id, label: id, href: `\/of\/\$\{id\}`/g) ?? [];
  assert.ok(contextLinkOccurrences.length >= 1, "le contextLink workOrder doit rester câblé en mode ERP");
  assert.match(detail, /include=work-order-details/, "la fiche ERP redemande le détail complet, comme l'ancienne fenêtre du Cockpit ERP");
});

test("la fiche OF ERP n'invente aucun temps de fabrication (le mode démonstration garde le sien, réel)", async () => {
  const detail = await readFile(new URL("../src/features/work-orders/components/WorkOrderDetail.tsx", import.meta.url), "utf8");
  const erpBranch = detail.slice(detail.indexOf("function ErpWorkOrderDetail"));
  assert.doesNotMatch(erpBranch, /plannedDuration|durationHours|capacityHours/);
  assert.match(erpBranch, /Non disponible/);
});

test("le Cockpit ERP n'ouvre plus sa propre fenêtre d'OF : il renvoie vers la fiche unique /of/[id]", async () => {
  const workspace = await readFile(new URL("../src/features/erp-import/components/ErpPlanningWorkspace.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(workspace, /function WorkOrderDialog/, "l'ancienne fenêtre dupliquée doit avoir disparu");
  assert.doesNotMatch(workspace, /selectedOf/);
  assert.match(workspace, /router\.push\(`\/of\/\$\{id\}`\)/);
});
