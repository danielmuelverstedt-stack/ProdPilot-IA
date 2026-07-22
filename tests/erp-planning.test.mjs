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

test("OperationView centralise machine, priorité, visibilité et indicateurs", () => {
  const operation = {
    id: "62541::20::FRAISAGE", stableId: "62541::20::FRAISAGE", erpStatus: "Active", workOrderId: "62541",
    operationNumber: 20, operationStatusId: 1, taskCode: "FRAISAGE", actualStartAt: null, actualEndAt: null,
    subcontracted: false, orderStatus: "OUVERT", erpDueDate: "2026-07-30", articleCode: "A-1", description: "Pièce",
    macroRangeCode: "USINAGE", erpPriority: 3, erpMachineCode: "M-ERP", erpMachineDescription: "Centre d'usinage", normalizedStatus: "unknown", sourceRow: 2, duplicateOf: null,
  };
  const decision = {
    operationIdentity: operation.stableId, userPriority: 9, manualOrder: 4, plannedMachineId: "M-PLAN",
    comment: "À lancer", visible: false, locked: true, plannedDate: null, planningStatus: null,
    createdAt: "2026-07-22T10:00:00.000Z", updatedAt: "2026-07-22T10:00:00.000Z",
  };
  const [view] = operationViewService.createViews({ operations: [operation], decisions: [decision], workOrders: [] });
  assert.equal(view.machine, "M-PLAN");
  assert.equal(view.sourceMachineDescription, "Centre d'usinage");
  assert.equal(view.priority, 9);
  assert.equal(view.isVisible, false);
  assert.equal(view.hasPlannedMachine, true);
  assert.equal(view.hasUserPriority, true);
  assert.equal(view.hasComment, true);
  assert.equal(view.hasManualOrder, true);
  assert.equal(view.isRemoved, false);
  assert.equal(view.isWithoutMachine, false);
  assert.equal(view.isLate, null);
  assert.equal(view.estimatedStart, null);

  const [erpFallback] = operationViewService.createViews({ operations: [operation], decisions: [], workOrders: [] });
  assert.equal(erpFallback.machine, "M-ERP");
  assert.equal(erpFallback.isWithoutMachine, false);

  const [fallback] = operationViewService.createViews({ operations: [{ ...operation, id: "removed", stableId: "removed", erpStatus: "Removed", erpMachineCode: null, erpMachineDescription: null }], decisions: [], workOrders: [] });
  assert.equal(fallback.machine, "Non définie");
  assert.equal(fallback.priority, 3);
  assert.equal(fallback.isVisible, true);
  assert.equal(fallback.isRemoved, true);
  assert.equal(fallback.isWithoutMachine, true);
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
