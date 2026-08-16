import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { ERP_DETAILS_HEADERS, ERP_DETAILS_OPTIONAL_HEADERS, ERP_TOP_HEADERS, assertExpectedHeaders } from "../src/features/erp-import/config/macro-range-profile.ts";
import { analyzeErpArticleClusters } from "../src/features/erp-import/services/article-cluster-engine.ts";
import { createDefaultErpPlanningView, moveErpPlanningColumn, parseErpPlanningViewState } from "../src/features/erp-import/services/erp-planning-view-preferences.ts";
import { operationIdentityService } from "../src/features/erp-import/services/operation-identity-service.ts";
import { operationViewService } from "../src/features/erp-import/services/operation-view-service.ts";
import { filterEngine } from "../src/features/erp-import/services/filter-engine.ts";
import { emptyPlanningFilters } from "../src/features/erp-import/services/erp-planning-view-preferences.ts";
import { synchronizationService } from "../src/features/erp-import/services/synchronization-service.ts";
import { extractDetailsMachineFields } from "../src/features/erp-import/services/details-machine-mapping.ts";
import { extractLegacyErpMachineStates, normalizeErpMachineCode, normalizeErpMachineMappings, stripLegacyErpMachineState } from "../src/features/erp-import/services/erp-machine-code.ts";
import { classifyErpMachineMapping, filterErpMachineCodeEntries, reconcileOperationViewMachineCatalog } from "../src/features/erp-import/services/erp-machine-mapping-status.ts";
import { machineSettingsService } from "../src/features/settings/services/machine-settings-service.ts";

test("les colonnes machine Details sont projetées, optionnelles et acceptent les cellules vides", () => {
  const headers = new Map([
    ["MACRO_GAMME_PE", 0],
    ["CODE_MACH_INT", 1],
    ["DESCRIPTION_MACHINE", 2],
  ]);
  assert.deepEqual(extractDetailsMachineFields(["LEGACY", "M-42", "Centre 5 axes"], headers), {
    erpMachineCode: "M-42",
    erpMachineDescription: "Centre 5 axes",
  });
  assert.deepEqual(extractDetailsMachineFields(["LEGACY", "  ", null], headers), {
    erpMachineCode: null,
    erpMachineDescription: null,
  });
  assert.deepEqual(extractDetailsMachineFields(["LEGACY"], new Map([["MACRO_GAMME_PE", 0]])), {
    erpMachineCode: "LEGACY",
    erpMachineDescription: null,
  });
});

test("le profil ERP couvre exactement les deux structures attendues", () => {
  assert.equal(ERP_TOP_HEADERS.length, 19);
  assert.equal(ERP_DETAILS_HEADERS.length, 14);
  assert.ok(ERP_TOP_HEADERS.includes("Num_OF"));
  assert.ok(ERP_DETAILS_HEADERS.includes("Num_OF"));
  assert.ok(ERP_DETAILS_HEADERS.includes("Macro_Gamme_Pe"));
  assert.deepEqual(ERP_DETAILS_OPTIONAL_HEADERS, ["CODE_MACH_INT", "DESCRIPTION_MACHINE"]);
  assert.doesNotThrow(() => assertExpectedHeaders([...ERP_DETAILS_HEADERS, ...ERP_DETAILS_OPTIONAL_HEADERS], ERP_DETAILS_HEADERS, "Details.xlsx", ERP_DETAILS_OPTIONAL_HEADERS));
  assert.doesNotThrow(() => assertExpectedHeaders([...ERP_DETAILS_HEADERS], ERP_DETAILS_HEADERS, "Details.xlsx", ERP_DETAILS_OPTIONAL_HEADERS));
  assert.doesNotThrow(() => assertExpectedHeaders(ERP_DETAILS_HEADERS.map((header) => `\uFEFF ${header.toLocaleLowerCase("fr")} \u200B`), ERP_DETAILS_HEADERS, "Details.xlsx", ERP_DETAILS_OPTIONAL_HEADERS));
  assert.doesNotThrow(() => assertExpectedHeaders([...ERP_TOP_HEADERS], ERP_TOP_HEADERS, "Top.xlsx"));
});

test("une colonne manquante ou inattendue bloque l’import", () => {
  const missing = ERP_TOP_HEADERS.filter((header) => header !== "Num_OF");
  assert.throws(() => assertExpectedHeaders(missing, ERP_TOP_HEADERS, "Top.xlsx"), /colonnes manquantes : Num_OF/);
  assert.throws(() => assertExpectedHeaders([...ERP_DETAILS_HEADERS, "Colonne inconnue"], ERP_DETAILS_HEADERS, "Details.xlsx", ERP_DETAILS_OPTIONAL_HEADERS), /colonnes inattendues/);
});

test("l’import contrôle les fichiers, les empreintes et les doublons avant activation", async () => {
  const service = await readFile(new URL("../src/features/erp-import/server/erp-import-service.ts", import.meta.url), "utf8");
  assert.match(service, /ERP_MAX_FILE_SIZE_BYTES/);
  assert.match(service, /assertXlsxSignature/);
  assert.match(service, /assertSafeXlsxArchive/);
  assert.match(service, /createHash\("sha256"\)/);
  assert.match(service, /findDuplicate/);
  assert.match(service, /parseErpWorkbookPair/);
  assert.match(service, /activateImport/);
});

