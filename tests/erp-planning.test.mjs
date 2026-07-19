import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { ERP_DETAILS_HEADERS, ERP_TOP_HEADERS, assertExpectedHeaders } from "../src/features/erp-import/config/macro-range-profile.ts";
import { analyzeErpArticleClusters } from "../src/features/erp-import/services/article-cluster-engine.ts";
import { createDefaultErpPlanningView, moveErpPlanningColumn, parseErpPlanningViewState } from "../src/features/erp-import/services/erp-planning-view-preferences.ts";

test("le profil ERP couvre exactement les deux structures attendues", () => {
  assert.equal(ERP_TOP_HEADERS.length, 19);
  assert.equal(ERP_DETAILS_HEADERS.length, 14);
  assert.ok(ERP_TOP_HEADERS.includes("Num_OF"));
  assert.ok(ERP_DETAILS_HEADERS.includes("Num_OF"));
  assert.ok(ERP_DETAILS_HEADERS.includes("Macro_Gamme_Pe"));
  assert.doesNotThrow(() => assertExpectedHeaders([...ERP_TOP_HEADERS], ERP_TOP_HEADERS, "Top.xlsx"));
});

test("une colonne manquante ou inattendue bloque l’import", () => {
  const missing = ERP_TOP_HEADERS.filter((header) => header !== "Num_OF");
  assert.throws(() => assertExpectedHeaders(missing, ERP_TOP_HEADERS, "Top.xlsx"), /colonnes manquantes : Num_OF/);
  assert.throws(() => assertExpectedHeaders([...ERP_DETAILS_HEADERS, "Colonne inconnue"], ERP_DETAILS_HEADERS, "Details.xlsx"), /colonnes inattendues/);
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
