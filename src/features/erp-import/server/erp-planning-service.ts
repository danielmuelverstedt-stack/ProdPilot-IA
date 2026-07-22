import "server-only";

import { erpImportRepository } from "@/features/erp-import/server/erp-import-repository";
import { analyzeErpArticleClusters, normalizeErpArticleKey } from "@/features/erp-import/services/article-cluster-engine";
import { operationViewService } from "@/features/erp-import/services/operation-view-service";
import type { ErpMachineMapping, ErpOperationStatus, ErpPlanningOverview, ErpPlanningProjection, ErpPlanningQueryResult, ErpPlanningWorkOrderSummary, ErpQualityIssue, OperationView, PlanningDecision } from "@/features/erp-import/types/erp-import";

export interface ErpPlanningFilters {
  search?: string;
  machine?: string;
  status?: string;
  late?: string;
  page?: number;
  pageSize?: number;
  sort?: "priority" | "due-date" | "work-order" | "machine" | "client" | "article";
  validMachineIds?: string[];
  articleMultiplicity?: "multiple" | "unique";
  includeWorkOrderDetails?: boolean;
  includeInactive?: boolean;
}

interface PlanningSnapshot {
  projection: ErpPlanningProjection;
  decisions: PlanningDecision[];
  mappings: Record<string, ErpMachineMapping>;
  rows: OperationView[];
  multiWorkOrderArticles: number;
  workOrdersInMultipleArticles: number;
}

let planningSnapshotCache: PlanningSnapshot | null = null;

interface FilteredRowsCache {
  snapshot: PlanningSnapshot;
  key: string;
  rows: OperationView[];
}
let filteredRowsCache: FilteredRowsCache | null = null;

function buildFilterKey(filters: ErpPlanningFilters): string {
  return JSON.stringify({
    search: filters.search?.trim().toLocaleLowerCase("fr") ?? "",
    machine: filters.machine ?? "",
    status: filters.status ?? "",
    late: filters.late ?? "",
    articleMultiplicity: filters.articleMultiplicity ?? "",
    sort: filters.sort ?? "priority",
    validMachineIds: filters.machine === "unmapped" ? [...(filters.validMachineIds ?? [])].sort() : [],
  });
}

export async function getErpPlanningRows(filters: ErpPlanningFilters = {}): Promise<ErpPlanningQueryResult> {
  const snapshot = await getPlanningSnapshot();
  const key = buildFilterKey(filters);
  let rows: OperationView[];
  if (filteredRowsCache && filteredRowsCache.snapshot === snapshot && filteredRowsCache.key === key) {
    rows = filteredRowsCache.rows;
  } else {
    rows = [...snapshot.rows];
    if (!filters.includeInactive) rows = rows.filter((row) => !row.isRemoved && row.isVisible);

    const search = filters.search?.trim().toLocaleLowerCase("fr") ?? "";
    if (search) rows = rows.filter((row) => [row.workOrderId, row.articleCode, row.description, row.workOrder?.customerName, row.workOrder?.customerReference, row.taskCode].some((value) => String(value ?? "").toLocaleLowerCase("fr").includes(search)));
    if (filters.machine === "unmapped") {
      const valid = filters.validMachineIds?.length ? new Set(filters.validMachineIds) : null;
      rows = rows.filter((row) => !row.machineId || Boolean(valid && !valid.has(row.machineId)));
    }
    else if (filters.machine) rows = rows.filter((row) => row.machineId === filters.machine || row.sourceMachineCode === filters.machine);
    if (filters.status) rows = rows.filter((row) => row.status === filters.status);
    if (filters.late === "late") rows = rows.filter((row) => (row.delayDays ?? 0) > 0);
    if (filters.late === "on-time") rows = rows.filter((row) => row.delayDays !== null && row.delayDays <= 0);
    if (filters.articleMultiplicity === "multiple") rows = rows.filter((row) => row.articleWorkOrderCount > 1);
    if (filters.articleMultiplicity === "unique") rows = rows.filter((row) => row.articleWorkOrderCount === 1);

    sortRows(rows, filters.sort ?? "priority");
    filteredRowsCache = { snapshot, key, rows };
  }
  const pageSize = clamp(filters.pageSize ?? 100, 20, filters.includeInactive ? 50_000 : 200);
  const page = Math.max(1, filters.page ?? 1);
  const start = (page - 1) * pageSize;
  const pageRows = rows.slice(start, start + pageSize);
  return { rows: filters.includeWorkOrderDetails ? pageRows : pageRows.map(toPlanningListRow), total: rows.length, page, pageSize };
}

