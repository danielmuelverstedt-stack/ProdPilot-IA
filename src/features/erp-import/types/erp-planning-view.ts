export const ERP_PLANNING_VIEW_VERSION = 2;

export const ERP_PLANNING_COLUMN_IDS = [
  "score",
  "work-order",
  "operation",
  "client",
  "article",
  "description",
  "date",
  "delay",
  "machine",
  "priority",
  "status",
  "comment",
  "quality",
] as const;

export type ErpPlanningColumnId = (typeof ERP_PLANNING_COLUMN_IDS)[number];
export type ErpPlanningGroupBy = "none" | "article" | "work-order" | "machine" | "department" | "client" | "family" | "priority" | "status" | "date";
export type ErpPlanningArticleFilter = "all" | "multiple" | "unique";
export type ErpPlanningSort = "priority" | "due-date" | "work-order" | "machine" | "client" | "article";

export interface ErpPlanningColumnPreference {
  id: ErpPlanningColumnId;
  visible: boolean;
  pinned: boolean;
  width: number;
}

export type PlanningTechnicalState = "without-machine" | "with-machine" | "removed" | "visible" | "hidden";

export interface PlanningFilters {
  search: string;
  clients: string[];
  departments: string[];
  resourceGroups: string[];
  machines: string[];
  erpPriorities: number[];
  userPriorities: number[];
  erpStatusIds: number[];
  erpStatuses: string[];
  technicalStates: PlanningTechnicalState[];
  articleMultiplicity: ErpPlanningArticleFilter;
}

export type ErpPlanningViewFilters = PlanningFilters;

export interface ErpPlanningSavedView {
  id: string;
  name: string;
  columns: ErpPlanningColumnPreference[];
  groupBy: ErpPlanningGroupBy;
  sort: ErpPlanningSort;
  filters: ErpPlanningViewFilters;
  zoom: number;
  updatedAt: string;
}

export interface ErpPlanningViewState {
  version: typeof ERP_PLANNING_VIEW_VERSION;
  activeViewId: string;
  views: ErpPlanningSavedView[];
}

export interface ErpPlanningPreferenceContext {
  companyId: string;
  siteId: string;
  userId: string;
}
