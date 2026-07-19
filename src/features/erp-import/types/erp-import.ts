export const ERP_IMPORT_VERSION = 1;

export type ErpImportStatus = "accepted" | "rejected";
export type ErpIssueSeverity = "blocking" | "high" | "medium" | "low";
export type ErpOperationStatus = "not-started" | "in-progress" | "completed" | "blocked" | "unknown";

export interface ErpImportFileSummary {
  kind: "top" | "details";
  name: string;
  sha256: string;
  size: number;
  rowCount: number;
}

export interface ErpImportSummary {
  id: string;
  importedAt: string;
  status: ErpImportStatus;
  files: ErpImportFileSummary[];
  workOrderCount: number;
  operationCount: number;
  linkedOperationCount: number;
  issueCount: number;
  duplicateOf: string | null;
}

export interface ErpWorkOrder {
  id: string;
  status: string | null;
  newDelayLabel: string | null;
  articleCode: string;
  description: string | null;
  articleId: string;
  articleGroupId: string;
  customerName: string;
  customerOrderNumber: string;
  customerOrderLine: string;
  confirmedDueDate: string | null;
  requestedDueDate: string | null;
  quantity: number;
  customerReference: string | null;
  orderStatus: string | null;
  lineStatus: string;
  responsible: string;
  customerOrderDetailId: string;
  sourceRow: number;
  sourceRows: number[];
  orderLines: ErpWorkOrderLine[];
}

export interface ErpWorkOrderLine {
  sourceRow: number;
  customerName: string;
  customerOrderNumber: string;
  customerOrderLine: string;
  confirmedDueDate: string | null;
  requestedDueDate: string | null;
  quantity: number;
  customerReference: string | null;
  lineStatus: string;
  customerOrderDetailId: string;
}

export type ErpPlanningWorkOrderSummary = Pick<ErpWorkOrder, "id" | "articleCode" | "articleId" | "articleGroupId" | "customerName" | "customerReference">;

export interface ErpOperation {
  id: string;
  workOrderId: string;
  operationNumber: number;
  operationStatusId: number;
  taskCode: string;
  actualStartAt: string | null;
  actualEndAt: string | null;
  subcontracted: boolean;
  orderStatus: string;
  erpDueDate: string | null;
  articleCode: string;
  description: string | null;
  macroRangeCode: string;
  erpPriority: number;
  erpMachineCode: string;
  normalizedStatus: ErpOperationStatus;
  sourceRow: number;
  duplicateOf: string | null;
}

export interface ErpPlanningProjection {
  version: typeof ERP_IMPORT_VERSION;
  activeImportId: string | null;
  imports: ErpImportSummary[];
  workOrders: ErpWorkOrder[];
  operations: ErpOperation[];
}

export interface ErpManualOverride {
  operationId: string;
  plannedDate?: string | null;
  machineId?: string | null;
  priority?: number | null;
  status?: ErpOperationStatus | null;
  comment?: string | null;
  updatedAt: string;
}

export interface ErpMachineMapping {
  erpMachineCode: string;
  machineId: string;
  updatedAt: string;
}

export interface ErpPlanningRow extends ErpOperation {
  workOrder: ErpWorkOrder | ErpPlanningWorkOrderSummary | null;
  plannedDate: string | null;
  machineId: string | null;
  effectivePriority: number;
  effectiveStatus: ErpOperationStatus;
  comment: string | null;
  delayDays: number | null;
  priorityScore: number;
  articleWorkOrderCount: number;
  hasManualOverride: boolean;
  issues: string[];
}

export interface ErpQualityIssue {
  id: string;
  operationId: string | null;
  workOrderId: string | null;
  category:
    | "missing-machine"
    | "missing-date"
    | "missing-priority"
    | "missing-task"
    | "unknown-macro-range"
    | "missing-customer"
    | "missing-article"
    | "missing-reference"
    | "missing-work-order"
    | "work-order-without-operation"
    | "duplicate-operation"
    | "invalid-date"
    | "invalid-quantity"
    | "suspect-quantity"
    | "inconsistent-article"
    | "unknown-status";
  severity: ErpIssueSeverity;
  message: string;
}

export interface ErpPlanningOverview {
  activeImport: ErpImportSummary | null;
  imports: ErpImportSummary[];
  metrics: {
    workOrders: number;
    operations: number;
    lateOperations: number;
    unmappedOperations: number;
      completedOperations: number;
      multiWorkOrderArticles: number;
      workOrdersInMultipleArticles: number;
      qualityScore: number;
  };
  machineCodes: Array<{ code: string; operationCount: number; machineId: string | null }>;
  issueCounts: Array<{ category: ErpQualityIssue["category"]; count: number }>;
}

export interface ErpPlanningQueryResult {
  rows: ErpPlanningRow[];
  total: number;
  page: number;
  pageSize: number;
}