export async function getErpPlanningOverview(): Promise<ErpPlanningOverview> {
  const snapshot = await getPlanningSnapshot();
  const { projection, mappings } = snapshot;
  const rows = snapshot.rows.filter((row) => !row.isRemoved && row.isVisible);
  const counts = new Map<string, number>();
  rows.forEach((operation) => counts.set(operation.sourceMachineCode || "0", (counts.get(operation.sourceMachineCode || "0") ?? 0) + 1));
  const issueCounts = new Map<ErpQualityIssue["category"], number>();
  const issueKeys = new Map<ErpQualityIssue["category"], Set<string>>();
  const workOrderById = new Map(projection.workOrders.map((order) => [order.id, order]));
  const rowById = new Map(rows.map((row) => [row.id, row]));
  rows.forEach((operation) => collectIssueCategories(operation, workOrderById.get(operation.workOrderId) ?? null, rowById.get(operation.id)?.machineId ?? null).forEach((category) => {
    const key = issueIsPerWorkOrder(category) ? operation.workOrderId : operation.id;
    const keys = issueKeys.get(category) ?? new Set<string>();
    keys.add(key);
    issueKeys.set(category, keys);
  }));
  const orderIdsWithOperations = new Set(projection.operations.map((operation) => operation.workOrderId));
  projection.workOrders.filter((order) => !orderIdsWithOperations.has(order.id)).forEach((order) => {
    const keys = issueKeys.get("work-order-without-operation") ?? new Set<string>();
    keys.add(order.id); issueKeys.set("work-order-without-operation", keys);
  });
  issueKeys.forEach((keys, category) => issueCounts.set(category, keys.size));
  const issueTotal = [...issueCounts.values()].reduce((sum, value) => sum + value, 0);
  const activeImport = projection.imports.find((entry) => entry.id === projection.activeImportId) ?? null;
  return {
    activeImport,
    imports: projection.imports,
    metrics: {
      workOrders: projection.workOrders.length,
      operations: projection.operations.length,
      lateOperations: rows.filter((row) => (row.delayDays ?? 0) > 0).length,
      unmappedOperations: rows.filter((row) => !row.machineId).length,
      completedOperations: rows.filter((row) => row.status === "completed").length,
      multiWorkOrderArticles: snapshot.multiWorkOrderArticles,
      workOrdersInMultipleArticles: snapshot.workOrdersInMultipleArticles,
      qualityScore: projection.operations.length ? Math.max(0, Math.round(100 - (issueTotal / projection.operations.length) * 20)) : 100,
    },
    machineCodes: [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0], "fr", { numeric: true })).map(([code, operationCount]) => ({ code, operationCount, machineId: mappings[code]?.machineId ?? null })),
    issueCounts: [...issueCounts.entries()].map(([category, count]) => ({ category, count })).sort((a, b) => b.count - a.count),
  };
}

async function getPlanningSnapshot(): Promise<PlanningSnapshot> {
  const [projection, decisions, mappings] = await Promise.all([
    erpImportRepository.readProjection(),
    erpImportRepository.readPlanningDecisions(),
    erpImportRepository.readMappings(),
  ]);
  if (planningSnapshotCache?.projection === projection && planningSnapshotCache.decisions === decisions && planningSnapshotCache.mappings === mappings) return planningSnapshotCache;
  const articleAnalysis = analyzeErpArticleClusters(projection);
  const rows = buildPlanningRows(projection, decisions, mappings, articleAnalysis.clusters);
  planningSnapshotCache = {
    projection,
    decisions,
    mappings,
    rows,
    multiWorkOrderArticles: articleAnalysis.multiWorkOrderArticles,
    workOrdersInMultipleArticles: articleAnalysis.workOrdersInMultipleArticles,
  };
  return planningSnapshotCache;
}

