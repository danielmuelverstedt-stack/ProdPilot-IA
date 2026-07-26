import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { ISSUE_LABELS, collectIssueCategories, issueIsPerWorkOrder, priorityScore, rowIssueLabels } from "../src/features/erp-import/services/operation-quality-scoring.ts";
import { applyOperationPatchLocally, isLocallyPatchable } from "../src/features/erp-import/services/operation-view-local-patch.ts";
import { fetchErpPlanningRows, invalidateErpPlanningRowsCache } from "../src/features/erp-import/services/erp-planning-rows-fetch-cache.ts";

// --- operation-quality-scoring.ts ------------------------------------------------------------

test("priorityScore combine retard (plafonné à 50), priorité ERP (plafonnée à 25), bonus en cours/sous-traité et anomalies (plafonnées à 10)", () => {
  assert.equal(priorityScore(null, 0, "not-started", false, 0), 0);
  assert.equal(priorityScore(10, 0, "not-started", false, 0), 20, "10 jours de retard × 2");
  assert.equal(priorityScore(100, 0, "not-started", false, 0), 50, "plafonné à 50 points même très en retard");
  assert.equal(priorityScore(0, 999, "not-started", false, 0), 25, "priorité ERP plafonnée à 25 points");
  assert.equal(priorityScore(0, 0, "in-progress", false, 0), 10);
  assert.equal(priorityScore(0, 0, "not-started", true, 0), 5);
  assert.equal(priorityScore(0, 0, "not-started", false, 20), 10, "20 anomalies plafonnées à 10 points (2 par anomalie)");
});

test("collectIssueCategories signale machine/date/priorité/tâche manquantes à partir des champs source, pas des champs effectifs", () => {
  const operation = { id: "op-1", workOrderId: "OF-1", sourceMachineCode: null, dueDate: null, sourcePriority: 0, taskCode: "0", sourceMacroRangeCode: "0", articleCode: "A1", sourceStatus: "unknown", duplicateOf: null, actualStartAt: null, actualEndAt: null };
  const categories = collectIssueCategories(operation, null, null);
  assert.ok(categories.includes("missing-machine"));
  assert.ok(categories.includes("missing-date"));
  assert.ok(categories.includes("missing-priority"));
  assert.ok(categories.includes("missing-task"));
  assert.ok(categories.includes("unknown-macro-range"));
  assert.ok(categories.includes("missing-work-order"));
  assert.ok(categories.includes("unknown-status"));
});

test("rowIssueLabels ajoute délai/priorité/statut manquants calculés sur les valeurs effectives, sans dupliquer une catégorie déjà présente", () => {
  const operation = { id: "op-1", workOrderId: "OF-1", sourceMachineCode: "M1", dueDate: "2026-01-01", sourcePriority: 5, taskCode: "5", sourceMacroRangeCode: "10", articleCode: "A1", sourceStatus: "not-started", duplicateOf: null, actualStartAt: null, actualEndAt: null };
  const labels = rowIssueLabels(operation, null, "machine-1", null, 0, "unknown");
  assert.ok(labels.includes(ISSUE_LABELS["missing-date"]));
  assert.ok(labels.includes(ISSUE_LABELS["missing-priority"]));
  assert.ok(labels.includes(ISSUE_LABELS["unknown-status"]));
  assert.equal(labels.filter((label) => label === ISSUE_LABELS["missing-date"]).length, 1, "pas de doublon");
});

test("issueIsPerWorkOrder distingue les anomalies comptées par OF de celles comptées par opération", () => {
  assert.equal(issueIsPerWorkOrder("missing-customer"), true);
  assert.equal(issueIsPerWorkOrder("missing-machine"), false);
});

// --- operation-view-local-patch.ts ------------------------------------------------------------

