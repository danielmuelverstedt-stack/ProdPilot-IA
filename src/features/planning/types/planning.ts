import type {
  Machine,
  MaintenanceEvent,
  PlannedOperation,
  Priority,
  WorkOperation,
  WorkOrder,
} from "@/features/demo/types/demo";

export type PlanningStatus = WorkOperation["status"] | "Maintenance" | "Divers";

export interface PlanningDay {
  date: string;
  dayLabel: string;
  dateLabel: string;
  week: number;
  isFriday: boolean;
}

export interface PlanningMachine {
  id: string;
  name: string;
  displayName: string;
  department: string;
  capacityHours: number;
  status: Machine["status"] | "Disponible";
  hasDetails: boolean;
}

interface PlanningBlockBase {
  id: string;
  machineId: string;
  date: string;
  durationHours: number;
  status: PlanningStatus;
  comments: string;
  responsible: string;
}

export interface WorkOrderPlanningBlock extends PlanningBlockBase {
  source: "work-order";
  plan: PlannedOperation;
  order: WorkOrder;
  operation: WorkOperation;
  priority: Priority;
  hasMatchingArticle: boolean;
}

export interface TaskPlanningBlock extends PlanningBlockBase {
  source: "task";
  maintenance: MaintenanceEvent;
  label: string;
  priority: null;
}

export type PlanningBlock = WorkOrderPlanningBlock | TaskPlanningBlock;

export interface PlanningViewModel {
  days: PlanningDay[];
  machines: PlanningMachine[];
  blocks: PlanningBlock[];
  weeks: number[];
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