function buildPlanningRows(projection: ErpPlanningProjection, decisions: PlanningDecision[], mappings: Record<string, ErpMachineMapping>, articleClusters: ReturnType<typeof analyzeErpArticleClusters>["clusters"]): OperationView[] {
  return operationViewService.createViews({ operations: projection.operations, decisions, workOrders: projection.workOrders, machineMappings: mappings })
    .map((operation) => {
    const workOrder = operation.workOrder && "requestedDueDate" in operation.workOrder ? operation.workOrder : null;
    const plannedDate = operation.plannedDate ?? workOrder?.confirmedDueDate ?? workOrder?.requestedDueDate ?? null;
    const issues = rowIssueLabels(operation, workOrder, operation.machineId, plannedDate, operation.priority, operation.status);
    const delayReferenceDate = workOrder?.requestedDueDate ?? operation.dueDate ?? workOrder?.confirmedDueDate ?? null;
    const delayDays = delayReferenceDate ? calendarDaysBetween(delayReferenceDate, today()) : null;
    const articleKey = normalizeErpArticleKey(workOrder?.articleId || operation.articleCode);
    return { ...operation, plannedDate, delayDays, priorityScore: priorityScore(delayDays, operation.priority, operation.status, operation.subcontracted, issues.length), articleWorkOrderCount: articleClusters.get(articleKey)?.workOrderIds.length ?? 1, issues };
  });
}

function toPlanningListRow(row: OperationView): OperationView {
  if (!row.workOrder) return row;
  const workOrder: ErpPlanningWorkOrderSummary = {
    id: row.workOrder.id,
    articleCode: row.workOrder.articleCode,
    articleId: row.workOrder.articleId,
    articleGroupId: row.workOrder.articleGroupId,
    customerName: row.workOrder.customerName,
    customerReference: row.workOrder.customerReference,
  };
  return { ...row, workOrder };
}

function rowIssueLabels(operation: Parameters<typeof collectIssueCategories>[0], order: Parameters<typeof collectIssueCategories>[1], machineId: string | null, plannedDate: string | null, priority: number, status: ErpOperationStatus): string[] {
  const categories = collectIssueCategories(operation, order, machineId);
  if (!plannedDate && !categories.includes("missing-date")) categories.push("missing-date");
  if (priority === 0 && !categories.includes("missing-priority")) categories.push("missing-priority");
  if (status === "unknown" && !categories.includes("unknown-status")) categories.push("unknown-status");
  return categories.map(issueLabel);
}

function collectIssueCategories(operation: { id: string; workOrderId: string; sourceMachineCode: string | null; dueDate: string | null; sourcePriority: number; taskCode: string; sourceMacroRangeCode: string; articleCode: string; sourceStatus: ErpOperationStatus; duplicateOf: string | null; actualStartAt: string | null; actualEndAt: string | null }, order: { articleCode: string; customerName: string; customerReference: string | null; requestedDueDate: string | null; confirmedDueDate: string | null; quantity: number } | null, machineId: string | null): ErpQualityIssue["category"][] {
  const issues: ErpQualityIssue["category"][] = [];
  if (!machineId) issues.push("missing-machine");
  if (!operation.dueDate && !order?.confirmedDueDate && !order?.requestedDueDate) issues.push("missing-date");
  if (operation.sourcePriority === 0) issues.push("missing-priority");
  if (!operation.taskCode || operation.taskCode === "0") issues.push("missing-task");
  if (!operation.sourceMacroRangeCode || operation.sourceMacroRangeCode === "0") issues.push("unknown-macro-range");
  if (!order) issues.push("missing-work-order");
  if (order && !order.customerName) issues.push("missing-customer");
  if (!operation.articleCode) issues.push("missing-article");
  if (order && !order.customerReference) issues.push("missing-reference");
  if (order && operation.articleCode !== order.articleCode) issues.push("inconsistent-article");
  if (order?.quantity === 0) issues.push("invalid-quantity");
  if (order?.quantity === 9999) issues.push("suspect-quantity");
  if (operation.sourceStatus === "unknown") issues.push("unknown-status");
  if (operation.duplicateOf) issues.push("duplicate-operation");
  if ((operation.actualStartAt && operation.actualEndAt && operation.actualEndAt < operation.actualStartAt) || isImplausibleDate(operation.dueDate) || isImplausibleDate(order?.requestedDueDate ?? null) || isImplausibleDate(order?.confirmedDueDate ?? null)) issues.push("invalid-date");
  return issues;
}

