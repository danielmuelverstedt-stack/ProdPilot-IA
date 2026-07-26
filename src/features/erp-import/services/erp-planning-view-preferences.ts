import {
  ERP_PLANNING_COLUMN_IDS,
  ERP_PLANNING_VIEW_VERSION,
  type ErpPlanningArticleFilter,
  type ErpPlanningColumnId,
  type ErpPlanningColumnPreference,
  type ErpPlanningGroupBy,
  type ErpPlanningSavedView,
  type ErpPlanningSort,
  type ErpPlanningViewState,
} from "../types/erp-planning-view.ts";
import { moveColumnId } from "../../../lib/table-columns.ts";

const DEFAULT_COLUMN_WIDTHS: Record<ErpPlanningColumnId, number> = {
  score: 90,
  "work-order": 130,
  operation: 135,
  client: 190,
  article: 180,
  description: 240,
  date: 170,
  delay: 135,
  machine: 230,
  priority: 120,
  status: 170,
  comment: 240,
  quality: 220,
};

export const ERP_PLANNING_COLUMN_LABELS: Record<ErpPlanningColumnId, string> = {
  score: "Score",
  "work-order": "OF",
  operation: "Opération",
  client: "Client",
  article: "Article",
  description: "Description",
  date: "Date",
  delay: "Retard",
  machine: "Machine",
  priority: "Priorité",
  status: "Statut",
  comment: "Commentaires",
  quality: "Qualité",
};

const DEFAULT_HIDDEN_COLUMNS = new Set<ErpPlanningColumnId>(["description", "comment"]);
const GROUPS: ErpPlanningGroupBy[] = ["none", "article", "work-order", "machine", "department", "client", "family", "priority", "status", "date"];
const SORTS: ErpPlanningSort[] = ["priority", "due-date", "work-order", "machine", "client", "article"];
const ARTICLE_FILTERS: ErpPlanningArticleFilter[] = ["all", "multiple", "unique"];

export function createDefaultErpPlanningView(now = new Date().toISOString()): ErpPlanningSavedView {
  return {
    id: "personal-default",
    name: "Vue personnelle",
    columns: ERP_PLANNING_COLUMN_IDS.map((id) => ({
      id,
      visible: !DEFAULT_HIDDEN_COLUMNS.has(id),
      pinned: id === "score" || id === "work-order",
      width: DEFAULT_COLUMN_WIDTHS[id],
    })),
    groupBy: "none",
    sort: "priority",
    sortDirection: "asc",
    filters: emptyPlanningFilters(),
    zoom: 100,
    updatedAt: now,
  };
}

export function createDefaultErpPlanningViewState(): ErpPlanningViewState {
  const view = createDefaultErpPlanningView();
  return { version: ERP_PLANNING_VIEW_VERSION, activeViewId: view.id, views: [view] };
}

export function parseErpPlanningViewState(value: unknown): ErpPlanningViewState {
  if (!isRecord(value) || (value.version !== 1 && value.version !== ERP_PLANNING_VIEW_VERSION) || !Array.isArray(value.views)) return createDefaultErpPlanningViewState();
  const views = value.views.map(parseView).filter((view): view is ErpPlanningSavedView => Boolean(view));
  if (!views.length) return createDefaultErpPlanningViewState();
  const activeViewId = typeof value.activeViewId === "string" && views.some((view) => view.id === value.activeViewId) ? value.activeViewId : views[0].id;
  return { version: ERP_PLANNING_VIEW_VERSION, activeViewId, views };
}

export function resetErpPlanningView(current: ErpPlanningSavedView): ErpPlanningSavedView {
  const defaults = createDefaultErpPlanningView();
  return { ...defaults, id: current.id, name: current.name, updatedAt: new Date().toISOString() };
}

export function moveErpPlanningColumn(columns: ErpPlanningColumnPreference[], sourceId: ErpPlanningColumnId, targetId: ErpPlanningColumnId): ErpPlanningColumnPreference[] {
  const sourceIndex = columns.findIndex((column) => column.id === sourceId);
  const targetIndex = columns.findIndex((column) => column.id === targetId);
  if (sourceIndex < 0 || targetIndex < 0) return columns;
  const order = moveColumnId(columns.map((column) => column.id), sourceId, targetId);
  const byId = new Map(columns.map((column) => [column.id, column]));
  return order.map((id) => byId.get(id)!);
}

