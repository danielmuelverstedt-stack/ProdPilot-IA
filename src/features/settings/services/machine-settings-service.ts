import type { AppSettings, MachineSettings } from "../types/settings.ts";

export interface LegacyErpMachineState {
  machineId: string;
  active?: boolean;
  visible?: boolean;
}

export interface MachineIdentityUpdate {
  name: string;
  displayName: string;
  departmentId: string;
  machineType: string;
  color: string;
  futureCapacityHours: number | null;
  comments: string;
  favorite: boolean;
  /** Code de catégorie de tâche (voir src/lib/task-category-dictionary.ts) ; `null` = non catégorisée. */
  taskCategoryCode: string | null;
}

export interface MachineCreateInput {
  id: string;
  name: string;
  displayName: string;
  departmentId: string;
  /** `"poste"` = poste de travail sans machine physique ; défaut `"machine"`. */
  kind?: "machine" | "poste";
}

export type MachineCreateResult = { ok: true; machine: MachineSettings } | { ok: false; error: string };

function updateMachine(settings: AppSettings, machineId: string, update: (machine: MachineSettings) => void): boolean {
  const machine = settings.production.machines.find((entry) => entry.id === machineId);
  if (!machine) return false;
  update(machine);
  return true;
}

function parseMachineId(id: string): { prefix: string; number: number; width: number } | null {
  const match = /^([A-Za-z]+)-(\d+)$/.exec(id.trim());
  if (!match) return null;
  return { prefix: match[1].toUpperCase(), number: Number(match[2]), width: match[2].length };
}

function fallbackIdPrefix(label: string): string {
  const letters = label.normalize("NFD").replace(/[^A-Za-z]/g, "").toUpperCase();
  return letters.slice(0, 3) || "MAC";
}

