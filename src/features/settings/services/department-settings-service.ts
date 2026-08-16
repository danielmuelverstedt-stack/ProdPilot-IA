import { createSettingsId } from "./settings-identifiers.ts";
import type { AppSettings, DepartmentSettings } from "../types/settings.ts";

export interface DepartmentLinksInput {
  name: string;
  linkedCategoryCodes: string[];
  linkedMachineIds: string[];
}

export type DepartmentCreateResult = { ok: true; department: DepartmentSettings } | { ok: false; error: string };
export type DepartmentDeleteResult = { ok: true } | { ok: false; error: string };

/**
 * Service dédié aux départements créés/édités depuis l'Atelier (onglets « catégories/machines
 * liées »), séparé de l'éditeur générique de Réglages → Production → Départements
 * (`ProductionStandardsSettings.tsx`) qui reste inchangé. Contrairement à celui-ci, la
 * suppression est gardée : un département encore rattaché physiquement à des machines
 * (`MachineSettings.departmentId`) ne peut pas être supprimé sans confusion pour l'utilisateur.
 */
export const departmentSettingsService = {
  moveDepartmentToHall(settings: AppSettings, draggedId: string, hallId: string | null, targetId: string | null): boolean {
    if (draggedId === targetId) return false;
    const dragged = settings.production.departments.find((department) => department.id === draggedId);
    if (!dragged || (hallId !== null && !settings.production.halls.some((hall) => hall.id === hallId))) return false;
    const target = targetId ? settings.production.departments.find((department) => department.id === targetId) : null;
    if (targetId && (!target || (target.hallId ?? null) !== hallId)) return false;

    const sourceHallId = dragged.hallId ?? null;
    const source = settings.production.departments
      .filter((department) => (department.hallId ?? null) === sourceHallId && department.id !== draggedId)
      .sort((a, b) => (a.hallOrder ?? a.order) - (b.hallOrder ?? b.order));
    source.forEach((department, index) => { department.hallOrder = index; });

    const destination = settings.production.departments
      .filter((department) => (department.hallId ?? null) === hallId && department.id !== draggedId)
      .sort((a, b) => (a.hallOrder ?? a.order) - (b.hallOrder ?? b.order));
    const targetIndex = targetId ? destination.findIndex((department) => department.id === targetId) : destination.length;
    destination.splice(targetIndex < 0 ? destination.length : targetIndex, 0, dragged);
    destination.forEach((department, index) => { department.hallId = hallId; department.hallOrder = index; });

    const hallOrder = new Map([...settings.production.halls].sort((a, b) => a.order - b.order).map((hall, index) => [hall.id, index]));
    settings.production.departments.sort((a, b) => {
      const aHall = hallOrder.get(a.hallId ?? "") ?? Number.MAX_SAFE_INTEGER;
      const bHall = hallOrder.get(b.hallId ?? "") ?? Number.MAX_SAFE_INTEGER;
      return aHall - bHall || (a.hallOrder ?? a.order) - (b.hallOrder ?? b.order);
    }).forEach((department, index) => { department.order = index; });
    settings.production.machines
      .filter((machine) => machine.departmentId === dragged.id)
      .forEach((machine, index) => { machine.hallId = hallId; machine.hallOrder = index; });
    return true;
  },

  moveDepartment(settings: AppSettings, draggedId: string, targetId: string): boolean {
    if (draggedId === targetId) return false;
    const ordered = [...settings.production.departments].sort((a, b) => a.order - b.order);
    const fromIndex = ordered.findIndex((department) => department.id === draggedId);
    const targetIndex = ordered.findIndex((department) => department.id === targetId);
    if (fromIndex < 0 || targetIndex < 0) return false;
    const [dragged] = ordered.splice(fromIndex, 1);
    ordered.splice(targetIndex, 0, dragged);
    ordered.forEach((department, index) => { department.order = index; });
    settings.production.departments = ordered;
    return true;
  },

  createDepartment(settings: AppSettings, input: DepartmentLinksInput): DepartmentCreateResult {
    const name = input.name.trim();
    if (!name) return { ok: false, error: "Le nom du département est obligatoire." };
    const existingIds = settings.production.departments.map((department) => department.id);
    const department: DepartmentSettings = {
      id: createSettingsId("standard", name, existingIds),
      value: name,
      label: name,
      color: settings.theme.information,
      textColor: settings.theme.card,
      active: true,
      order: settings.production.departments.length,
      hallId: null,
      hallOrder: settings.production.departments.filter((entry) => !entry.hallId).length,
      linkedCategoryCodes: input.linkedCategoryCodes,
      linkedMachineIds: input.linkedMachineIds,
    };
    settings.production.departments.push(department);
    return { ok: true, department };
  },

  updateDepartmentLinks(settings: AppSettings, departmentId: string, input: DepartmentLinksInput): boolean {
    const department = settings.production.departments.find((entry) => entry.id === departmentId);
    if (!department) return false;
    const name = input.name.trim();
    department.label = name || department.label;
    department.value = name || department.value;
    department.linkedCategoryCodes = input.linkedCategoryCodes;
    department.linkedMachineIds = input.linkedMachineIds;
    return true;
  },

  deleteDepartment(settings: AppSettings, departmentId: string): DepartmentDeleteResult {
    const physicallyAttached = settings.production.machines.filter((machine) => machine.departmentId === departmentId);
    if (physicallyAttached.length) {
      return { ok: false, error: `${physicallyAttached.length} machine(s) sont encore physiquement rattachées à ce département. Réaffectez-les d’abord depuis le Parc Machines.` };
    }
    settings.production.departments = settings.production.departments.filter((department) => department.id !== departmentId);
    return { ok: true };
  },
};