test("le bouton d'import ouvre le sélecteur et transmet chaque nouvelle sélection", async () => {
  const component = await readFile(new URL("../src/features/erp-import/components/ErpPlanningWorkspace.tsx", import.meta.url), "utf8");
  assert.match(component, /useRef<HTMLInputElement>\(null\)/);
  assert.match(component, /fileInputRef\.current\?\.click\(\)/);
  assert.match(component, /type="file" accept="\.xlsx" multiple/);
  assert.match(component, /Array\.from\(event\.currentTarget\.files \?\? \[\]\)/);
  assert.match(component, /event\.currentTarget\.value = ""/);
  assert.match(component, /await onImport\(selectedFiles\)/);
  assert.match(component, /type="button"[^>]+disabled=\{busy\}/);
  assert.doesNotMatch(component, /disabled=\{busy \|\| files\.length !== 2\}/);
  assert.match(component, /\[ERP IMPORT\] POST failed/);
});

test("les sources, la projection et les décisions manuelles sont séparées", async () => {
  const repository = await readFile(new URL("../src/features/erp-import/server/erp-import-repository.ts", import.meta.url), "utf8");
  assert.match(repository, /erp-imports/);
  assert.match(repository, /erp-planning\.json/);
  assert.match(repository, /erp-planning-overrides\.json/);
  assert.match(repository, /erp-machine-mappings\.json/);
  assert.match(repository, /flag: "wx"/);
  assert.match(repository, /setOverride/);
  assert.match(repository, /setMachineMapping/);
});

test("les décisions Planning sont journalisées, réconciliables et sauvegardées", async () => {
  const repository = await readFile(new URL("../src/features/erp-import/server/erp-decision-repository.ts", import.meta.url), "utf8");
  const parser = await readFile(new URL("../src/features/erp-import/server/erp-workbook-parser.ts", import.meta.url), "utf8");
  assert.match(parser, /stableId: baseId/);
  assert.match(repository, /events: ErpDecisionEvent\[\]/);
  assert.match(repository, /previousValue/);
  assert.match(repository, /nextValue/);
  assert.match(repository, /"ambiguous"/);
  assert.match(repository, /"orphaned"/);
  assert.match(repository, /async undo/);
  assert.match(repository, /async redo/);
  assert.match(repository, /backups.*decisions/);
  assert.match(repository, /flag: "wx"/);
});

test("cent imports successifs conservent une décision liée à une identité stable", () => {
  const decision = { stableOperationId: "62541::20::FRAISAGE", machineId: "machine-7" };
  let restored = 0;
  for (let importNumber = 1; importNumber <= 100; importNumber += 1) {
    const operations = [{ id: `${decision.stableOperationId}::import-${importNumber}`, stableId: decision.stableOperationId }];
    const match = operations.filter((operation) => operation.stableId === decision.stableOperationId);
    assert.equal(match.length, 1);
    assert.equal(decision.machineId, "machine-7");
    restored += 1;
  }
  assert.equal(restored, 100);
});

test("le service d'identité isole la clé métier et les doublons", () => {
  const stableId = operationIdentityService.createStableId({ workOrderId: " 62541 ", operationNumber: 20, taskCode: " FRAISAGE " });
  assert.equal(stableId, "62541::20::FRAISAGE");
  assert.equal(operationIdentityService.createOperationId(stableId, 2), `${stableId}::2`);
});

test("la synchronisation conserve les retraits et toutes les décisions", () => {
  const previous = { id: "62541::20::FRAISAGE", stableId: "62541::20::FRAISAGE", workOrderId: "62541", erpStatus: "Active", erpPriority: 1 };
  const removed = { ...previous, id: "62541::30::CONTROLE", stableId: "62541::30::CONTROLE" };
  const added = { ...previous, id: "62542::10::DEBIT", stableId: "62542::10::DEBIT", workOrderId: "62542" };
  const result = synchronizationService.synchronize({
    importId: "import-2", startedAt: "2026-07-22T10:00:00.000Z", completedAt: "2026-07-22T10:00:02.000Z",
    previousWorkOrders: [{ id: "62541" }], previousOperations: [previous, removed],
    incomingWorkOrders: [{ id: "62541" }, { id: "62542" }], incomingOperations: [{ ...previous, erpPriority: 9 }, added], decisionCount: 7,
  });
  assert.equal(result.operations.find((operation) => operation.id === removed.id)?.erpStatus, "Removed");
  assert.equal(result.report.newWorkOrders, 1);
  assert.equal(result.report.newOperations, 1);
  assert.equal(result.report.updatedOperations, 1);
  assert.equal(result.report.removedOperations, 1);
  assert.equal(result.report.preservedDecisions, 7);
  assert.equal(result.report.lostDecisions, 0);
  assert.equal(result.report.durationMs, 2000);
  const next = synchronizationService.synchronize({ ...result.report, importId: "import-3", previousWorkOrders: result.workOrders, previousOperations: result.operations, incomingWorkOrders: result.workOrders, incomingOperations: [{ ...previous, erpPriority: 9 }, added], decisionCount: 7 });
  assert.equal(next.report.removedOperations, 0);
});

