"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { fieldClass, secondaryButton, StatusPill } from "@/components/ui/ModuleUi";
import { ColumnDragLabel, ColumnSortButton, createColumnDragHandlers } from "@/components/ui/SortableColumnHeader";
import { classifyErpMachineMapping, filterErpMachineCodeEntries, type ErpMachineMappingStatus } from "@/features/erp-import/services/erp-machine-mapping-status";
import type { ErpPlanningOverview } from "@/features/erp-import/types/erp-import";
import type { MachineSettings } from "@/features/settings/types/settings";
import { sortRows } from "@/lib/table-columns";
import { useTableColumns } from "@/lib/use-table-columns";

const STATUS_LABELS: Record<ErpMachineMappingStatus, string> = { mapped: "Mappée", unmapped: "Non mappée", deleted: "Machine supprimée", inactive: "Machine inactive" };

const MAPPING_COLUMN_IDS = ["code", "description", "operationCount", "machine", "machineId", "correspondence", "statut", "visibilite"] as const;
type MappingColumnId = (typeof MAPPING_COLUMN_IDS)[number];

const MAPPING_COLUMN_LABELS: Record<MappingColumnId, string> = {
  code: "Code ERP",
  description: "Description ERP",
  operationCount: "Opérations",
  machine: "Machine ProdPilot",
  machineId: "Identifiant interne",
  correspondence: "Correspondance",
  statut: "Statut",
  visibilite: "Visibilité",
};

type MachineCodeEntry = ErpPlanningOverview["machineCodes"][number];

function mappingSortValue(entry: MachineCodeEntry, column: MappingColumnId, machines: MachineSettings[]): string | number {
  const state = classifyErpMachineMapping(entry.machineId, machines);
  if (column === "code") return entry.code;
  if (column === "description") return entry.description ?? "";
  if (column === "operationCount") return entry.operationCount;
  if (column === "machine") return state.machine?.displayName ?? "";
  if (column === "machineId") return entry.machineId ?? "";
  if (column === "correspondence") return STATUS_LABELS[state.status];
  if (column === "statut") return state.machine ? (state.machine.active ? "Active" : "Inactive") : "";
  return state.machine ? (state.machine.visible ? "Visible" : "Masquée") : "";
}