export const machineSettingsService = {
  setActive(settings: AppSettings, machineId: string): boolean {
    return updateMachine(settings, machineId, (machine) => { machine.active = true; });
  },
  setInactive(settings: AppSettings, machineId: string): boolean {
    return updateMachine(settings, machineId, (machine) => { machine.active = false; });
  },
  setVisible(settings: AppSettings, machineId: string): boolean {
    return updateMachine(settings, machineId, (machine) => { machine.visible = true; });
  },
  setHidden(settings: AppSettings, machineId: string): boolean {
    return updateMachine(settings, machineId, (machine) => { machine.visible = false; });
  },
  updateIdentity(settings: AppSettings, machineId: string, patch: MachineIdentityUpdate): boolean {
    return updateMachine(settings, machineId, (machine) => {
      const department = settings.production.departments.find((entry) => entry.id === patch.departmentId);
      machine.name = patch.name.trim() || machine.name;
      machine.displayName = patch.displayName.trim() || machine.displayName;
      machine.departmentId = patch.departmentId;
      machine.department = department?.label ?? machine.department;
      machine.machineType = patch.machineType;
      machine.color = patch.color;
      machine.futureCapacityHours = patch.futureCapacityHours;
      machine.comments = patch.comments;
      machine.favorite = patch.favorite;
      machine.taskCategoryCode = patch.taskCategoryCode;
    });
  },
  softDelete(settings: AppSettings, machineId: string): boolean {
    return updateMachine(settings, machineId, (machine) => { machine.deleted = true; machine.active = false; });
  },
  restore(settings: AppSettings, machineId: string): boolean {
    return updateMachine(settings, machineId, (machine) => { machine.deleted = false; machine.active = true; });
  },
  /**
   * Point d'entrée unique pour créer une machine (Réglages → Production → Machines et Parc
   * Machines s'y branchent tous les deux) : mêmes valeurs par défaut, même refus d'un
   * identifiant déjà utilisé, pour ne pas dupliquer la validation à deux endroits.
   */
  createMachine(settings: AppSettings, input: MachineCreateInput): MachineCreateResult {
    const id = input.id.trim();
    const name = input.name.trim();
    if (!id) return { ok: false, error: "L’identifiant est obligatoire." };
    if (!name) return { ok: false, error: "Le nom technique est obligatoire." };
    const department = settings.production.departments.find((entry) => entry.id === input.departmentId);
    if (!department) return { ok: false, error: "Le département est obligatoire." };
    if (settings.production.machines.some((machine) => machine.id === id)) return { ok: false, error: `L’identifiant « ${id} » est déjà utilisé par une autre machine.` };
    const machine: MachineSettings = {
      id,
      active: true,
      visible: true,
      name,
      displayName: input.displayName.trim() || name,
      department: department.label,
      departmentId: department.id,
      machineType: "",
      color: "",
      order: settings.production.machines.length,
      technicalInformation: "",
      deleted: false,
      favorite: false,
      futureCapacityHours: null,
      comments: "",
      taskCategoryCode: null,
      kind: input.kind === "poste" ? "poste" : "machine",
    };
    settings.production.machines.push(machine);
    return { ok: true, machine };
  },
  /**
   * Propose le prochain identifiant d'une machine pour un département, sur le modèle des
   * identifiants déjà en place (ex. TOU-01…TOU-09 pour Tournage, FRA-01…FRA-17 pour Fraisage) :
   * reprend le préfixe et la largeur de numérotation majoritaires des machines existantes du
   * département, incrémente le plus grand numéro trouvé, et évite toute collision avec un
   * identifiant déjà utilisé ailleurs. Sans machine existante dans le département (ex. un
   * département tout juste créé), dérive un préfixe à partir de son libellé.
   */
  suggestMachineId(settings: AppSettings, departmentId: string): string {
    const department = settings.production.departments.find((entry) => entry.id === departmentId);
    const parsed = settings.production.machines
      .filter((machine) => machine.departmentId === departmentId)
      .map((machine) => parseMachineId(machine.id))
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null);
    const countByPrefix = new Map<string, number>();
    parsed.forEach((entry) => countByPrefix.set(entry.prefix, (countByPrefix.get(entry.prefix) ?? 0) + 1));
    let prefix = "";
    let bestCount = 0;
    countByPrefix.forEach((count, candidate) => { if (count > bestCount) { bestCount = count; prefix = candidate; } });
    if (!prefix) prefix = fallbackIdPrefix(department?.label ?? "Machine");
    const matching = parsed.filter((entry) => entry.prefix === prefix);
    const width = matching.reduce((max, entry) => Math.max(max, entry.width), 2);
    const usedIds = new Set(settings.production.machines.map((machine) => machine.id.toUpperCase()));
    let next = matching.reduce((max, entry) => Math.max(max, entry.number), 0) + 1;
    let candidate = `${prefix}-${String(next).padStart(width, "0")}`;
    while (usedIds.has(candidate.toUpperCase())) {
      next += 1;
      candidate = `${prefix}-${String(next).padStart(width, "0")}`;
    }
    return candidate;
  },
  migrateLegacyErpStates(settings: AppSettings, states: LegacyErpMachineState[]): number {
    let migrated = 0;
    for (const state of states) {
      const changed = updateMachine(settings, state.machineId, (machine) => {
        if (typeof state.active === "boolean") machine.active = state.active;
        if (typeof state.visible === "boolean") machine.visible = state.visible;
      });
      if (changed) migrated += 1;
    }
    return migrated;
  },
  /**
   * Déplace `draggedId` juste avant `targetId` parmi les machines visibles (glisser-déposer du
   * Parc Machines), puis réassigne un `order` séquentiel à toutes les machines. Les machines
   * masquées gardent leur position relative d'origine : seul l'ordre des machines visibles entre
   * elles reflète le glisser-déposer.
   */
  moveMachine(settings: AppSettings, draggedId: string, targetId: string): boolean {
    if (draggedId === targetId) return false;
    const sortedAll = [...settings.production.machines].sort((a, b) => a.order - b.order);
    const visibleIds = sortedAll.filter((machine) => machine.visible).map((machine) => machine.id);
    const fromIndex = visibleIds.indexOf(draggedId);
    const toIndex = visibleIds.indexOf(targetId);
    if (fromIndex < 0 || toIndex < 0) return false;
    const reorderedVisibleIds = [...visibleIds];
    const [moved] = reorderedVisibleIds.splice(fromIndex, 1);
    reorderedVisibleIds.splice(toIndex, 0, moved);
    const byId = new Map(sortedAll.map((machine) => [machine.id, machine]));
    let cursor = 0;
    const reordered = sortedAll.map((machine) => {
      if (!machine.visible) return machine;
      const nextId = reorderedVisibleIds[cursor];
      cursor += 1;
      return byId.get(nextId)!;
    });
    settings.production.machines = reordered.map((machine, order) => ({ ...machine, order }));
    return true;
  },
};