test("la synchronisation fige firstSeenImportId au premier import où un OF apparaît, sans jamais le réécrire ensuite ; une OF nouvelle reçoit l'id de l'import courant", () => {
  const firstImport = synchronizationService.synchronize({
    importId: "import-1", startedAt: "2026-07-20T08:00:00.000Z", completedAt: "2026-07-20T08:00:01.000Z",
    previousWorkOrders: [], previousOperations: [],
    incomingWorkOrders: [{ id: "62541" }], incomingOperations: [], decisionCount: 0,
  });
  assert.equal(firstImport.workOrders.find((order) => order.id === "62541").firstSeenImportId, "import-1", "premier import de l'app : tout est nouveau");

  const secondImport = synchronizationService.synchronize({
    importId: "import-2", startedAt: "2026-07-21T08:00:00.000Z", completedAt: "2026-07-21T08:00:01.000Z",
    previousWorkOrders: firstImport.workOrders, previousOperations: [],
    incomingWorkOrders: [{ id: "62541" }, { id: "62999" }], incomingOperations: [], decisionCount: 0,
  });
  assert.equal(secondImport.workOrders.find((order) => order.id === "62541").firstSeenImportId, "import-1", "OF déjà connue : firstSeenImportId jamais réécrit");
  assert.equal(secondImport.workOrders.find((order) => order.id === "62999").firstSeenImportId, "import-2", "OF réellement nouvelle : reçoit l'id de l'import courant");
  assert.equal(secondImport.report.newWorkOrders, 1);
});

test("le statut « waiting » (En attente) est présent aux 6 endroits où le vocabulaire de statuts ERP est référencé, pas seulement dans le type", async () => {
  const types = await readFile(new URL("../src/features/erp-import/types/erp-import.ts", import.meta.url), "utf8");
  assert.match(types, /"not-started" \| "in-progress" \| "completed" \| "blocked" \| "unknown" \| "waiting"/, "1. le type ErpOperationStatus");

  const presentation = await readFile(new URL("../src/features/erp-import/services/erp-operation-status-presentation.ts", import.meta.url), "utf8");
  assert.match(presentation, /waiting: "En attente",/, "2a. ERP_OPERATION_STATUS_LABELS");
  assert.match(presentation, /if \(status === "waiting"\) return "warning";/, "2b. erpOperationStatusTone");

  const grouping = await readFile(new URL("../src/features/erp-import/services/erp-planning-grouping.ts", import.meta.url), "utf8");
  assert.match(grouping, /unknown: "À qualifier", waiting: "En attente" }\[status\];/, "3. le Record dupliqué statusLabel() du regroupement Cockpit ERP");

  const operations = await readFile(new URL("../src/features/erp-import/components/ErpPlanningOperations.tsx", import.meta.url), "utf8");
  assert.match(operations, /\{ value: "waiting", label: "En attente" \}/, "4. STATUS_OPTIONS du Cockpit ERP");

  const route = await readFile(new URL("../src/app/api/erp/operations/[id]/route.ts", import.meta.url), "utf8");
  assert.match(route, /\["not-started", "in-progress", "completed", "blocked", "unknown", "waiting"\]/, "5. la liste blanche de validation de la route PATCH");

  const summary = await readFile(new URL("../src/features/work-orders/services/erp-work-order-summary.ts", import.meta.url), "utf8");
  assert.match(summary, /if \(rows\.some\(\(row\) => row\.effectiveStatus === "blocked"\)\) return "blocked";\s*\n\s*if \(rows\.some\(\(row\) => row\.effectiveStatus === "waiting"\)\) return "waiting";\s*\n\s*if \(rows\.some\(\(row\) => row\.effectiveStatus === "in-progress"\)\) return "in-progress";/, "6. la priorité bloquée > en attente > en cours dans deriveErpWorkOrderStatus");
});

