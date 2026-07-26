import type { ErpMachineMapping } from "../types/erp-import.ts";

const INVISIBLE_CHARACTERS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u200B-\u200D\u2060\uFEFF]/g;

export interface LegacyErpMachineMappingState {
  machineId: string;
  active?: boolean;
  visible?: boolean;
}

type LegacyErpMachineMapping = ErpMachineMapping & {
  active?: boolean;
  status?: "active" | "inactive";
  visible?: boolean;
  hidden?: boolean;
  hiddenAt?: string | null;
  lastSourceDescription?: string | null;
};

export function normalizeErpMachineCode(value: string | null | undefined): string | null {
  const normalized = value?.replace(INVISIBLE_CHARACTERS, "").trim().replace(/\s+/g, " ").toLocaleUpperCase("fr");
  return normalized && normalized !== "0" ? normalized : null;
}

export function normalizeErpMachineMappings(values: Record<string, ErpMachineMapping>): Record<string, ErpMachineMapping> {
  const normalized: Record<string, ErpMachineMapping> = {};
  for (const [storedKey, value] of Object.entries(values)) {
    const mapping = value as LegacyErpMachineMapping;
    const erpMachineCode = normalizeErpMachineCode(mapping.erpMachineCode) ?? normalizeErpMachineCode(storedKey);
    if (!erpMachineCode) continue;
    const candidate = {
      ...mapping,
      erpMachineCode,
      machineId: mapping.machineId?.trim() || null,
    };
    const existing = normalized[erpMachineCode];
    if (!existing || candidate.updatedAt.localeCompare(existing.updatedAt) >= 0) normalized[erpMachineCode] = candidate;
  }
  return normalized;
}

export function extractLegacyErpMachineStates(values: Record<string, ErpMachineMapping>): LegacyErpMachineMappingState[] {
  const byMachine = new Map<string, LegacyErpMachineMappingState>();
  Object.values(values).forEach((value) => {
    const mapping = value as LegacyErpMachineMapping;
    if (!mapping.machineId) return;
    const hasActive = typeof mapping.active === "boolean" || mapping.status === "active" || mapping.status === "inactive";
    const hasVisible = typeof mapping.visible === "boolean" || typeof mapping.hidden === "boolean";
    if (!hasActive && !hasVisible) return;
    byMachine.set(mapping.machineId, {
      machineId: mapping.machineId,
      ...(hasActive ? { active: typeof mapping.active === "boolean" ? mapping.active : mapping.status !== "inactive" } : {}),
      ...(hasVisible ? { visible: typeof mapping.visible === "boolean" ? mapping.visible : mapping.hidden !== true } : {}),
    });
  });
  return [...byMachine.values()];
}

export function stripLegacyErpMachineState(mapping: ErpMachineMapping): ErpMachineMapping {
  return { erpMachineCode: mapping.erpMachineCode, machineId: mapping.machineId, updatedAt: mapping.updatedAt };
}
