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

test("deriveErpWorkOrderStatus place « en attente » entre bloquée et en cours", () => {
  assert.equal(deriveErpWorkOrderStatus([op({ effectiveStatus: "not-started" }), op({ effectiveStatus: "waiting" }), op({ effectiveStatus: "in-progress" })]), "waiting", "en attente prime sur en cours");
  assert.equal(deriveErpWorkOrderStatus([op({ effectiveStatus: "waiting" }), op({ effectiveStatus: "blocked" })]), "blocked", "bloquée reste prioritaire sur en attente");
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

test("summarizeErpWorkOrder calcule closedAt uniquement quand l'OF est entièrement terminé, comme la plus récente actualEndAt de ses opérations", () => {
  const notFullyDone = summarizeErpWorkOrder([op({ operationNumber: 1, effectiveStatus: "completed", actualEndAt: "2026-07-20T10:00:00.000Z" }), op({ operationNumber: 2, effectiveStatus: "in-progress", actualEndAt: null })]);
  assert.equal(notFullyDone.closedAt, null, "un OF pas entièrement terminé n'a pas de date de clôture");

  const fullyDone = summarizeErpWorkOrder([op({ operationNumber: 1, effectiveStatus: "completed", actualEndAt: "2026-07-18T08:00:00.000Z" }), op({ operationNumber: 2, effectiveStatus: "completed", actualEndAt: "2026-07-20T10:00:00.000Z" })]);
  assert.equal(fullyDone.closedAt, "2026-07-20T10:00:00.000Z", "la clôture est la plus récente des actualEndAt, pas la première opération");
});

test("summarizeErpWorkOrder reporte firstSeenImportId depuis le work order, null si absent", () => {
  const withImport = summarizeErpWorkOrder([op({ workOrder: { customerName: "EXAIL", firstSeenImportId: "import-42" } })]);
  assert.equal(withImport.firstSeenImportId, "import-42");
  const withoutImport = summarizeErpWorkOrder([op({ workOrder: { customerName: "EXAIL" } })]);
  assert.equal(withoutImport.firstSeenImportId, null);
});

test("summarizeErpWorkOrder calcule hasWaitingOperation indépendamment du statut global affiché (une OF bloquée ET en attente reste repérée)", () => {
  const waiting = summarizeErpWorkOrder([op({ operationNumber: 1, effectiveStatus: "waiting" }), op({ operationNumber: 2, effectiveStatus: "not-started" })]);
  assert.equal(waiting.status, "waiting");
  assert.equal(waiting.hasWaitingOperation, true);

  const blockedAndWaiting = summarizeErpWorkOrder([op({ operationNumber: 1, effectiveStatus: "blocked" }), op({ operationNumber: 2, effectiveStatus: "waiting" })]);
  assert.equal(blockedAndWaiting.status, "blocked", "le statut global affiché reste bloquée, plus prioritaire");
  assert.equal(blockedAndWaiting.hasWaitingOperation, true, "mais l'OF reste repérée comme ayant une opération en attente");

  const none = summarizeErpWorkOrder([op({ operationNumber: 1, effectiveStatus: "in-progress" })]);
  assert.equal(none.hasWaitingOperation, false);
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

test("matchesErpWorkOrderFilters : filtre « clôturées depuis » ne retient que les OF réellement clôturés dans la période", () => {
  const closedRecently = { id: "OF-1", customer: "EXAIL", article: "A100", description: "Bride", dueDate: "2026-07-20", status: "completed", machine: "DMU50", department: "Fraisage", progress: 100, isLate: false, operationCount: 2, closedAt: "2026-07-20", firstSeenImportId: null };
  const closedLongAgo = { ...closedRecently, id: "OF-2", closedAt: "2026-06-01" };
  const notClosed = { ...closedRecently, id: "OF-3", status: "in-progress", closedAt: null };
  const labels = { "not-started": "À faire", "in-progress": "En cours", completed: "Terminée", blocked: "Bloquée", unknown: "À qualifier" };
  const filters = { search: "", statusLabel: "Tous", machine: "Toutes", department: "Tous", delay: "Tous", closedAfter: "2026-07-13" };
  assert.equal(matchesErpWorkOrderFilters(closedRecently, filters, labels), true);
  assert.equal(matchesErpWorkOrderFilters(closedLongAgo, filters, labels), false, "clôturé avant le seuil : exclu");
  assert.equal(matchesErpWorkOrderFilters(notClosed, filters, labels), false, "jamais clôturé : exclu dès qu'un seuil est actif");
  assert.equal(matchesErpWorkOrderFilters(notClosed, { ...filters, closedAfter: null }, labels), true, "sans seuil (« Toutes »), aucun filtrage par clôture");
});

test("matchesErpWorkOrderFilters : filtre « nouvelles depuis le dernier import » ne retient que les OF apparues lors de l'import actif", () => {
  const item = { id: "OF-1", customer: "EXAIL", article: "A100", description: "Bride", dueDate: "2026-07-20", status: "not-started", machine: "DMU50", department: "Fraisage", progress: 0, isLate: false, operationCount: 1, closedAt: null, firstSeenImportId: "import-42" };
  const labels = { "not-started": "À faire", "in-progress": "En cours", completed: "Terminée", blocked: "Bloquée", unknown: "À qualifier" };
  const base = { search: "", statusLabel: "Tous", machine: "Toutes", department: "Tous", delay: "Tous", newOnly: true };
  assert.equal(matchesErpWorkOrderFilters(item, { ...base, activeImportId: "import-42" }, labels), true);
  assert.equal(matchesErpWorkOrderFilters(item, { ...base, activeImportId: "import-41" }, labels), false, "apparue lors d'un import précédent, pas le dernier : exclue");
  assert.equal(matchesErpWorkOrderFilters({ ...item, firstSeenImportId: null }, { ...base, activeImportId: "import-42" }, labels), false, "OF sans firstSeenImportId (avant ce changement) : jamais considérée comme nouvelle");
  assert.equal(matchesErpWorkOrderFilters(item, { ...base, newOnly: false, activeImportId: "import-41" }, labels), true, "case décochée : aucun filtrage par nouveauté");
});

test("matchesErpWorkOrderFilters : onglet « En attente » ne retient que les OF avec au moins une opération en attente", () => {
  const item = { id: "OF-1", customer: "EXAIL", article: "A100", description: "Bride", dueDate: "2026-07-20", status: "blocked", machine: "DMU50", department: "Fraisage", progress: 0, isLate: false, operationCount: 2, closedAt: null, firstSeenImportId: null, hasWaitingOperation: true };
  const labels = { "not-started": "À faire", "in-progress": "En cours", completed: "Terminée", blocked: "Bloquée", unknown: "À qualifier", waiting: "En attente" };
  const filters = { search: "", statusLabel: "Tous", machine: "Toutes", department: "Tous", delay: "Tous", waitingOnly: true };
  assert.equal(matchesErpWorkOrderFilters(item, filters, labels), true, "repérée même si son statut global affiché est « Bloquée »");
  assert.equal(matchesErpWorkOrderFilters({ ...item, hasWaitingOperation: false }, filters, labels), false);
  assert.equal(matchesErpWorkOrderFilters({ ...item, hasWaitingOperation: false }, { ...filters, waitingOnly: false }, labels), true, "sans le filtre actif, aucune restriction");
});

test("le module OF affiche les OF clôturés/nouveaux via des onglets (comme les départements de l'Atelier/Parc Machines), pas un filtre déroulant + une case à cocher", async () => {
  const listModule = await readFile(new URL("../src/features/work-orders/components/WorkOrdersModule.tsx", import.meta.url), "utf8");
  assert.match(listModule, /type WorkOrderView = "all" \| "closed" \| "new" \| "waiting";/);
  assert.match(listModule, /<WorkOrderViewTabButton label="Tous" count={erpSummaries\.length} isSelected={view === "all"} onClick={\(\) => setView\("all"\)} \/>/);
  assert.match(listModule, /<WorkOrderViewTabButton label="Clôturées récemment" count={closedCount} isSelected={view === "closed"} onClick={\(\) => setView\("closed"\)} \/>/);
  assert.match(listModule, /<WorkOrderViewTabButton label="Nouvelles depuis le dernier import" count={newCount} isSelected={view === "new"} onClick={\(\) => setView\("new"\)} \/>/);
  assert.match(listModule, /<WorkOrderViewTabButton label="En attente" count={waitingCount} isSelected={view === "waiting"} onClick={\(\) => setView\("waiting"\)} \/>/);
  assert.doesNotMatch(listModule, /Nouvelles depuis le dernier import<\/label>|type="checkbox" checked={newOnly}/, "la case à cocher séparée a bien disparu, remplacée par l'onglet");
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

test("la fiche OF ERP permet de changer le statut et d'ajouter une remarque sur chaque opération, en plus de l'Atelier", async () => {
  const detail = await readFile(new URL("../src/features/work-orders/components/WorkOrderDetail.tsx", import.meta.url), "utf8");
  assert.match(detail, /import \{ applyOperationPatchLocally, type OperationViewLocalPatch \} from "@\/features\/erp-import\/services\/operation-view-local-patch";/, "réutilise la même mise à jour optimiste locale que l'Atelier, pas une nouvelle logique");
  assert.match(detail, /const updateStatus = \(operationId: string, status: OperationView\["status"\]\) => void patchOperation\(operationId, \{ status \}, "Le statut n.a pas pu être modifié\."\);/);
  assert.match(detail, /const updateComment = \(operationId: string, comment: string\) => void patchOperation\(operationId, \{ comment: comment\.trim\(\) \|\| null \}, "La remarque n.a pas pu être modifiée\."\);/);
  assert.match(detail, /<select className={`\$\{fieldClass\} h-8 py-0 text-xs`} value={row\.effectiveStatus} onChange={\(event\) => updateStatus\(row\.id, event\.target\.value as OperationView\["status"\]\)}>/, "le statut de chaque opération est éditable, plus un simple badge en lecture seule");
  assert.match(detail, /onBlur={\(event\) => \{ if \(event\.target\.value\.trim\(\) !== \(row\.comment \?\? ""\)\) updateComment\(row\.id, event\.target\.value\); \}}/, "la remarque se saisit directement dans le tableau des opérations");
  assert.match(detail, /const current = rows\.find\(\(row\) => row\.effectiveStatus === "blocked"\) \?\? rows\.find\(\(row\) => row\.effectiveStatus === "waiting"\) \?\? rows\.find\(\(row\) => row\.effectiveStatus === "in-progress"\) \?\? rows\[0\];/, "l'opération « courante » affichée en tête de fiche suit la même priorité que deriveErpWorkOrderStatus");
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
