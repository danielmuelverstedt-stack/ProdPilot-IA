import type { DemoData, Machine, MachineStatus, MachiningType } from "@/features/demo/types/demo";
import type { MachineSettings } from "@/features/settings/types/settings";

export interface MachineTechnicalUpdate {
  manufacturer: string;
  model: string;
  year: number;
  serialNumber: string;
  robot: string | null;
  status: MachineStatus;
  workshopLocation: string;
  commissioningDate: string | null;
  warrantyEndDate: string | null;
  machiningType: MachiningType;
  cncControl: string;
  spindleSpeedRpm: number | null;
  spindlePowerKw: number | null;
  toolSpindleOrCone: string;
  travelXMm: number | null;
  travelYMm: number | null;
  travelZMm: number | null;
  toolMagazineCapacity: number | null;
  barCapacityDiameterMm: number | null;
  throughSpindleCoolant: boolean;
  electricalVoltage: string;
  electricalKva: number | null;
  electricalCableSection: string;
  compressedAirBar: number | null;
  compressedAirFlowNlMin: number | null;
}

/** Champs pouvant être pré-remplis automatiquement (spécifications constructeur) et donc soumis au marquage « à vérifier ». */
const PREFILLABLE_FIELDS: (keyof MachineTechnicalUpdate)[] = [
  "machiningType", "cncControl", "spindleSpeedRpm", "spindlePowerKw", "toolSpindleOrCone",
  "travelXMm", "travelYMm", "travelZMm", "toolMagazineCapacity", "barCapacityDiameterMm", "throughSpindleCoolant",
];

/** Retire des champs non vérifiés ceux dont la valeur a réellement changé par rapport à l'existant (confirmation implicite par modification manuelle). */
function nextUnverifiedFields(existing: Machine | undefined, patch: MachineTechnicalUpdate): string[] {
  const current = existing?.unverifiedFields ?? [];
  return current.filter((field) => {
    const key = field as keyof MachineTechnicalUpdate;
    if (!PREFILLABLE_FIELDS.includes(key)) return true;
    return existing ? existing[key as keyof Machine] === patch[key] : true;
  });
}

export const machineTechnicalService = {
  updateTechnicalDetails(draft: DemoData, machine: MachineSettings, patch: MachineTechnicalUpdate): void {
    const existing = draft.machines.find((entry) => entry.id === machine.id);
    const unverifiedFields = nextUnverifiedFields(existing, patch);
    if (existing) {
      Object.assign(existing, patch, { unverifiedFields });
      return;
    }
    const created: Machine = {
      id: machine.id,
      name: machine.name,
      displayName: machine.displayName,
      department: machine.department,
      type: machine.machineType,
      comments: "",
      ...patch,
      unverifiedFields,
    };
    draft.machines.push(created);
  },
};