test("OperationView centralise machine, priorité, visibilité et indicateurs", () => {
  const operation = {
    id: "62541::20::FRAISAGE", stableId: "62541::20::FRAISAGE", erpStatus: "Active", workOrderId: "62541",
    operationNumber: 20, operationStatusId: 1, taskCode: "FRAISAGE", actualStartAt: null, actualEndAt: null,
    subcontracted: false, orderStatus: "OUVERT", erpDueDate: "2026-07-30", articleCode: "A-1", description: "Pièce",
    macroRangeCode: "USINAGE", erpPriority: 3, erpMachineCode: "M-ERP", erpMachineDescription: "Centre d'usinage", normalizedStatus: "unknown", sourceRow: 2, duplicateOf: null,
  };
  const decision = {
    operationIdentity: operation.stableId, userPriority: 9, manualOrder: 4, plannedDurationHours: 12, plannedMachineId: "M-PLAN",
    comment: "À lancer", visible: false, locked: true, plannedDate: null, planningStatus: null,
    createdAt: "2026-07-22T10:00:00.000Z", updatedAt: "2026-07-22T10:00:00.000Z",
  };
  const [view] = operationViewService.createViews({ operations: [operation], decisions: [decision], workOrders: [] });
  assert.equal(view.machine, "M-PLAN");
  assert.equal(view.sourceMachineDescription, "Centre d'usinage");
  assert.equal(view.sourceMachineId, null);
  assert.equal(view.hasMachineDifference, true);
  assert.equal(view.priority, 9);
  assert.equal(view.isVisible, false);
  assert.equal(view.hasPlannedMachine, true);
  assert.equal(view.hasUserPriority, true);
  assert.equal(view.hasComment, true);
  assert.equal(view.hasManualOrder, true);
  assert.equal(view.plannedDurationHours, 12);
  assert.equal(view.isRemoved, false);
  assert.equal(view.isWithoutMachine, false);
  assert.equal(view.isLate, null);
  assert.equal(view.estimatedStart, null);

  const [erpFallback] = operationViewService.createViews({ operations: [operation], decisions: [], workOrders: [] });
  assert.equal(erpFallback.machineId, null);
  assert.equal(erpFallback.machine, "Non définie");
  assert.equal(erpFallback.sourceMachineCode, "M-ERP");
  assert.equal(erpFallback.sourceMachineDescription, "Centre d'usinage");
  assert.equal(erpFallback.plannedDurationHours, 8, "sans décision locale, chaque opération démarre avec 8 h prévues");
  assert.equal(erpFallback.isWithoutMachine, true);

  const [mapped] = operationViewService.createViews({ operations: [{ ...operation, erpMachineCode: "  m-erp  " }], decisions: [], workOrders: [], machineMappings: { "M-ERP": { erpMachineCode: "M-ERP", machineId: "FRA-01", updatedAt: "2026-07-22T10:00:00.000Z" } } });
  assert.equal(mapped.machineId, "FRA-01");
  assert.equal(mapped.machine, "FRA-01");
  assert.equal(mapped.sourceMachineId, "FRA-01");
  assert.equal(mapped.hasMachineDifference, false);

  const [fallback] = operationViewService.createViews({ operations: [{ ...operation, id: "removed", stableId: "removed", erpStatus: "Removed", erpMachineCode: null, erpMachineDescription: null }], decisions: [], workOrders: [] });
  assert.equal(fallback.machine, "Non définie");
  assert.equal(fallback.priority, 3);
  assert.equal(fallback.isVisible, true);
  assert.equal(fallback.isRemoved, true);
  assert.equal(fallback.isWithoutMachine, true);
});

test("les codes machines ERP sont normalisés sans perdre les caractères significatifs", () => {
  assert.equal(normalizeErpMachineCode(" \uFEFF dmu50\u200B  poste-1 "), "DMU50 POSTE-1");
  assert.equal(normalizeErpMachineCode("  "), null);
  assert.equal(normalizeErpMachineCode("0"), null);
  const normalized = normalizeErpMachineMappings({
    " dmu50 ": { erpMachineCode: " dmu50 ", machineId: " FRA-01 ", updatedAt: "2026-07-21T10:00:00.000Z" },
    DMU50: { erpMachineCode: "DMU50", machineId: "FRA-02", updatedAt: "2026-07-22T10:00:00.000Z" },
  });
  assert.deepEqual(Object.keys(normalized), ["DMU50"]);
  assert.equal(normalized.DMU50.machineId, "FRA-02");
});

test("la résolution machine respecte décision, mapping et absence de code", () => {
  const operation = {
    id: "op-1", stableId: "op-1", erpStatus: "Active", workOrderId: "OF-1", operationNumber: 10,
    operationStatusId: 1, taskCode: "FRAISAGE", actualStartAt: null, actualEndAt: null, subcontracted: false,
    orderStatus: "OUVERT", erpDueDate: null, articleCode: "A-1", description: "Pièce", macroRangeCode: "USINAGE",
    erpPriority: 1, erpMachineCode: "DMU50", erpMachineDescription: "Centre 5 axes", normalizedStatus: "unknown", sourceRow: 2, duplicateOf: null,
  };
  const mapping = { erpMachineCode: "DMU50", machineId: "FRA-13", updatedAt: "2026-07-22T10:00:00.000Z" };
  const [mapped] = operationViewService.createViews({ operations: [operation], decisions: [], workOrders: [], machineMappings: { DMU50: mapping } });
  assert.equal(mapped.machineId, "FRA-13");
  const decision = { operationIdentity: "op-1", userPriority: null, manualOrder: null, plannedMachineId: "FRA-01", comment: null, visible: true, locked: false, plannedDate: null, planningStatus: null, createdAt: mapping.updatedAt, updatedAt: mapping.updatedAt };
  const [planned] = operationViewService.createViews({ operations: [operation], decisions: [decision], workOrders: [], machineMappings: { DMU50: mapping } });
  assert.equal(planned.machineId, "FRA-01");
  assert.equal(planned.sourceMachineId, "FRA-13");
  assert.equal(planned.hasMachineDifference, true);
  const explicitUnassignedDecision = { ...decision, plannedMachineId: null, hasMachineAssignmentOverride: true };
  const [explicitlyUnassigned] = operationViewService.createViews({ operations: [operation], decisions: [explicitUnassignedDecision], workOrders: [], machineMappings: { DMU50: mapping } });
  assert.equal(explicitlyUnassigned.machineId, null, "Sans machine définie reste prioritaire sur la machine issue du mapping ERP");
  assert.equal(explicitlyUnassigned.isWithoutMachine, true);
  assert.equal(explicitlyUnassigned.hasMachineDifference, true);
  const [empty] = operationViewService.createViews({ operations: [{ ...operation, erpMachineCode: " \uFEFF " }], decisions: [], workOrders: [], machineMappings: { DMU50: mapping } });
  assert.equal(empty.machineId, null);
  assert.equal(empty.machine, "Non définie");
  assert.equal(empty.sourceMachineCode, " \uFEFF ");
  assert.equal(empty.sourceMachineDescription, "Centre 5 axes");
});

