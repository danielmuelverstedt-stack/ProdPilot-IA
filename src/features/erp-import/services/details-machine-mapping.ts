import { normalizeErpHeader } from "../config/macro-range-profile.ts";

export interface DetailsMachineFields {
  erpMachineCode: string | null;
  erpMachineDescription: string | null;
}

/** Projection stricte des colonnes machine du fichier Details vers l'opération ERP. */
export function extractDetailsMachineFields(
  row: readonly unknown[],
  headers: ReadonlyMap<string, number>,
): DetailsMachineFields {
  const codeHeader = normalizeErpHeader("CODE_MACH_INT");
  return {
    // Macro_Gamme_Pe reste le repli des anciens exports sans la colonne optionnelle.
    erpMachineCode: headers.has(codeHeader)
      ? optionalString(cell(row, headers, codeHeader))
      : optionalString(cell(row, headers, normalizeErpHeader("Macro_Gamme_Pe"))),
    erpMachineDescription: optionalString(cell(row, headers, normalizeErpHeader("DESCRIPTION_MACHINE"))),
  };
}

function cell(row: readonly unknown[], headers: ReadonlyMap<string, number>, normalizedName: string): unknown {
  const index = headers.get(normalizedName);
  return index === undefined ? undefined : row[index];
}

function optionalString(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  return String(value).trim() || null;
}
