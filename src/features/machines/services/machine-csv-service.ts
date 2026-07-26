import type { Machine, MachineStatus } from "@/features/demo/types/demo";
import type { DepartmentSettings, MachineSettings } from "@/features/settings/types/settings";

const DELIMITER = ";";
const MACHINE_STATUSES: MachineStatus[] = ["Disponible", "En production", "Maintenance prévue", "En panne", "Inactive"];

/**
 * Colonnes du CSV, dans l'ordre. Source unique pour l'en-tête exporté et la validation du
 * nombre de colonnes à l'import — n'importe pas la colonne « Supprimée »/« Ordre » (export
 * seul, informatif), pour ne jamais bouleverser l'ordre déjà en place ni ressusciter une
 * machine supprimée en la recréant.
 */
export const MACHINE_CSV_HEADERS = [
  "Identifiant", "Nom technique", "Nom affiché", "Département", "Type",
  "Actif", "Visible", "Favori", "Supprimée", "Ordre",
  "Capacité future (h/j)", "Commentaires",
  "Fabricant", "Modèle", "Année", "N° de série", "Robot", "Statut opérationnel",
] as const;

export interface MachineCsvRow {
  id: string;
  name: string;
  displayName: string;
  departmentLabel: string;
  machineType: string;
  active: boolean | undefined;
  visible: boolean | undefined;
  favorite: boolean | undefined;
  futureCapacityHours: number | null;
  comments: string;
  manufacturer: string;
  model: string;
  year: number | null;
  serialNumber: string;
  robot: string | null;
  status: MachineStatus | "";
}

/**
 * Exporte l'identité (`MachineSettings`, Réglages) et la fiche technique (`Machine` de
 * démonstration : fabricant, modèle, année, n° de série, robot, statut) en une seule ligne par
 * machine, jointes par identifiant. Délimiteur `;` et BOM UTF-8 pour qu'Excel en locale
 * française ouvre le fichier et affiche les accents correctement.
 */
export function serializeMachinesToCsv(machines: MachineSettings[], departments: DepartmentSettings[], demoMachines: Machine[]): string {
  const departmentLabelById = new Map(departments.map((department) => [department.id, department.label]));
  const demoById = new Map(demoMachines.map((machine) => [machine.id, machine]));
  const lines = [formatRow([...MACHINE_CSV_HEADERS])];
  [...machines].sort((a, b) => a.order - b.order).forEach((machine) => {
    const demo = demoById.get(machine.id);
    lines.push(formatRow([
      machine.id,
      machine.name,
      machine.displayName,
      departmentLabelById.get(machine.departmentId) ?? machine.department,
      machine.machineType,
      boolToCsv(machine.active),
      boolToCsv(machine.visible),
      boolToCsv(machine.favorite ?? false),
      boolToCsv(machine.deleted ?? false),
      String(machine.order + 1),
      machine.futureCapacityHours == null ? "" : String(machine.futureCapacityHours),
      machine.comments ?? "",
      demo?.manufacturer ?? "",
      demo?.model ?? "",
      demo?.year ? String(demo.year) : "",
      demo?.serialNumber ?? "",
      demo?.robot ?? "",
      demo?.status ?? "",
    ]));
  });
  const byteOrderMark = "﻿"; // U+FEFF : signale l'UTF-8 à Excel pour que les accents s'affichent correctement.
  return `${byteOrderMark}${lines.join("\r\n")}\r\n`;
}

/** Parse le texte d'un CSV exporté (ou compatible) en lignes structurées, sans toucher aux Réglages : la validation métier (département connu, identifiant déjà utilisé…) reste du ressort de l'appelant. */
export function parseMachinesCsv(text: string): { rows: MachineCsvRow[]; parseErrors: string[] } {
  const table = parseCsvTable(text);
  const rows: MachineCsvRow[] = [];
  const parseErrors: string[] = [];
  table.slice(1).forEach((cells, index) => {
    const lineNumber = index + 2;
    if (cells.length === 1 && cells[0].trim() === "") return;
    if (cells.length !== MACHINE_CSV_HEADERS.length) {
      parseErrors.push(`Ligne ${lineNumber} : ${cells.length} colonne(s) au lieu de ${MACHINE_CSV_HEADERS.length} attendues.`);
      return;
    }
    const id = cells[0].trim();
    if (!id) { parseErrors.push(`Ligne ${lineNumber} : identifiant manquant.`); return; }
    const status = cells[17].trim();
    rows.push({
      id,
      name: cells[1].trim(),
      displayName: cells[2].trim(),
      departmentLabel: cells[3].trim(),
      machineType: cells[4].trim(),
      active: csvToBool(cells[5]),
      visible: csvToBool(cells[6]),
      favorite: csvToBool(cells[7]),
      // cells[8] = Supprimée, cells[9] = Ordre : export seul, volontairement ignorées ici.
      futureCapacityHours: parseOptionalNumber(cells[10]),
      comments: cells[11].trim(),
      manufacturer: cells[12].trim(),
      model: cells[13].trim(),
      year: parseOptionalNumber(cells[14]),
      serialNumber: cells[15].trim(),
      robot: cells[16].trim() || null,
      status: isMachineStatus(status) ? status : "",
    });
  });
  return { rows, parseErrors };
}

function boolToCsv(value: boolean): string {
  return value ? "Oui" : "Non";
}

function csvToBool(value: string): boolean | undefined {
  const normalized = value.trim().toLocaleLowerCase("fr");
  if (normalized === "oui") return true;
  if (normalized === "non") return false;
  return undefined;
}

function parseOptionalNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function isMachineStatus(value: string): value is MachineStatus {
  return (MACHINE_STATUSES as string[]).includes(value);
}

function escapeCsvField(value: string): string {
  return /[;"\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

function formatRow(fields: string[]): string {
  return fields.map(escapeCsvField).join(DELIMITER);
}

/** Analyseur CSV générique (délimiteur `;`, guillemets et retours à la ligne conformes RFC 4180) : gère les champs contenant le délimiteur, des guillemets ou des sauts de ligne. */
function parseCsvTable(text: string): string[][] {
  const normalized = text.replace(/﻿/, "").replace(/\r\n/g, "\n"); // retire un éventuel BOM U+FEFF en tête de fichier
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;
  let index = 0;
  while (index < normalized.length) {
    const char = normalized[index];
    if (inQuotes) {
      if (char === "\"") {
        if (normalized[index + 1] === "\"") { field += "\""; index += 2; continue; }
        inQuotes = false; index += 1; continue;
      }
      field += char; index += 1; continue;
    }
    if (char === "\"") { inQuotes = true; index += 1; continue; }
    if (char === DELIMITER) { row.push(field); field = ""; index += 1; continue; }
    if (char === "\n") { row.push(field); rows.push(row); field = ""; row = []; index += 1; continue; }
    field += char; index += 1;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter((entry) => !(entry.length === 1 && entry[0] === ""));
}
