import type { MachineSettings } from "@/features/settings/types/settings";
import type { ErpPlanningRow } from "@/features/erp-import/types/erp-import";
import type { ErpPlanningGroupBy } from "@/features/erp-import/types/erp-planning-view";

export interface ErpPlanningRowGroup {
  id: string;
  label: string;
  rows: ErpPlanningRow[];
  workOrderCount: number;
  articleCode: string | null;
}

export function groupErpPlanningRows(rows: ErpPlanningRow[], groupBy: ErpPlanningGroupBy, machines: MachineSettings[]): ErpPlanningRowGroup[] {
  if (groupBy === "none") return [{ id: "all", label: "Toutes les opérations", rows, workOrderCount: distinctWorkOrders(rows), articleCode: null }];
  const machineById = new Map(machines.map((machine) => [machine.id, machine]));
  const groups = new Map<string, ErpPlanningRowGroup>();
  rows.forEach((row) => {
    const descriptor = groupDescriptor(row, groupBy, machineById);
    const existing = groups.get(descriptor.id);
    if (existing) existing.rows.push(row);
    else groups.set(descriptor.id, { ...descriptor, rows: [row], workOrderCount: 0 });
  });
  return [...groups.values()].map((group) => ({ ...group, workOrderCount: distinctWorkOrders(group.rows) }));
}

export function articleColor(articleCode: string): { background: string; text: string; border: string } {
  const palettes = [
    { background: "#dbeafe", text: "#1e3a8a", border: "#93c5fd" },
    { background: "#dcfce7", text: "#14532d", border: "#86efac" },
    { background: "#fef3c7", text: "#78350f", border: "#fcd34d" },
    { background: "#f3e8ff", text: "#581c87", border: "#d8b4fe" },
    { background: "#ffe4e6", text: "#881337", border: "#fda4af" },
    { background: "#cffafe", text: "#164e63", border: "#67e8f9" },
  ];
  let hash = 0;
  for (const character of articleCode) hash = ((hash << 5) - hash + character.charCodeAt(0)) | 0;
  return palettes[Math.abs(hash) % palettes.length];
}

function groupDescriptor(row: ErpPlanningRow, groupBy: Exclude<ErpPlanningGroupBy, "none">, machineById: Map<string, MachineSettings>): Omit<ErpPlanningRowGroup, "rows" | "workOrderCount"> {
  if (groupBy === "article") return { id: `article:${articleKey(row)}`, label: `Article ${row.articleCode || "non renseigné"}`, articleCode: row.articleCode || null };
  if (groupBy === "work-order") return { id: `of:${row.workOrderId}`, label: `OF ${row.workOrderId}`, articleCode: row.articleCode || null };
  if (groupBy === "machine") {
    const machine = row.machineId ? machineById.get(row.machineId) : null;
    return { id: `machine:${row.machineId ?? "unmapped"}`, label: machine?.displayName ?? "Machine non définie", articleCode: null };
  }
  if (groupBy === "department") {
    const machine = row.machineId ? machineById.get(row.machineId) : null;
    const department = machine?.department || "Atelier non défini";
    return { id: `department:${department}`, label: department, articleCode: null };
  }
  if (groupBy === "client") {
    const client = row.workOrder?.customerName || "Client inconnu";
    return { id: `client:${client}`, label: client, articleCode: null };
  }
  if (groupBy === "family") {
    const family = row.workOrder?.articleGroupId || "Famille non définie";
    return { id: `family:${family}`, label: `Famille ${family}`, articleCode: null };
  }
  if (groupBy === "priority") return { id: `priority:${row.effectivePriority}`, label: `Priorité ${row.effectivePriority}`, articleCode: null };
  if (groupBy === "status") return { id: `status:${row.effectiveStatus}`, label: statusLabel(row.effectiveStatus), articleCode: null };
  const date = row.plannedDate || "Sans date";
  return { id: `date:${date}`, label: row.plannedDate ? formatDate(row.plannedDate) : date, articleCode: null };
}

function articleKey(row: ErpPlanningRow): string {
  return row.workOrder?.articleId || row.articleCode.trim().toLocaleUpperCase("fr");
}

function distinctWorkOrders(rows: ErpPlanningRow[]): number {
  return new Set(rows.map((row) => row.workOrderId)).size;
}

function statusLabel(status: ErpPlanningRow["effectiveStatus"]): string {
  return { "not-started": "À faire", "in-progress": "En cours", completed: "Terminée", blocked: "Bloquée", unknown: "À qualifier" }[status];
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("fr-BE", { timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
}