export function ErpMachineMappingsPanel({ entries, machines, busy, onMap, onDelete }: {
  entries: ErpPlanningOverview["machineCodes"];
  machines: MachineSettings[];
  busy: boolean;
  onMap: (code: string, machineId: string) => Promise<void>;
  onDelete: (code: string) => Promise<void>;
}) {
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [unmappedOnly, setUnmappedOnly] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [showActive, setShowActive] = useState(true);
  const [showInactive, setShowInactive] = useState(true);
  const orderedMachines = useMemo(() => [...machines].sort((a, b) => Number(Boolean(a.deleted)) - Number(Boolean(b.deleted)) || Number(!a.active) - Number(!b.active) || Number(!a.visible) - Number(!b.visible) || a.order - b.order), [machines]);
  const visibleEntries = useMemo(() => filterErpMachineCodeEntries(entries, machines, { search, unmappedOnly, showHidden, showActive, showInactive }), [entries, machines, search, showActive, showHidden, showInactive, unmappedOnly]);
  const { order: columnOrder, sort, moveColumn, cycleSort } = useTableColumns<MappingColumnId>("erp-machine-mappings", MAPPING_COLUMN_IDS);
  const sortedEntries = sortRows(visibleEntries, sort, (entry, column) => mappingSortValue(entry, column, machines));

  return <section className="rounded-2xl border border-[var(--app-border)] bg-white p-5 xl:col-span-2">
    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between"><div><h2 className="text-lg font-semibold">Correspondances machines ERP → ProdPilot</h2><p className="mt-1 text-sm text-slate-600">Ce module relie uniquement un code ERP à une fiche machine. Le statut et la visibilité se modifient depuis la fiche machine.</p></div><div className="flex flex-col gap-2 sm:flex-row sm:items-center"><label className="text-sm font-medium">Rechercher<input className={`${fieldClass} mt-1 w-full sm:w-72`} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Code ERP ou description" /></label><label className="flex items-center gap-2 pt-2 text-sm font-medium sm:pt-6"><input type="checkbox" checked={unmappedOnly} onChange={(event) => setUnmappedOnly(event.target.checked)} />Codes non mappés uniquement</label><label className="flex items-center gap-2 text-sm font-medium sm:pt-6"><input type="checkbox" checked={showActive} onChange={(event) => setShowActive(event.target.checked)} />Afficher les machines actives</label><label className="flex items-center gap-2 text-sm font-medium sm:pt-6"><input type="checkbox" checked={showInactive} onChange={(event) => setShowInactive(event.target.checked)} />Afficher les machines inactives</label><label className="flex items-center gap-2 text-sm font-medium sm:pt-6"><input type="checkbox" checked={showHidden} onChange={(event) => setShowHidden(event.target.checked)} />Afficher les machines masquées</label></div></div>
    <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[1120px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr>{columnOrder.map((column) => <th key={column} {...createColumnDragHandlers(column, moveColumn)} className="p-3"><ColumnDragLabel label={MAPPING_COLUMN_LABELS[column]} /><ColumnSortButton id={column} sort={sort} onSort={cycleSort} /></th>)}<th className="p-3">Actions</th></tr></thead><tbody>
      {sortedEntries.map((entry) => {
        const state = classifyErpMachineMapping(entry.machineId, machines);
        const selection = selections[entry.code] ?? entry.machineId ?? "";
        const target = state.machine;
        const rowClassName = `border-t border-slate-100 align-top ${target && (!target.active || !target.visible) ? "bg-slate-100 text-slate-500" : ""}`;
        return <tr key={entry.code || "empty-code"} className={rowClassName}>
          {columnOrder.map((column) => <td key={column} className={column === "code" ? "p-3 font-semibold" : column === "description" ? "p-3 text-slate-600" : column === "operationCount" ? "p-3 tabular-nums" : column === "machineId" ? "p-3 font-mono text-xs" : "p-3"}>
            {column === "code" ? (entry.code || "Code vide")
              : column === "description" ? (entry.description || "—")
              : column === "operationCount" ? entry.operationCount.toLocaleString("fr-BE")
              : column === "machine" ? <select className={`${fieldClass} w-full`} value={selection} disabled={!entry.code || busy} onChange={(event) => setSelections((current) => ({ ...current, [entry.code]: event.target.value }))}><option value="">Non définie</option>{state.hasMissingTarget && entry.machineId ? <option value={entry.machineId}>Machine introuvable</option> : null}{orderedMachines.map((machine) => <option key={machine.id} value={machine.id} disabled={Boolean(machine.deleted)}>{machine.displayName}{machine.deleted ? " · supprimée" : !machine.active ? " · inactive" : !machine.visible ? " · masquée" : ""}</option>)}</select>
              : column === "machineId" ? (entry.machineId || "—")
              : column === "correspondence" ? <StatusPill tone={state.status === "mapped" ? "success" : state.status === "unmapped" ? "warning" : "danger"}>{STATUS_LABELS[state.status]}</StatusPill>
              : column === "statut" ? (target ? <StatusPill tone={target.active ? "success" : "neutral"}>{target.active ? "🟢 Active" : "⚪ Inactive"}</StatusPill> : "—")
              : (target ? <StatusPill tone={target.visible ? "success" : "neutral"}>{target.visible ? "Visible" : "Masquée"}</StatusPill> : "—")}
          </td>)}
          <td className="p-3"><div className="flex flex-wrap gap-2"><button type="button" className={secondaryButton} disabled={busy || !entry.code || !selection || selection === entry.machineId} onClick={async () => { await onMap(entry.code, selection); setSelections((current) => { const next = { ...current }; delete next[entry.code]; return next; }); }}>{entry.machineId ? "Enregistrer la correspondance" : "Associer"}</button><button type="button" className={secondaryButton} disabled={busy || !entry.code || !entry.machineId} onClick={async () => { await onDelete(entry.code); setSelections((current) => { const next = { ...current }; delete next[entry.code]; return next; }); }}>Supprimer</button>{target ? <Link className={secondaryButton} href={`/machines/${target.id}`}>Modifier</Link> : null}</div></td>
        </tr>;
      })}
      {!sortedEntries.length ? <tr><td colSpan={9} className="p-6 text-center text-slate-500">Aucun code ERP ne correspond aux filtres.</td></tr> : null}
    </tbody></table></div>
  </section>;
}
