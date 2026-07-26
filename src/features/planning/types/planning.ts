import type { MaintenanceEvent, PlannedOperation, WorkOperation, WorkOrder } from "@/features/demo/types/demo";
import type { ErpOperationStatus, OperationView } from "@/features/erp-import/types/erp-import";
import type { ErpOperationStatusTone } from "@/features/erp-import/services/erp-operation-status-presentation";
import type { DepartmentSettings, OrderedStandardSettings, PrioritySettings, StatusSettings, TaskTypeSettings } from "@/features/settings/types/settings";

export type PlanningStatus = string;

export interface PlanningDay {
  date: string;
  dayLabel: string;
  dateLabel: string;
  week: number;
  isWeekEnd: boolean;
}

export interface PlanningMachine {
  id: string;
  name: string;
  displayName: string;
  departmentId: string;
  department: string;
  departmentValue: string;
  color: string;
  order: number;
  capacityByDate: Record<string, number>;
  status: string;
  hasDetails: boolean;
  /** Catégorie de tâche assignée à la machine/poste (voir task-category-dictionary.ts) ; `null` = non catégorisée. */
  taskCategoryCode: string | null;
}

interface PlanningBlockBase {
  id: string;
  machineId: string;
  date: string;
  /** null = donnée indisponible (jamais une valeur inventée), pas 0 heure. */
  durationHours: number | null;
  status: PlanningStatus;
  isBlocked: boolean;
  comments: string;
  responsible: string;
}

export interface WorkOrderPlanningBlock extends PlanningBlockBase {
  source: "work-order";
  durationHours: number;
  display: OrderedStandardSettings;
  plan: PlannedOperation;
  order: WorkOrder;
  operation: WorkOperation;
  priority: PrioritySettings;
  hasMatchingArticle: boolean;
}

export interface TaskPlanningBlock extends PlanningBlockBase {
  source: "task";
  durationHours: number;
  display: OrderedStandardSettings;
  maintenance: MaintenanceEvent;
  label: string;
  priority: null;
  taskType: TaskTypeSettings;
  maintenanceType: OrderedStandardSettings | null;
}

/**
 * Opération ERP réelle placée sur la grille (jour = plannedDate, machine = operationView.machineId).
 * Aucun temps de fabrication : OperationView n'en porte pas, donc durationHours reste null ici.
 */
export interface ErpOperationPlanningBlock extends PlanningBlockBase {
  source: "erp-operation";
  durationHours: null;
  status: ErpOperationStatus;
  display: { tone: ErpOperationStatusTone; label: string };
  operationView: OperationView;
  priority: null;
}

export type PlanningBlock = WorkOrderPlanningBlock | TaskPlanningBlock | ErpOperationPlanningBlock;

export interface PlanningViewModel {
  days: PlanningDay[];
  machines: PlanningMachine[];
  blocks: PlanningBlock[];
  weeks: number[];
  departments: DepartmentSettings[];
  statuses: StatusSettings[];
  maintenanceStatuses: StatusSettings[];
  priorities: PrioritySettings[];
  taskTypes: TaskTypeSettings[];
  maintenanceTypes: OrderedStandardSettings[];
  plannedStatus: StatusSettings;
  plannedMaintenanceStatus: StatusSettings;
  allDepartmentsLabel: string;
  loadWarningPercent: number;
  loadCriticalPercent: number;
  loadColors: { normal: string; warning: string; critical: string };
}

export interface PlanningFiltersState {
  department: string;
  machineId: string;
  customer: string;
  workOrder: string;
  week: "all" | number;
}

export interface PlanningMoveTarget {
  block: WorkOrderPlanningBlock | ErpOperationPlanningBlock;
  machineId: string;
  date: string;
}
