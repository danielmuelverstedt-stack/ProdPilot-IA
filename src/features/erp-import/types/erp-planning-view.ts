export const ERP_PLANNING_VIEW_VERSION = 1;

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

export interface ErpPlanningViewFilters {
  search: string;
  machine: string;
  status: string;
  late: string;
  articleMultiplicity: ErpPlanningArticleFilter;
}

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