function baseRow(overrides = {}) {
  return {
    id: "op-1", operationIdentity: "op-1", workOrderId: "OF-1", operationNumber: 1, taskCode: "5", articleCode: "A1",
    description: "Pièce", subcontracted: false, dueDate: "2026-01-10", actualStartAt: null, actualEndAt: null,
    status: "not-started", machine: "CV5-500", machineId: "cv5-500", priority: 5, userPriority: null, comment: null,
    manualOrder: null, isLocked: false, hasPlannedMachine: true, hasUserPriority: false, hasComment: false,
    hasManualOrder: false, isRemoved: false, isVisible: true, isWithoutMachine: false, isLate: null, isStarted: null,
    isFinished: null, isBlocked: null, estimatedStart: null, estimatedEnd: null, capacityGroup: null, department: "Fraisage",
    resourceGroup: null, workOrder: { id: "OF-1", customerName: "EXAIL" }, sourceMachineCode: "M1", sourceMachineDescription: null,
    erpMachineCode: "M1", sourcePriority: 5, effectivePriority: 5, sourceStatus: "not-started", effectiveStatus: "not-started",
    sourceOperationStatusId: 1, sourceOrderStatus: "OUVERT", sourceMacroRangeCode: "10", sourceRow: 1, duplicateOf: null,
    plannedDate: "2026-01-10", delayDays: -3, priorityScore: 12, articleWorkOrderCount: 2, hasManualOverride: false, issues: [],
    ...overrides,
  };
}

test("applyOperationPatchLocally(priorité) met à jour effectivePriority/userPriority/hasUserPriority/hasManualOverride et recalcule priorityScore", () => {
  const row = baseRow();
  const patched = applyOperationPatchLocally(row, { priority: 40 });
  assert.equal(patched.priority, 40);
  assert.equal(patched.effectivePriority, 40);
  assert.equal(patched.userPriority, 40);
  assert.equal(patched.hasUserPriority, true);
  assert.equal(patched.hasManualOverride, true);
  assert.equal(patched.priorityScore, priorityScore(row.delayDays, 40, row.effectiveStatus, row.subcontracted, row.issues.length));
  assert.deepEqual(patched.delayDays, row.delayDays, "delayDays dépend du dataset complet, jamais recalculé localement");
  assert.equal(patched.articleWorkOrderCount, row.articleWorkOrderCount);
  assert.equal(patched.department, row.department);
});

test("applyOperationPatchLocally(priorité à 0) ajoute l'anomalie « Priorité à zéro » ; la retirer la fait disparaître", () => {
  const row = baseRow();
  const zeroed = applyOperationPatchLocally(row, { priority: 0 });
  assert.ok(zeroed.issues.includes(ISSUE_LABELS["missing-priority"]));
  const restored = applyOperationPatchLocally(zeroed, { priority: 3 });
  assert.ok(!restored.issues.includes(ISSUE_LABELS["missing-priority"]));
});

test("applyOperationPatchLocally(machine) bascule isWithoutMachine/hasPlannedMachine et l'anomalie « Machine non définie »", () => {
  const row = baseRow();
  const unassigned = applyOperationPatchLocally(row, { machineId: null });
  assert.equal(unassigned.machineId, null);
  assert.equal(unassigned.machine, "Non définie");
  assert.equal(unassigned.isWithoutMachine, true);
  assert.ok(unassigned.issues.includes(ISSUE_LABELS["missing-machine"]));
  const reassigned = applyOperationPatchLocally(unassigned, { machineId: "dmu50" });
  assert.equal(reassigned.machineId, "dmu50");
  assert.equal(reassigned.machine, "dmu50");
  assert.equal(reassigned.isWithoutMachine, false);
  assert.equal(reassigned.hasPlannedMachine, true);
  assert.ok(!reassigned.issues.includes(ISSUE_LABELS["missing-machine"]));
});

test("applyOperationPatchLocally(date) bascule l'anomalie « Délai manquant »", () => {
  const row = baseRow();
  const cleared = applyOperationPatchLocally(row, { plannedDate: null });
  assert.equal(cleared.plannedDate, null);
  assert.ok(cleared.issues.includes(ISSUE_LABELS["missing-date"]));
});

test("applyOperationPatchLocally(statut) met à jour status et effectiveStatus ensemble, bascule « Statut non reconnu » et le bonus en cours du score", () => {
  const row = baseRow();
  const inProgress = applyOperationPatchLocally(row, { status: "in-progress" });
  assert.equal(inProgress.status, "in-progress");
  assert.equal(inProgress.effectiveStatus, "in-progress");
  assert.equal(inProgress.priorityScore, priorityScore(row.delayDays, row.priority, "in-progress", row.subcontracted, row.issues.length));
  const unknown = applyOperationPatchLocally(row, { status: "unknown" });
  assert.ok(unknown.issues.includes(ISSUE_LABELS["unknown-status"]));
});