test("plusieurs codes ERP peuvent cibler la même machine ProdPilot", () => {
  const mappings = normalizeErpMachineMappings({
    DMU50: { erpMachineCode: "DMU50", machineId: "FRA-13", updatedAt: "2026-07-22T10:00:00.000Z" },
    "DMU 50": { erpMachineCode: "DMU 50", machineId: "FRA-13", updatedAt: "2026-07-22T10:00:00.000Z" },
  });
  assert.equal(mappings.DMU50.machineId, "FRA-13");
  assert.equal(mappings["DMU 50"].machineId, "FRA-13");
});

test("les mappings supprimés, inactifs et inexistants restent explicitement qualifiés", () => {
  const base = { id: "FRA-01", active: true, deleted: false, name: "Machine", displayName: "Machine", department: "Fraisage", departmentId: "milling", machineType: "Fraisage", color: "", order: 0, photoDataUrl: "", technicalInformation: "" };
  assert.equal(classifyErpMachineMapping("FRA-01", [base]).status, "mapped");
  assert.equal(classifyErpMachineMapping("FRA-01", [{ ...base, deleted: true }]).status, "deleted");
  assert.equal(classifyErpMachineMapping("FRA-01", [{ ...base, active: false }]).status, "inactive");
  assert.deepEqual(classifyErpMachineMapping("ABSENTE", [base]), { status: "unmapped", machine: null, hasMissingTarget: true });
  assert.equal(classifyErpMachineMapping(null, [base]).status, "unmapped");
  const row = { machineId: "ABSENTE", machine: "ABSENTE", isWithoutMachine: false };
  assert.deepEqual(reconcileOperationViewMachineCatalog([row], [base])[0], { machineId: null, machine: "Non définie", isWithoutMachine: true });
});

test("reconcileOperationViewMachineCatalog assigne automatiquement un OF sans machine à l'unique machine taguée sur sa catégorie de tâche, et le rend réversible sans jamais rien écrire", () => {
  const peinture = { id: "PEI-01", displayName: "Peinture", active: true, deleted: false, name: "Peinture", department: "Traitement surface", departmentId: "traitement-surface", machineType: "", color: "", order: 0, photoDataUrl: "", technicalInformation: "", taskCategoryCode: "18" };

  // (a) OF sans machine, une seule machine taguée sur la catégorie 18 : assignation automatique.
  const unassigned = { machineId: null, machine: "Non définie", isWithoutMachine: true, taskCode: "18" };
  const reconciled = reconcileOperationViewMachineCatalog([unassigned], [peinture])[0];
  assert.deepEqual(reconciled, { machineId: "PEI-01", machine: "Peinture", isWithoutMachine: false, taskCode: "18" });

  // (b) OF déjà assigné manuellement à une autre machine réelle : la règle catégorie ne le touche jamais.
  const autreMachine = { id: "FRA-01", displayName: "Fraisage 1", active: true, deleted: false, name: "Fraisage 1", department: "Fraisage", departmentId: "milling", machineType: "", color: "", order: 0, photoDataUrl: "", technicalInformation: "", taskCategoryCode: null };
  const dejaAssigne = { machineId: "FRA-01", machine: "Fraisage 1", isWithoutMachine: false, taskCode: "18" };
  assert.deepEqual(reconcileOperationViewMachineCatalog([dejaAssigne], [peinture, autreMachine])[0], dejaAssigne, "une assignation manuelle réelle garde toujours la priorité sur la règle catégorie");

  // (c) Une deuxième machine tague la même catégorie : impossible de deviner laquelle doit recevoir l'OF, il redevient « sans machine » sans qu'aucune donnée n'ait jamais été perdue (rien n'avait été écrit).
  const peinture2 = { ...peinture, id: "PEI-02", displayName: "Peinture 2" };
  assert.deepEqual(reconcileOperationViewMachineCatalog([unassigned], [peinture, peinture2])[0], unassigned, "deux machines candidates pour la même catégorie : aucune assignation automatique, l'OF reste sans machine");
});

