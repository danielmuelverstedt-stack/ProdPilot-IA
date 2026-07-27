export const ERP_IMPORT_VERSION = 1;

export type ErpImportStatus = "accepted" | "rejected";
export type ErpIssueSeverity = "blocking" | "high" | "medium" | "low";
export type ErpOperationStatus = "not-started" | "in-progress" | "completed" | "blocked" | "unknown";
export type ErpRecordStatus = "Active" | "Removed";

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

export type ErpPlanningWorkOrderSummary = Pick<ErpWorkOrder, "id" | "articleCode" | "articleId" | "articleGroupId" | "customerName" | "customerReference" | "quantity">;

export interface ErpOperation {
  id: string;
  /** Identité métier indépendante de la ligne et de l'import. */
  stableId: string;
  erpStatus: ErpRecordStatus;
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
  erpMachineCode: string | null;
  erpMachineDescription: string | null;
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
  stableOperationId?: string;
  plannedDate?: string | null;
  machineId?: string | null;
  priority?: number | null;
  manualOrder?: number | null;
  status?: ErpOperationStatus | null;
  comment?: string | null;
  visible?: boolean | null;
  locked?: boolean | null;
  updatedAt: string;
}

/** Projection durable des choix du planificateur, strictement séparée des données ERP. */
export interface PlanningDecision {
  operationIdentity: string;
  userPriority: number | null;
  manualOrder: number | null;
  plannedMachineId: string | null;
  comment: string | null;
  visible: boolean;
  locked: boolean;
  plannedDate: string | null;
  planningStatus: ErpOperationStatus | null;
  createdAt: string;
  updatedAt: string;
}

/** Modèle métier unique consommé par Planning, IA, Dashboard et ERP Explorer. */
export interface OperationView {
  id: string;
  operationIdentity: string;
  workOrderId: string;
  operationNumber: number;
  taskCode: string;
  articleCode: string;
  description: string | null;
  subcontracted: boolean;
  dueDate: string | null;
  actualStartAt: string | null;
  actualEndAt: string | null;
  status: ErpOperationStatus;
  machine: string;
  machineId: string | null;
  priority: number;
  userPriority: number | null;
  comment: string | null;
  manualOrder: number | null;
  isLocked: boolean;
  hasPlannedMachine: boolean;
  hasUserPriority: boolean;
  hasComment: boolean;
  hasManualOrder: boolean;
  isRemoved: boolean;
  isVisible: boolean;
  isWithoutMachine: boolean;
  isLate: boolean | null;
  isStarted: boolean | null;
  isFinished: boolean | null;
  isBlocked: boolean | null;
  estimatedStart: string | null;
  estimatedEnd: string | null;
  capacityGroup: string | null;
  department: string | null;
  resourceGroup: string | null;
  workOrder: ErpWorkOrder | ErpPlanningWorkOrderSummary | null;
  sourceMachineCode: string | null;
  sourceMachineDescription: string | null;
  /** Alias de compatibilité d'affichage ; la fusion reste détenue par OperationViewService. */
  erpMachineCode: string | null;
  sourcePriority: number;
  effectivePriority: number;
  sourceStatus: ErpOperationStatus;
  effectiveStatus: ErpOperationStatus;
  sourceOperationStatusId: number;
  sourceOrderStatus: string;
  sourceMacroRangeCode: string;
  sourceRow: number;
  duplicateOf: string | null;
  plannedDate: string | null;
  delayDays: number | null;
  priorityScore: number;
  articleWorkOrderCount: number;
  hasManualOverride: boolean;
  issues: string[];
}

export interface ErpSynchronizationReport {
  importId: string;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  newWorkOrders: number;
  newOperations: number;
  updatedOperations: number;
  removedOperations: number;
  preservedDecisions: number;
  lostDecisions: 0;
}

export type ErpDecisionState = "applied" | "ambiguous" | "orphaned" | "inapplicable";
export type ErpDecisionOrigin = "user" | "ai-confirmed" | "migration" | "undo" | "redo";

export interface ErpDecisionEvent {
  id: string;
  occurredAt: string;
  actorId: string;
  companyId: string;
  module: "erp-planning";
  origin: ErpDecisionOrigin;
  operationId: string;
  stableOperationId: string;
  field: keyof Pick<ErpManualOverride, "plannedDate" | "machineId" | "priority" | "manualOrder" | "status" | "comment" | "visible" | "locked">;
  previousValue: string | number | boolean | null;
  nextValue: string | number | boolean | null;
  comment: string | null;
  state: ErpDecisionState;
  stateExplanation: string | null;
  reversesEventId: string | null;
}

export interface ErpImportReconciliationReport {
  importId: string;
  createdAt: string;
  restored: number;
  ambiguous: number;
  orphaned: number;
  inapplicable: number;
  explanations: Array<{ decisionEventId: string; state: Exclude<ErpDecisionState, "applied">; message: string }>;
}

export interface ErpMachineMapping {
  erpMachineCode: string;
  machineId: string | null;
  updatedAt: string;
}

/** @deprecated Utiliser OperationView. */
export type ErpPlanningRow = OperationView;

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
  machineCodes: Array<{ code: string; description: string | null; operationCount: number; machineId: string | null }>;
  legacyMachineStates: Array<{ machineId: string; active?: boolean; visible?: boolean }>;
  issueCounts: Array<{ category: ErpQualityIssue["category"]; count: number }>;
}

export interface ErpPlanningQueryResult {
  rows: OperationView[];
  total: number;
  page: number;
  pageSize: number;
}
