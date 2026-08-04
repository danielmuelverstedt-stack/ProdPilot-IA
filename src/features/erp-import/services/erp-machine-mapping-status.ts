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

/**
 * Catégorie de tâche dont une seule machine (ou poste) non supprimée est taguée
 * (`MachineSettings.taskCategoryCode`, champ de la fiche machine — Parc Machines → la machine →
 * Identité → Catégorie) : ce champ « lie constamment » la machine à sa catégorie, comme demandé
 * par l'utilisateur. Dès qu'une deuxième machine porte la même catégorie, elle n'a plus de
 * candidate unique et n'apparaît plus dans cette table — aucune purge nécessaire, rien n'a jamais
 * été écrit pour ces OF (voir plus bas).
 */
function buildSoleCategoryMachineIdByTaskCode(machines: MachineSettings[]): Map<string, string> {
  const candidatesByTaskCode = new Map<string, string[]>();
  machines.forEach((machine) => {
    if (machine.deleted || !machine.taskCategoryCode) return;
    const list = candidatesByTaskCode.get(machine.taskCategoryCode) ?? [];
    list.push(machine.id);
    candidatesByTaskCode.set(machine.taskCategoryCode, list);
  });
  const soleMachineIdByTaskCode = new Map<string, string>();
  candidatesByTaskCode.forEach((ids, taskCode) => { if (ids.length === 1) soleMachineIdByTaskCode.set(taskCode, ids[0]); });
  return soleMachineIdByTaskCode;
}

/**
 * Index une seule fois les machines par id (au lieu d'un `.find()` par opération) : sensible sur
 * ~23 000 lignes, appelé à chaque import/mutation. Assigne aussi automatiquement à sa machine
 * unique tout OF sans machine réellement assignée dont la catégorie n'a qu'une seule candidate
 * (voir `buildSoleCategoryMachineIdByTaskCode`) — calculé à chaque lecture, donc toujours à jour
 * (nouveaux OF d'un futur import compris) sans qu'aucune action ne soit nécessaire. Une assignation
 * manuelle explicite (glisser-déposer/sélecteur, qui écrit un vrai `machineId` via
 * `PlanningDecision`) garde toujours la priorité : cette fonction ne touche jamais une ligne dont
 * `machineId` pointe déjà vers une machine réelle non supprimée.
 */
export function reconcileOperationViewMachineCatalog(rows: OperationView[], machines: MachineSettings[]): OperationView[] {
  const machineById = new Map(machines.map((machine) => [machine.id, machine]));
  const soleCategoryMachineIdByTaskCode = buildSoleCategoryMachineIdByTaskCode(machines);
  return rows.map((row) => {
    const machine = row.machineId ? machineById.get(row.machineId) ?? null : null;
    if (machine && !machine.deleted) return row;
    if (row.machineId !== null) return { ...row, machineId: null, machine: "Non définie", isWithoutMachine: true };
    const ruleMachineId = soleCategoryMachineIdByTaskCode.get(row.taskCode) ?? null;
    if (!ruleMachineId) return row;
    return { ...row, machineId: ruleMachineId, machine: machineById.get(ruleMachineId)!.displayName, isWithoutMachine: false };
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