function parseView(value: unknown): ErpPlanningSavedView | null {
  if (!isRecord(value) || typeof value.id !== "string" || !value.id || typeof value.name !== "string" || !value.name.trim()) return null;
  const rawColumns = Array.isArray(value.columns) ? value.columns : [];
  const columnById = new Map<ErpPlanningColumnId, ErpPlanningColumnPreference>();
  rawColumns.forEach((column) => {
    if (!isRecord(column) || !isColumnId(column.id) || columnById.has(column.id)) return;
    columnById.set(column.id, {
      id: column.id,
      visible: typeof column.visible === "boolean" ? column.visible : true,
      pinned: typeof column.pinned === "boolean" ? column.pinned : false,
      width: clampNumber(column.width, 80, 480, DEFAULT_COLUMN_WIDTHS[column.id]),
    });
  });
  const defaults = createDefaultErpPlanningView();
  const columns = [...columnById.values(), ...defaults.columns.filter((column) => !columnById.has(column.id))];
  const filters = isRecord(value.filters) ? value.filters : {};
  return {
    id: value.id,
    name: value.name.trim().slice(0, 80),
    columns,
    groupBy: GROUPS.includes(value.groupBy as ErpPlanningGroupBy) ? value.groupBy as ErpPlanningGroupBy : "none",
    sort: SORTS.includes(value.sort as ErpPlanningSort) ? value.sort as ErpPlanningSort : "priority",
    sortDirection: value.sortDirection === "desc" ? "desc" : "asc",
    filters: {
      search: typeof filters.search === "string" ? filters.search.slice(0, 200) : "",
      clients: stringArray(filters.clients),
      departments: stringArray(filters.departments),
      resourceGroups: stringArray(filters.resourceGroups),
      machines: stringArray(filters.machines, typeof filters.machine === "string" ? filters.machine : undefined),
      erpPriorities: numberArray(filters.erpPriorities),
      userPriorities: numberArray(filters.userPriorities),
      erpStatusIds: numberArray(filters.erpStatusIds),
      erpStatuses: stringArray(filters.erpStatuses),
      technicalStates: stringArray(filters.technicalStates).filter((value): value is "without-machine" | "with-machine" | "removed" | "visible" | "hidden" => ["without-machine", "with-machine", "removed", "visible", "hidden"].includes(value)),
      articleMultiplicity: ARTICLE_FILTERS.includes(filters.articleMultiplicity as ErpPlanningArticleFilter) ? filters.articleMultiplicity as ErpPlanningArticleFilter : "all",
    },
    zoom: clampNumber(value.zoom, 80, 120, 100),
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : new Date().toISOString(),
  };
}

export function emptyPlanningFilters(): ErpPlanningSavedView["filters"] {
  return { search: "", clients: [], departments: [], resourceGroups: [], machines: [], erpPriorities: [], userPriorities: [], erpStatusIds: [], erpStatuses: [], technicalStates: [], articleMultiplicity: "all" };
}

function stringArray(value: unknown, legacy?: string): string[] {
  const values = Array.isArray(value) ? value : legacy ? [legacy] : [];
  return [...new Set(values.filter((entry): entry is string => typeof entry === "string" && Boolean(entry.trim())).map((entry) => entry.trim().slice(0, 100)))].slice(0, 200);
}

function numberArray(value: unknown): number[] {
  return Array.isArray(value) ? [...new Set(value.filter((entry): entry is number => typeof entry === "number" && Number.isFinite(entry)))].slice(0, 200) : [];
}

function isColumnId(value: unknown): value is ErpPlanningColumnId {
  return typeof value === "string" && ERP_PLANNING_COLUMN_IDS.includes(value as ErpPlanningColumnId);
}

function clampNumber(value: unknown, minimum: number, maximum: number, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? Math.min(maximum, Math.max(minimum, Math.round(value))) : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
