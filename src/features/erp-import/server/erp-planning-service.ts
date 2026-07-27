import "server-only";

import { erpImportRepository } from "@/features/erp-import/server/erp-import-repository";
import { analyzeErpArticleClusters, normalizeErpArticleKey } from "@/features/erp-import/services/article-cluster-engine";
import { operationViewService } from "@/features/erp-import/services/operation-view-service";
import { extractLegacyErpMachineStates, normalizeErpMachineCode } from "@/features/erp-import/services/erp-machine-code";
import { collectIssueCategories, issueIsPerWorkOrder, priorityScore, rowIssueLabels } from "@/features/erp-import/services/operation-quality-scoring";
import type { ErpMachineMapping, ErpPlanningOverview, ErpPlanningProjection, ErpPlanningQueryResult, ErpPlanningWorkOrderSummary, ErpQualityIssue, OperationView, PlanningDecision } from "@/features/erp-import/types/erp-import";

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
  const machineCodeGroups = new Map<string, { operationCount: number; description: string | null }>();
  rows.forEach((operation) => {
    const code = normalizeErpMachineCode(operation.sourceMachineCode) ?? "";
    const current = machineCodeGroups.get(code) ?? { operationCount: 0, description: null };
    current.operationCount += 1;
    current.description ??= operation.sourceMachineDescription?.trim() || null;
    machineCodeGroups.set(code, current);
  });
  Object.values(mappings).forEach((mapping) => {
    if (!machineCodeGroups.has(mapping.erpMachineCode)) machineCodeGroups.set(mapping.erpMachineCode, { operationCount: 0, description: null });
  });
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
    machineCodes: [...machineCodeGroups.entries()]
      .sort((a, b) => a[0].localeCompare(b[0], "fr", { numeric: true }))
      .map(([code, group]) => ({
        code,
        description: group.description,
        operationCount: group.operationCount,
        machineId: code ? mappings[code]?.machineId ?? null : null,
      })),
    legacyMachineStates: extractLegacyErpMachineStates(mappings),
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
    quantity: row.workOrder.quantity,
  };
  return { ...row, workOrder };
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
