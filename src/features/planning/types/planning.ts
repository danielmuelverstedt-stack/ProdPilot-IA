import type { MaintenanceEvent, PlannedOperation, WorkOperation, WorkOrder } from "@/features/demo/types/demo";
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
}

interface PlanningBlockBase {
  id: string;
  machineId: string;
  date: string;
  durationHours: number;
  status: PlanningStatus;
  display: OrderedStandardSettings;
  isBlocked: boolean;
  comments: string;
  responsible: string;
}

export interface WorkOrderPlanningBlock extends PlanningBlockBase {
  source: "work-order";
  plan: PlannedOperation;
  order: WorkOrder;
  operation: WorkOperation;
  priority: PrioritySettings;
  hasMatchingArticle: boolean;
}

export interface TaskPlanningBlock extends PlanningBlockBase {
  source: "task";
  maintenance: MaintenanceEvent;
  label: string;
  priority: null;
  taskType: TaskTypeSettings;
  maintenanceType: OrderedStandardSettings | null;
}

export type PlanningBlock = WorkOrderPlanningBlock | TaskPlanningBlock;

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
  block: WorkOrderPlanningBlock;
  machineId: string;
  date: string;
}