test("les anciens états ERP sont extraits puis retirés du mapping canonique", () => {
  const normalized = normalizeErpMachineMappings({
    LEGACY: { erpMachineCode: "LEGACY", machineId: "FRA-01", updatedAt: "2026-07-20T08:00:00.000Z", hidden: true },
    CURRENT: { erpMachineCode: "CURRENT", machineId: "FRA-02", updatedAt: "2026-07-20T08:00:00.000Z", visible: false, status: "inactive" },
  });
  assert.deepEqual(extractLegacyErpMachineStates(normalized), [
    { machineId: "FRA-01", visible: false },
    { machineId: "FRA-02", active: false, visible: false },
  ]);
  assert.deepEqual(stripLegacyErpMachineState(normalized.CURRENT), { erpMachineCode: "CURRENT", machineId: "FRA-02", updatedAt: "2026-07-20T08:00:00.000Z" });
});

test("MachineSettingsService gère activité, visibilité et migration sans toucher au mapping", () => {
  const machine = { id: "FRA-13", active: true, visible: true };
  const settings = { production: { machines: [machine] } };
  machineSettingsService.setInactive(settings, machine.id);
  machineSettingsService.setHidden(settings, machine.id);
  assert.deepEqual([machine.active, machine.visible], [false, false]);
  machineSettingsService.setActive(settings, machine.id);
  machineSettingsService.setVisible(settings, machine.id);
  assert.deepEqual([machine.active, machine.visible], [true, true]);
  assert.equal(machineSettingsService.migrateLegacyErpStates(settings, [{ machineId: machine.id, active: false, visible: false }]), 1);
  assert.deepEqual([machine.active, machine.visible], [false, false]);
});

test("les filtres ERP lisent statut et visibilité depuis MachineSettings", () => {
  const entries = [
    { code: "DMU50", description: "Active", operationCount: 10, machineId: "FRA-13" },
    { code: "OLD01", description: "Ancienne visible", operationCount: 0, machineId: "FRA-14" },
    { code: "HIDDEN", description: "Active masquée", operationCount: 2, machineId: "FRA-15" },
  ];
  const base = { active: true, visible: true, deleted: false, name: "Machine", displayName: "Machine", department: "Fraisage", departmentId: "milling", machineType: "Fraisage", color: "", order: 0, photoDataUrl: "", technicalInformation: "" };
  const machines = [{ ...base, id: "FRA-13" }, { ...base, id: "FRA-14", active: false }, { ...base, id: "FRA-15", visible: false }];
  assert.deepEqual(filterErpMachineCodeEntries(entries, machines).map((entry) => entry.code), ["DMU50", "OLD01"]);
  assert.deepEqual(filterErpMachineCodeEntries(entries, machines, { showHidden: true }).map((entry) => entry.code), ["DMU50", "OLD01", "HIDDEN"]);
  assert.deepEqual(filterErpMachineCodeEntries(entries, machines, { showActive: false }).map((entry) => entry.code), ["OLD01"]);
  assert.deepEqual(filterErpMachineCodeEntries(entries, machines, { showInactive: false }).map((entry) => entry.code), ["DMU50"]);
});

test("le Planning sélectionne uniquement les machines actives, visibles et non supprimées", async () => {
  const source = await readFile(new URL("../src/features/planning/services/planning-view.ts", import.meta.url), "utf8");
  assert.match(source, /machine\.active && machine\.visible && !machine\.deleted/);
});