function issueLabel(category: ErpQualityIssue["category"]): string {
  return {
    "missing-machine": "Machine non définie", "missing-date": "Délai manquant", "missing-priority": "Priorité à zéro",
    "missing-task": "Code tâche manquant", "unknown-macro-range": "Macro gamme inconnue", "missing-customer": "Client inconnu",
    "missing-article": "Article inconnu", "missing-reference": "Référence manquante", "missing-work-order": "Opération orpheline",
    "work-order-without-operation": "OF sans opération", "duplicate-operation": "Opération en doublon", "invalid-date": "Date incohérente",
    "invalid-quantity": "Quantité à zéro", "suspect-quantity": "Quantité 9999", "inconsistent-article": "Article incohérent",
    "unknown-status": "Statut non reconnu",
  }[category];
}

function issueIsPerWorkOrder(category: ErpQualityIssue["category"]): boolean {
  return ["missing-customer", "missing-reference", "invalid-quantity", "suspect-quantity", "inconsistent-article", "invalid-date"].includes(category);
}

function priorityScore(delayDays: number | null, priority: number, status: ErpOperationStatus, subcontracted: boolean, issueCount: number): number {
  const latePoints = delayDays && delayDays > 0 ? Math.min(50, delayDays * 2) : 0;
  const erpPoints = Math.min(25, Math.max(0, priority));
  return Math.round(latePoints + erpPoints + (status === "in-progress" ? 10 : 0) + (subcontracted ? 5 : 0) + Math.min(10, issueCount * 2));
}

function sortRows(rows: OperationView[], sort: NonNullable<ErpPlanningFilters["sort"]>): void {
  rows.sort((a, b) => {
    if (sort === "due-date") return (a.plannedDate ?? "9999").localeCompare(b.plannedDate ?? "9999") || b.priorityScore - a.priorityScore;
    if (sort === "work-order") return a.workOrderId.localeCompare(b.workOrderId, "fr", { numeric: true }) || a.operationNumber - b.operationNumber;
    if (sort === "machine") return (a.machineId ?? "zzzz").localeCompare(b.machineId ?? "zzzz", "fr", { numeric: true }) || b.priorityScore - a.priorityScore;
    if (sort === "client") return (a.workOrder?.customerName ?? "zzzz").localeCompare(b.workOrder?.customerName ?? "zzzz", "fr") || b.priorityScore - a.priorityScore;
    if (sort === "article") return a.articleCode.localeCompare(b.articleCode, "fr", { numeric: true }) || b.priorityScore - a.priorityScore;
    return b.priorityScore - a.priorityScore || (a.plannedDate ?? "9999").localeCompare(b.plannedDate ?? "9999");
  });
}

function today(): string { return new Date().toISOString().slice(0, 10); }
function calendarDaysBetween(from: string, to: string): number { return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000); }
function clamp(value: number, minimum: number, maximum: number): number { return Math.min(maximum, Math.max(minimum, Math.trunc(value))); }
function isImplausibleDate(value: string | null): boolean { return Boolean(value && Math.abs(calendarDaysBetween(value, today())) > 3_650); }
