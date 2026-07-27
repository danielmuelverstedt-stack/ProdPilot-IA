import { ROWS_PER_MACHINE_OPTIONS, SORTABLE_COLUMN_IDS, WORKSHOP_COLUMN_IDS, WORKSHOP_COLUMN_MAX_WIDTH_PX, WORKSHOP_COLUMN_MIN_WIDTH_PX, WORKSHOP_VIEW_VERSION, type WorkshopColumnId, type WorkshopColumnPreference, type WorkshopFilterState, type WorkshopRowsPerMachine, type WorkshopSortColumn, type WorkshopSortState, type WorkshopViewState } from "../types/workshop-view.ts";
import type { ErpPlanningArticleFilter } from "@/features/erp-import/types/erp-planning-view";
import { cycleColumnSort, moveColumnId } from "../../../lib/table-columns.ts";

const ARTICLE_MULTIPLICITY_FILTERS: ErpPlanningArticleFilter[] = ["all", "multiple", "unique"];

export const WORKSHOP_COLUMN_LABELS: Record<WorkshopColumnId, string> = {
  priority: "Priorité",
  "work-order": "OF",
  operation: "Opération",
  article: "Article",
  client: "Client",
  quantity: "Quantité",
  description: "Désignation",
  time: "Temps",
  status: "Statut",
  "start-date": "Date début",
  "end-date": "Date fin",
  delay: "Retard",
  machine: "Machine",
};

const DEFAULT_ROWS_PER_MACHINE: WorkshopRowsPerMachine = 10;

export function createDefaultWorkshopColumns(): WorkshopColumnPreference[] {
  return WORKSHOP_COLUMN_IDS.map((id) => ({ id, visible: true }));
}

export function createDefaultWorkshopFilters(): WorkshopFilterState {
  return { search: "", departments: [], showActiveMachines: true, showInactiveMachines: false, showMaskedMachines: false, showMachinesWithoutOperations: true, articleMultiplicity: "all" };
}

export function createDefaultWorkshopSort(): WorkshopSortState {
  return { column: null, direction: "desc" };
}

export function createDefaultWorkshopViewState(): WorkshopViewState {
  return { version: WORKSHOP_VIEW_VERSION, columns: createDefaultWorkshopColumns(), collapsedMachineIds: [], filters: createDefaultWorkshopFilters(), rowsPerMachine: DEFAULT_ROWS_PER_MACHINE, sort: createDefaultWorkshopSort(), columnWidths: {}, selectedDepartmentId: null };
}

/** Utilisé par la poignée de redimensionnement des colonnes : borne la largeur demandée à l'intervalle accepté. */
export function clampColumnWidth(width: number): number {
  return Math.min(WORKSHOP_COLUMN_MAX_WIDTH_PX, Math.max(WORKSHOP_COLUMN_MIN_WIDTH_PX, Math.round(width)));
}

export function parseWorkshopViewState(value: unknown): WorkshopViewState {
  if (!isRecord(value) || value.version !== WORKSHOP_VIEW_VERSION) return createDefaultWorkshopViewState();
  const defaults = createDefaultWorkshopColumns();
  const columnById = new Map<WorkshopColumnId, WorkshopColumnPreference>();
  (Array.isArray(value.columns) ? value.columns : []).forEach((column) => {
    if (!isRecord(column) || !isColumnId(column.id) || columnById.has(column.id)) return;
    columnById.set(column.id, { id: column.id, visible: typeof column.visible === "boolean" ? column.visible : true });
  });
  const columns = [...columnById.values(), ...defaults.filter((column) => !columnById.has(column.id))];
  const filters = isRecord(value.filters) ? value.filters : {};
  const defaultFilters = createDefaultWorkshopFilters();
  return {
    version: WORKSHOP_VIEW_VERSION,
    columns,
    collapsedMachineIds: stringArray(value.collapsedMachineIds),
    filters: {
      search: typeof filters.search === "string" ? filters.search.slice(0, 200) : defaultFilters.search,
      departments: stringArray(filters.departments),
      showActiveMachines: typeof filters.showActiveMachines === "boolean" ? filters.showActiveMachines : defaultFilters.showActiveMachines,
      showInactiveMachines: typeof filters.showInactiveMachines === "boolean" ? filters.showInactiveMachines : defaultFilters.showInactiveMachines,
      showMaskedMachines: typeof filters.showMaskedMachines === "boolean" ? filters.showMaskedMachines : defaultFilters.showMaskedMachines,
      showMachinesWithoutOperations: typeof filters.showMachinesWithoutOperations === "boolean" ? filters.showMachinesWithoutOperations : defaultFilters.showMachinesWithoutOperations,
      articleMultiplicity: ARTICLE_MULTIPLICITY_FILTERS.includes(filters.articleMultiplicity as ErpPlanningArticleFilter) ? filters.articleMultiplicity as ErpPlanningArticleFilter : defaultFilters.articleMultiplicity,
    },
    rowsPerMachine: isRowsPerMachine(value.rowsPerMachine) ? value.rowsPerMachine : DEFAULT_ROWS_PER_MACHINE,
    sort: parseSortState(value.sort, (value as { prioritySort?: unknown }).prioritySort),
    columnWidths: parseColumnWidths(value.columnWidths),
    selectedDepartmentId: typeof value.selectedDepartmentId === "string" && value.selectedDepartmentId ? value.selectedDepartmentId : null,
  };
}