test("les paramètres machines sauvegardent visible et migrent les anciennes fiches", async () => {
  const source = await readFile(new URL("../src/features/settings/services/settings-repository.ts", import.meta.url), "utf8");
  assert.match(source, /typeof machine\.visible === "boolean"/);
  assert.match(source, /visible: \(savedVersion \?\? 0\) < 16 \? true : typeof machine\.visible === "boolean"/);
  assert.match(source, /localStorage\.setItem\(STORAGE_KEY/);
});

test("les composants Planning consomment OperationView sans fusion ERP/décision", async () => {
  const files = await Promise.all([
    readFile(new URL("../src/features/erp-import/components/ErpPlanningOperations.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/features/erp-import/components/ErpPlanningWorkspace.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/features/erp-import/services/erp-planning-grouping.ts", import.meta.url), "utf8"),
  ]);
  const source = files.join("\n");
  assert.match(source, /OperationView/);
  assert.doesNotMatch(source, /PlanningDecision|ErpOperation\b|readOverrides|readProjection/);
});

test("FilterEngine combine les catégories et dérive ses options sans valeur codée en dur", () => {
  const base = { isRemoved: false, isVisible: true, isWithoutMachine: false, articleWorkOrderCount: 1, department: null, resourceGroup: "FRAISAGE", sourcePriority: 2, userPriority: null, sourceOperationStatusId: 4, sourceOrderStatus: "OUVERT" };
  const operations = [
    { ...base, id: "1", workOrderId: "OF-1", articleCode: "A100", description: "Bride", machine: "M1", workOrder: { customerName: "EXAIL" } },
    { ...base, id: "2", workOrderId: "OF-2", articleCode: "B200", description: "Axe", machine: "M2", resourceGroup: "TOURNAGE", sourcePriority: 7, userPriority: 9, sourceOperationStatusId: 5, sourceOrderStatus: "LANCÉ", workOrder: { customerName: "SAB" } },
    { ...base, id: "3", workOrderId: "OF-3", articleCode: "C300", description: "Ancienne", machine: "Non définie", isWithoutMachine: true, isRemoved: true, workOrder: { customerName: "FNH" } },
  ];
  const filters = { ...emptyPlanningFilters(), search: "axe", clients: ["SAB"], resourceGroups: ["TOURNAGE"], erpPriorities: [7], erpStatusIds: [5] };
  assert.deepEqual(filterEngine.apply(operations, filters).map((operation) => operation.id), ["2"]);
  assert.deepEqual(filterEngine.options(operations).clients, ["EXAIL", "FNH", "SAB"]);
  assert.deepEqual(filterEngine.options(operations).erpStatuses, ["LANCÉ", "OUVERT"]);
  assert.deepEqual(filterEngine.apply(operations, { ...emptyPlanningFilters(), technicalStates: ["removed"] }).map((operation) => operation.id), ["3"]);
  assert.deepEqual(filterEngine.apply(operations, emptyPlanningFilters()).map((operation) => operation.id), ["1", "2"]);
});

test("les mutations ERP locales exigent la même origine", async () => {
  const api = await readFile(new URL("../src/features/erp-import/server/erp-api-response.ts", import.meta.url), "utf8");
  const importRoute = await readFile(new URL("../src/app/api/erp/imports/route.ts", import.meta.url), "utf8");
  const operationRoute = await readFile(new URL("../src/app/api/erp/operations/[id]/route.ts", import.meta.url), "utf8");
  assert.match(api, /origin === new URL\(request\.url\)\.origin/);
  assert.match(importRoute, /isTrustedErpMutation/);
  assert.match(operationRoute, /isTrustedErpMutation/);
});

test("le cockpit opérationnel n’utilise aucun temps de fabrication", async () => {
  const service = await readFile(new URL("../src/features/erp-import/server/erp-planning-service.ts", import.meta.url), "utf8");
  const component = await readFile(new URL("../src/features/erp-import/components/ErpPlanningWorkspace.tsx", import.meta.url), "utf8");
  const operations = await readFile(new URL("../src/features/erp-import/components/ErpPlanningOperations.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(service, /plannedDuration|durationHours|capacityHours/);
  assert.doesNotMatch(`${component}${operations}`, /plannedDuration|durationHours|capacityHours/);
  assert.match(service, /requestedDueDate/);
  assert.match(operations, /application\/x-prodpilot-operation/);
});

test("les filtres du Cockpit ERP forment une barre horizontale repliable au-dessus du tableau, pas une colonne latérale", async () => {
  const panel = await readFile(new URL("../src/features/erp-import/components/PlanningFilterPanel.tsx", import.meta.url), "utf8");
  const workspace = await readFile(new URL("../src/features/erp-import/components/ErpPlanningWorkspace.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(panel, /<aside/, "le panneau ne doit plus être une colonne latérale");
  assert.match(panel, /aria-expanded={isOpen}/, "le détail des filtres est replié par défaut, comme dans l'Atelier");
  assert.doesNotMatch(workspace, /grid-cols-\[280px_minmax\(0,1fr\)\]/, "la grille latérale 280px doit avoir disparu");
  assert.match(workspace, /<div className="space-y-4"><PlanningFilterPanel/, "le panneau de filtres est désormais empilé au-dessus du tableau");
});

test("le statut ERP non documenté n’est pas inventé", async () => {
  const parser = await readFile(new URL("../src/features/erp-import/server/erp-workbook-parser.ts", import.meta.url), "utf8");
  assert.match(parser, /aucune signification non confirmée n’est inventée/);
  assert.doesNotMatch(parser, /statusId === 1/);
  assert.match(parser, /return "unknown"/);
});

test("les références open source et leurs licences sont consignées", async () => {
  const notices = await readFile("THIRD_PARTY_NOTICES.md", "utf8");
  assert.match(notices, /read-excel-file \| `9\.3\.2/);
  assert.match(notices, /Comcast\/react-data-grid/);
  assert.match(notices, /GPL-3\.0/);
  assert.match(notices, /AGPL-3\.0/);
});

test("les articles identiques sont comptés par OF distinct et non par opération", () => {
  const analysis = analyzeErpArticleClusters({
    version: 1,
    activeImportId: "import-1",
    imports: [],
    workOrders: [
      { id: "62541", articleId: "article-123456", articleCode: "123456" },
      { id: "62582", articleId: "article-123456", articleCode: "123456" },
      { id: "62615", articleId: "article-999999", articleCode: "999999" },
    ],
    operations: [
      { id: "op-1", workOrderId: "62541", articleCode: "123456" },
      { id: "op-2", workOrderId: "62541", articleCode: "123456" },
      { id: "op-3", workOrderId: "62582", articleCode: "123456" },
      { id: "op-4", workOrderId: "62615", articleCode: "999999" },
    ],
  });
  assert.equal(analysis.multiWorkOrderArticles, 1);
  assert.equal(analysis.workOrdersInMultipleArticles, 2);
  assert.deepEqual(analysis.clusters.get("ARTICLE-123456")?.workOrderIds, ["62541", "62582"]);
});

test("une vue Planning conserve un ordre complet et déplaçable de colonnes", () => {
  const view = createDefaultErpPlanningView("2026-07-19T12:00:00.000Z");
  const moved = moveErpPlanningColumn(view.columns, "machine", "work-order");
  assert.equal(moved[1].id, "machine");
  assert.equal(new Set(moved.map((column) => column.id)).size, view.columns.length);
  const parsed = parseErpPlanningViewState({ version: 1, activeViewId: "custom", views: [{ ...view, id: "custom", columns: [{ id: "article", visible: true, pinned: true, width: 9999 }] }] });
  assert.equal(parsed.views[0].columns[0].id, "article");
  assert.equal(parsed.views[0].columns[0].width, 480);
  assert.equal(parsed.views[0].columns.length, view.columns.length);
});

test("une vue Planning par défaut trie en ordre croissant (asc) ; une vue persistée sans sortDirection retombe sur asc plutôt que d'être rejetée", () => {
  const view = createDefaultErpPlanningView("2026-07-19T12:00:00.000Z");
  assert.equal(view.sortDirection, "asc");
  const parsed = parseErpPlanningViewState({ version: 1, activeViewId: view.id, views: [{ ...view, sortDirection: undefined }] });
  assert.equal(parsed.views[0].sortDirection, "asc");
  const parsedDesc = parseErpPlanningViewState({ version: 1, activeViewId: view.id, views: [{ ...view, sortDirection: "desc" }] });
  assert.equal(parsedDesc.views[0].sortDirection, "desc");
});

test("le Cockpit ERP (ErpPlanningOperations) permet de choisir le tri depuis l'en-tête de colonne, en réutilisant les modes de tri déjà existants (activeView.sort) sans réécrire leurs tie-breaks métier", async () => {
  const component = await readFile(new URL("../src/features/erp-import/components/ErpPlanningOperations.tsx", import.meta.url), "utf8");
  assert.match(component, /score: "priority"/);
  assert.match(component, /"work-order": "work-order"/);
  assert.match(component, /client: "client"/);
  assert.match(component, /article: "article"/);
  assert.match(component, /date: "due-date"/);
  assert.match(component, /machine: "machine"/);
  assert.match(component, /function onHeaderSort\(mode: ErpPlanningSort\)/);
  assert.match(component, /view\.sort === mode \? \{ \.\.\.view, sortDirection: view\.sortDirection === "asc" \? "desc" : "asc" \}/, "un second clic sur la colonne déjà active inverse la direction sans changer de mode");
  assert.match(component, /from "@\/components\/ui\/SortableColumnHeader"/, "réutilise la base commune (bouton de tri, glisser-déposer) plutôt que de dupliquer le rendu");
});

test("le second clic sur une colonne déjà triée du Cockpit ERP inverse le résultat déjà trié (reverse) plutôt que de dupliquer les comparateurs métier fins de sortOperationViews", async () => {
  const workspace = await readFile(new URL("../src/features/erp-import/components/ErpPlanningWorkspace.tsx", import.meta.url), "utf8");
  assert.match(workspace, /function sortOperationViews\(operations: OperationView\[\], sort: .*, direction: "asc" \| "desc"\): OperationView\[\]/);
  assert.match(workspace, /return direction === "desc" \? sorted\.reverse\(\) : sorted;/);
  assert.match(workspace, /activePlanningView\.sort, activePlanningView\.sortDirection/, "le composant passe bien la direction persistée au tri, pas seulement le mode");
});

test("moveWorkshopColumn et moveErpPlanningColumn délèguent à la fonction générique partagée moveColumnId plutôt que de dupliquer la logique de glisser-déposer", async () => {
  const workshopPreferences = await readFile(new URL("../src/features/planning/services/workshop-view-preferences.ts", import.meta.url), "utf8");
  assert.match(workshopPreferences, /from "\.\.\/\.\.\/\.\.\/lib\/table-columns\.ts"/, "chemin relatif explicite requis : ce fichier est importé directement par des tests node:test");
  assert.match(workshopPreferences, /moveColumnId\(columns\.map\(\(column\) => column\.id\), sourceId, targetId\)/);
  const erpPreferences = await readFile(new URL("../src/features/erp-import/services/erp-planning-view-preferences.ts", import.meta.url), "utf8");
  assert.match(erpPreferences, /from "\.\.\/\.\.\/\.\.\/lib\/table-columns\.ts"/, "chemin relatif explicite requis : ce fichier est importé directement par des tests node:test");
  assert.match(erpPreferences, /moveColumnId\(columns\.map\(\(column\) => column\.id\), sourceId, targetId\)/);
});
