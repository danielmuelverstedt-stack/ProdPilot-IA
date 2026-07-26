import type { MachineSettings } from "@/features/settings/types/settings";
import type { OperationView } from "@/features/erp-import/types/erp-import";
import type { ErpPlanningOverview } from "@/features/erp-import/types/erp-import";

export type ErpMachineMappingStatus = "mapped" | "unmapped" | "deleted" | "inactive";

export interface ErpMachineMappingState {
  status: ErpMachineMappingStatus;
  machine: MachineSettings | null;
  hasMissingTarget: boolean;
}

export function classifyErpMachineMapping(machineId: string | null, machines: MachineSettings[]): ErpMachineMappingState {
  if (!machineId) return { status: "unmapped", machine: null, hasMissingTarget: false };
  const machine = machines.find((entry) => entry.id === machineId) ?? null;
  if (!machine) return { status: "unmapped", machine: null, hasMissingTarget: true };
  if (machine.deleted) return { status: "deleted", machine, hasMissingTarget: false };
  if (!machine.active) return { status: "inactive", machine, hasMissingTarget: false };
  return { status: "mapped", machine, hasMissingTarget: false };
}

/** Index une seule fois les machines par id (au lieu d'un `.find()` par opération) : sensible sur ~23 000 lignes, appelé à chaque import/mutation. */
export function reconcileOperationViewMachineCatalog(rows: OperationView[], machines: MachineSettings[]): OperationView[] {
  const machineById = new Map(machines.map((machine) => [machine.id, machine]));
  return rows.map((row) => {
    const machine = row.machineId ? machineById.get(row.machineId) ?? null : null;
    if (machine && !machine.deleted) return row;
    return row.machineId === null ? row : { ...row, machineId: null, machine: "Non définie", isWithoutMachine: true };
  });
}

export function filterErpMachineCodeEntries(
  entries: ErpPlanningOverview["machineCodes"],
  machines: MachineSettings[],
  options: { search?: string; unmappedOnly?: boolean; showHidden?: boolean; showActive?: boolean; showInactive?: boolean } = {},
): ErpPlanningOverview["machineCodes"] {
  const normalizedSearch = options.search?.trim().toLocaleLowerCase("fr") ?? "";
  return entries.filter((entry) => {
    const state = classifyErpMachineMapping(entry.machineId, machines);
    const visible = state.machine?.visible ?? true;
    const active = state.machine?.active ?? true;
    if (!visible && !options.showHidden) return false;
    if (active && options.showActive === false) return false;
    if (!active && options.showInactive === false) return false;
    if (options.unmappedOnly && state.status !== "unmapped") return false;
    return !normalizedSearch || [entry.code, entry.description].some((value) => value?.toLocaleLowerCase("fr").includes(normalizedSearch));
  });
}
