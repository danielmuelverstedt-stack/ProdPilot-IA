import type { MachineSettings } from "@/features/settings/types/settings";
import type { OperationView } from "@/features/erp-import/types/erp-import";
import type { ErpPlanningArticleFilter } from "@/features/erp-import/types/erp-planning-view";

export const WORKSHOP_VIEW_VERSION = 1;

export const WORKSHOP_COLUMN_IDS = [
  "priority",
  "work-order",
  "operation",
  "article",
  "client",
  "quantity",
  "description",
  "time",
  "status",
  "start-date",
  "end-date",
  "delay",
  "machine",
] as const;

export type WorkshopColumnId = (typeof WORKSHOP_COLUMN_IDS)[number];

export interface WorkshopColumnPreference {
  id: WorkshopColumnId;
  visible: boolean;
}

/** Largeur minimale/maximale acceptée pour une colonne redimensionnée à la souris. */
export const WORKSHOP_COLUMN_MIN_WIDTH_PX = 80;
export const WORKSHOP_COLUMN_MAX_WIDTH_PX = 640;

export interface WorkshopFilterState {
  search: string;
  departments: string[];
  showActiveMachines: boolean;
  showInactiveMachines: boolean;
  showMaskedMachines: boolean;
  showMachinesWithoutOperations: boolean;
  /** Même filtre que le Cockpit ERP : un article présent dans plusieurs OF en même temps. */
  articleMultiplicity: ErpPlanningArticleFilter;
}

export const ROWS_PER_MACHINE_OPTIONS = [10, 25, 50, "all"] as const;
export type WorkshopRowsPerMachine = (typeof ROWS_PER_MACHINE_OPTIONS)[number];

/** Colonnes pouvant piloter le tri des opérations, une seule active à la fois (comme un tableur). */
export const SORTABLE_COLUMN_IDS = ["priority", "delay"] as const;
export type WorkshopSortColumn = (typeof SORTABLE_COLUMN_IDS)[number];
export type WorkshopSortDirection = "asc" | "desc";

export interface WorkshopSortState {
  column: WorkshopSortColumn | null;
  direction: WorkshopSortDirection;
}

export interface WorkshopViewState {
  version: typeof WORKSHOP_VIEW_VERSION;
  columns: WorkshopColumnPreference[];
  collapsedMachineIds: string[];
  filters: WorkshopFilterState;
  rowsPerMachine: WorkshopRowsPerMachine;
  sort: WorkshopSortState;
  /** Largeur en pixels par colonne redimensionnée à la souris ; absente = largeur par défaut. */
  columnWidths: Partial<Record<WorkshopColumnId, number>>;
  /** Département actif dans les onglets ; `null` = repli sur le premier département actif au rendu. */
  selectedDepartmentId: string | null;
}

export interface WorkshopPreferenceContext {
  companyId: string;
  siteId: string;
  userId: string;
}

/** Charge/heures ne sont pas encore disponibles : OperationView ne porte aucun temps de fabrication. */
export interface WorkshopMachineLoadSummary {
  operationCount: number;
  workOrderCount: number;
  hoursAvailable: false;
}

export interface WorkshopMachineGroup extends WorkshopMachineLoadSummary {
  machine: MachineSettings | null;
  operations: OperationView[];
}

export interface WorkshopDepartmentGroup {
  id: string;
  label: string;
  machines: WorkshopMachineGroup[];
}