test("applyOperationPatchLocally(commentaire) met à jour comment/hasComment sans toucher issues ni priorityScore", () => {
  const row = baseRow();
  const commented = applyOperationPatchLocally(row, { comment: "Urgent" });
  assert.equal(commented.comment, "Urgent");
  assert.equal(commented.hasComment, true);
  assert.deepEqual(commented.issues, row.issues);
  assert.equal(commented.priorityScore, row.priorityScore);
  const cleared = applyOperationPatchLocally(commented, { comment: "" });
  assert.equal(cleared.hasComment, false);
});

test("isLocallyPatchable accepte uniquement les clés gérées par applyOperationPatchLocally", () => {
  assert.equal(isLocallyPatchable({ priority: 5 }), true);
  assert.equal(isLocallyPatchable({ machineId: "m1", status: "in-progress" }), true);
  assert.equal(isLocallyPatchable({}), true);
  assert.equal(isLocallyPatchable({ visible: true }), false, "visible n'est pas géré localement, doit replier sur un rechargement complet");
  assert.equal(isLocallyPatchable({ priority: 5, locked: true }), false, "un seul champ non géré suffit à refuser le patch local");
});

// --- erp-planning-rows-fetch-cache.ts ---------------------------------------------------------

function withMockedFetch(rowsPerCall, run) {
  const originalFetch = globalThis.fetch;
  let callCount = 0;
  globalThis.fetch = async () => {
    callCount += 1;
    const rows = typeof rowsPerCall === "function" ? rowsPerCall(callCount) : rowsPerCall;
    return { ok: true, json: async () => ({ rows, total: rows.length, page: 1, pageSize: 50000 }) };
  };
  return run(() => callCount).finally(() => { globalThis.fetch = originalFetch; });
}

test("fetchErpPlanningRows ne refait pas de requête réseau tant que le cache n'est pas invalidé", async () => {
  invalidateErpPlanningRowsCache();
  await withMockedFetch([{ id: "a" }], async (getCallCount) => {
    const first = await fetchErpPlanningRows();
    const second = await fetchErpPlanningRows();
    assert.deepEqual(first, [{ id: "a" }]);
    assert.deepEqual(second, [{ id: "a" }]);
    assert.equal(getCallCount(), 1, "une seule requête réseau pour deux appels consécutifs");
  });
});

test("invalidateErpPlanningRowsCache force le prochain appel à refaire une vraie requête réseau", async () => {
  invalidateErpPlanningRowsCache();
  await withMockedFetch((call) => [{ id: `call-${call}` }], async (getCallCount) => {
    const first = await fetchErpPlanningRows();
    invalidateErpPlanningRowsCache();
    const second = await fetchErpPlanningRows();
    assert.notDeepEqual(first, second);
    assert.equal(getCallCount(), 2);
  });
});

test("des appels concurrents avant résolution partagent la même requête réseau en vol (dédoublonnage)", async () => {
  invalidateErpPlanningRowsCache();
  await withMockedFetch([{ id: "shared" }], async (getCallCount) => {
    const [first, second] = await Promise.all([fetchErpPlanningRows(), fetchErpPlanningRows()]);
    assert.deepEqual(first, second);
    assert.equal(getCallCount(), 1, "les deux appels lancés avant la résolution du premier ne doivent déclencher qu'une seule requête");
  });
});

// --- Câblage optimiste : gardes de texte source ------------------------------------------------

