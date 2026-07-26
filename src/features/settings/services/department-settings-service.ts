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
