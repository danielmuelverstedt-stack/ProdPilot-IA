import type { OperationView } from "../types/erp-import.ts";
import type { PlanningFilters, PlanningTechnicalState } from "../types/erp-planning-view.ts";

export interface PlanningFilterOptions {
  clients: string[];
  departments: string[];
  resourceGroups: string[];
  machines: string[];
  erpPriorities: number[];
  userPriorities: number[];
  erpStatusIds: number[];
  erpStatuses: string[];
}

export class FilterEngine {
  apply(operations: OperationView[], filters: PlanningFilters): OperationView[] {
    const search = normalize(filters.search);
    return operations.filter((operation) => {
      if (!matchesDefaultVisibility(operation, filters.technicalStates)) return false;
      if (search && ![operation.workOrderId, operation.articleCode, operation.description, operation.workOrder?.customerName].some((value) => normalize(value).includes(search))) return false;
      if (!matches(filters.clients, operation.workOrder?.customerName ?? null)) return false;
      if (!matches(filters.departments, operation.department)) return false;
      if (!matches(filters.resourceGroups, operation.resourceGroup)) return false;
      if (!matches(filters.machines, operation.machine)) return false;
      if (!matchesNumber(filters.erpPriorities, operation.sourcePriority)) return false;
      if (!matchesNumber(filters.userPriorities, operation.userPriority)) return false;
      if (!matchesNumber(filters.erpStatusIds, operation.sourceOperationStatusId)) return false;
      if (!matches(filters.erpStatuses, operation.sourceOrderStatus)) return false;
      if (!matchesTechnicalStates(operation, filters.technicalStates)) return false;
      if (filters.articleMultiplicity === "multiple" && operation.articleWorkOrderCount <= 1) return false;
      if (filters.articleMultiplicity === "unique" && operation.articleWorkOrderCount !== 1) return false;
      return true;
    });
  }

  options(operations: OperationView[]): PlanningFilterOptions {
    return {
      clients: strings(operations.map((operation) => operation.workOrder?.customerName)),
      departments: strings(operations.map((operation) => operation.department)),
      resourceGroups: strings(operations.map((operation) => operation.resourceGroup)),
      machines: strings(operations.map((operation) => operation.machine).filter((value) => value !== "Non définie")),
      erpPriorities: numbers(operations.map((operation) => operation.sourcePriority)),
      userPriorities: numbers(operations.map((operation) => operation.userPriority)),
      erpStatusIds: numbers(operations.map((operation) => operation.sourceOperationStatusId)),
      erpStatuses: strings(operations.map((operation) => operation.sourceOrderStatus)),
    };
  }
}

function matches(values: string[], candidate: string | null): boolean { return !values.length || (candidate !== null && values.includes(candidate)); }
function matchesNumber(values: number[], candidate: number | null): boolean { return !values.length || (candidate !== null && values.includes(candidate)); }
function normalize(value: unknown): string { return String(value ?? "").trim().toLocaleLowerCase("fr"); }
function strings(values: Array<string | null | undefined>): string[] { return [...new Set(values.map((value) => value?.trim()).filter((value): value is string => Boolean(value)))].sort((a, b) => a.localeCompare(b, "fr", { numeric: true })); }
function numbers(values: Array<number | null | undefined>): number[] { return [...new Set(values.filter((value): value is number => typeof value === "number" && Number.isFinite(value)))].sort((a, b) => a - b); }

function matchesDefaultVisibility(operation: OperationView, states: PlanningTechnicalState[]): boolean {
  if (!states.includes("removed") && operation.isRemoved) return false;
  if (!states.includes("hidden") && !operation.isVisible) return false;
  return true;
}

function matchesTechnicalStates(operation: OperationView, states: PlanningTechnicalState[]): boolean {
  if (!states.length) return true;
  return states.some((state) => ({
    "without-machine": operation.isWithoutMachine,
    "with-machine": !operation.isWithoutMachine,
    removed: operation.isRemoved,
    visible: operation.isVisible,
    hidden: !operation.isVisible,
  })[state]);
}

export const filterEngine = new FilterEngine();