test("les mutations unitaires de useWorkshopOperations sont optimistes : aucun rechargement complet, seule une erreur restaure la ligne précédente", async () => {
  const hook = await readFile(new URL("../src/features/planning/hooks/useWorkshopOperations.ts", import.meta.url), "utf8");
  const patchOneBody = hook.slice(hook.indexOf("const patchOneOptimistically"), hook.indexOf("const updatePriority"));
  assert.doesNotMatch(patchOneBody, /await load\(\)/, "une mutation unitaire ne doit plus recharger tout le jeu de données");
  assert.match(patchOneBody, /applyOperationPatchLocally\(row, patch\)/);
  assert.match(patchOneBody, /invalidateErpPlanningRowsCache\(\)/);
  assert.match(hook, /const updatePriority = useCallback/, "identité stable requise pour que React.memo des lignes fonctionne");
  assert.match(hook, /const updateMachine = useCallback/);
  assert.match(hook, /const updatePlacement = useCallback/);
});

test("les mutations groupées de useWorkshopOperations envoient leurs PATCH en parallèle (Promise.allSettled), pas en boucle séquentielle", async () => {
  const hook = await readFile(new URL("../src/features/planning/hooks/useWorkshopOperations.ts", import.meta.url), "utf8");
  assert.match(hook, /Promise\.allSettled\(entries\.map\(\(entry\) => patchOperationRemote/);
  assert.doesNotMatch(hook, /for \(const entry of changed\) await patchOperation/, "l'ancienne boucle séquentielle a disparu");
});

test("le Cockpit ERP applique le même patch optimiste pour les champs gérés localement, avec un filet de sécurité (rechargement complet) pour les autres", async () => {
  const workspace = await readFile(new URL("../src/features/erp-import/components/ErpPlanningWorkspace.tsx", import.meta.url), "utf8");
  assert.match(workspace, /if \(isLocallyPatchable\(patch\)\) \{/);
  assert.match(workspace, /applyOperationPatchLocally\(row, localPatch\)/);
  assert.match(workspace, /const updateOperation = useCallback/);
  assert.match(workspace, /const openWorkOrder = useCallback/);
  // Le filet de sécurité (champs non gérés localement, ex. visible/locked) doit garder l'ancien
  // rechargement complet : le motif doit encore exister dans updateOperation.
  const updateOperationBody = workspace.slice(workspace.indexOf("const updateOperation = useCallback"), workspace.indexOf("async function saveMapping"));
  assert.match(updateOperationBody, /await Promise\.all\(\[loadOverview\(\), loadRows\(\)\]\)/);
});

test("le fetch partagé /api/erp/planning est utilisé par l'Atelier et le Cockpit ERP, au lieu de deux fetch indépendants", async () => {
  const hook = await readFile(new URL("../src/features/planning/hooks/useWorkshopOperations.ts", import.meta.url), "utf8");
  const workspace = await readFile(new URL("../src/features/erp-import/components/ErpPlanningWorkspace.tsx", import.meta.url), "utf8");
  assert.match(hook, /fetchErpPlanningRows\(\)/);
  assert.match(workspace, /fetchErpPlanningRows\(\)/);
  assert.doesNotMatch(hook, /fetch\("\/api\/erp\/planning\?scope=workbench&pageSize=50000"/, "ne doit plus fetch directement, passe par le cache partagé");
  assert.doesNotMatch(workspace, /fetch\("\/api\/erp\/planning\?scope=workbench&pageSize=50000"/, "ne doit plus fetch directement, passe par le cache partagé");
});

test("WorkshopOperationRow et OperationRow (Cockpit ERP) sont mémoïsés, avec des callbacks stables passés par les parents", async () => {
  const row = await readFile(new URL("../src/features/planning/components/WorkshopOperationRow.tsx", import.meta.url), "utf8");
  const operations = await readFile(new URL("../src/features/erp-import/components/ErpPlanningOperations.tsx", import.meta.url), "utf8");
  const panel = await readFile(new URL("../src/features/planning/components/WorkshopMachinePanel.tsx", import.meta.url), "utf8");
  assert.match(row, /export const WorkshopOperationRow = memo\(function WorkshopOperationRow/);
  assert.match(operations, /const OperationRow = memo\(function OperationRow/);
  // Les callbacks passés à WorkshopOperationRow doivent rester stables (useCallback + ref, pas
  // une closure recréée à chaque rendu de WorkshopMachinePanel) pour que la mémoïsation serve.
  assert.match(panel, /const operationsRef = useRef\(operations\)/);
  assert.match(panel, /const handleReorder = useCallback/);
  assert.match(panel, /const handleRenumber = useCallback/);
});