function parseColumnWidths(value: unknown): Partial<Record<WorkshopColumnId, number>> {
  if (!isRecord(value)) return {};
  const widths: Partial<Record<WorkshopColumnId, number>> = {};
  for (const [columnId, width] of Object.entries(value)) {
    if (isColumnId(columnId) && typeof width === "number" && Number.isFinite(width)) widths[columnId] = clampColumnWidth(width);
  }
  return widths;
}

export function resetWorkshopView(current: WorkshopViewState): WorkshopViewState {
  return { ...createDefaultWorkshopViewState(), collapsedMachineIds: current.collapsedMachineIds, selectedDepartmentId: current.selectedDepartmentId };
}

export function moveWorkshopColumn(columns: WorkshopColumnPreference[], sourceId: WorkshopColumnId, targetId: WorkshopColumnId): WorkshopColumnPreference[] {
  const sourceIndex = columns.findIndex((column) => column.id === sourceId);
  const targetIndex = columns.findIndex((column) => column.id === targetId);
  if (sourceIndex < 0 || targetIndex < 0) return columns;
  const order = moveColumnId(columns.map((column) => column.id), sourceId, targetId);
  const byId = new Map(columns.map((column) => [column.id, column]));
  return order.map((id) => byId.get(id)!);
}

/**
 * Clic sur l'en-tête d'une colonne triable : décroissant → croissant → aucun tri, une seule
 * colonne active à la fois (comme un tableur) — cliquer une autre colonne bascule dessus.
 */
export function nextSortState(current: WorkshopSortState, column: WorkshopSortColumn): WorkshopSortState {
  return cycleColumnSort(current, column);
}

function parseSortState(rawSort: unknown, legacyPrioritySort: unknown): WorkshopSortState {
  if (isRecord(rawSort) && isSortColumnOrNull(rawSort.column) && isSortDirection(rawSort.direction)) {
    return { column: rawSort.column, direction: rawSort.direction };
  }
  // Compatibilité avec l'ancien champ prioritySort ("none"/"asc"/"desc"), remplacé par un tri générique par colonne.
  if (legacyPrioritySort === "asc" || legacyPrioritySort === "desc") return { column: "priority", direction: legacyPrioritySort };
  if (legacyPrioritySort === "none") return createDefaultWorkshopSort();
  return createDefaultWorkshopSort();
}

function isSortColumnOrNull(value: unknown): value is WorkshopSortColumn | null {
  return value === null || (typeof value === "string" && (SORTABLE_COLUMN_IDS as readonly string[]).includes(value));
}

function isSortDirection(value: unknown): value is "asc" | "desc" {
  return value === "asc" || value === "desc";
}

function isColumnId(value: unknown): value is WorkshopColumnId {
  return typeof value === "string" && WORKSHOP_COLUMN_IDS.includes(value as WorkshopColumnId);
}

function isRowsPerMachine(value: unknown): value is WorkshopRowsPerMachine {
  return (ROWS_PER_MACHINE_OPTIONS as readonly unknown[]).includes(value);
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? [...new Set(value.filter((entry): entry is string => typeof entry === "string" && Boolean(entry.trim())))].slice(0, 500) : [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
