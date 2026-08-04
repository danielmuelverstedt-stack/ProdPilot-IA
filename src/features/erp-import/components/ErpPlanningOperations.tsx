"use client";

import { memo, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { EmptyState, fieldClass, secondaryButton, StatusPill } from "@/components/ui/ModuleUi";
import { ColumnDragLabel, ColumnSortButton, createColumnDragHandlers } from "@/components/ui/SortableColumnHeader";
import { ErpPlanningViewToolbar } from "@/features/erp-import/components/ErpPlanningViewToolbar";
import { articleColor, groupErpPlanningRows } from "@/features/erp-import/services/erp-planning-grouping";
import { ERP_PLANNING_COLUMN_LABELS, moveErpPlanningColumn } from "@/features/erp-import/services/erp-planning-view-preferences";
import type { ErpOperationStatus, ErpPlanningQueryResult, OperationView } from "@/features/erp-import/types/erp-import";
import type { ErpPlanningColumnId, ErpPlanningSavedView, ErpPlanningSort } from "@/features/erp-import/types/erp-planning-view";
import type { ColumnSortState } from "@/lib/table-columns";
import type { MachineSettings } from "@/features/settings/types/settings";

/** Colonnes pour lesquelles un mode de tri déjà existant (activeView.sort) peut être piloté depuis l'en-tête ; les autres colonnes n'ont pas de bouton de tri. */
const COLUMN_SORT_MODE: Partial<Record<ErpPlanningColumnId, ErpPlanningSort>> = {
  score: "priority",
  "work-order": "work-order",
  client: "client",
  article: "article",
  date: "due-date",
  machine: "machine",
};

interface ErpPlanningOperationsProps {
  rows: ErpPlanningQueryResult | null;
  machines: MachineSettings[];
  activeView: ErpPlanningSavedView;
  views: ErpPlanningSavedView[];
  persistenceError: string | null;
  page: number;
  busy: boolean;
  unmappedOnly: boolean;
  onSelectView: (viewId: string) => void;
  onUpdateView: (update: (view: ErpPlanningSavedView) => ErpPlanningSavedView) => void;
  onSaveViewAs: (name: string) => void;
  onRenameView: (name: string) => void;
  onDeleteView: () => void;
  onResetView: () => void;
  onPage: (page: number) => void;
  onUpdateOperation: (id: string, patch: Record<string, unknown>) => Promise<void>;
  onOpenWorkOrder: (id: string) => void;
}

export function ErpPlanningOperations(props: ErpPlanningOperationsProps) {
  const { rows, machines, activeView, page, busy, unmappedOnly, onUpdateView, onPage, onUpdateOperation, onOpenWorkOrder } = props;
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(() => new Set());
  // Mémorisé (dépendant uniquement de activeView.columns, pas recalculé à chaque rendu) pour que
  // pinnedOffsets et les props passées à OperationRow restent stables : condition nécessaire
  // pour que React.memo sur OperationRow ignore effectivement les lignes non affectées.
  const visibleColumns = useMemo(() => activeView.columns.filter((column) => column.visible), [activeView.columns]);
  const groups = useMemo(() => groupErpPlanningRows(rows?.rows ?? [], activeView.groupBy, machines), [activeView.groupBy, machines, rows?.rows]);
  const activeMachines = useMemo(() => machines.filter((entry) => entry.active && entry.visible && !entry.deleted), [machines]);
  const pinnedOffsets = useMemo(() => {
    let offset = 0;
    const result = new Map<ErpPlanningColumnId, number>();
    visibleColumns.forEach((column) => { if (column.pinned) { result.set(column.id, offset); offset += column.width; } });
    return result;
  }, [visibleColumns]);
  const tableWidth = visibleColumns.reduce((total, column) => total + column.width, 0);

  function moveColumn(sourceId: ErpPlanningColumnId, targetId: ErpPlanningColumnId) {
    onUpdateView((view) => ({ ...view, columns: moveErpPlanningColumn(view.columns, sourceId, targetId) }));
  }

  const sortState: ColumnSortState<ErpPlanningSort> = { column: activeView.sort, direction: activeView.sortDirection };
  function onHeaderSort(mode: ErpPlanningSort) {
    onUpdateView((view) => view.sort === mode ? { ...view, sortDirection: view.sortDirection === "asc" ? "desc" : "asc" } : { ...view, sort: mode, sortDirection: "asc" });
  }

  return <section className="space-y-3">
    <ErpPlanningViewToolbar activeView={activeView} views={props.views} persistenceError={props.persistenceError} onSelect={props.onSelectView} onUpdate={onUpdateView} onSaveAs={props.onSaveViewAs} onRename={props.onRenameView} onDelete={props.onDeleteView} onReset={props.onResetView} />

    {unmappedOnly ? <MachineDropTargets machines={activeMachines} onUpdate={onUpdateOperation} /> : null}
    {!visibleColumns.length ? <EmptyState title="Aucune colonne visible" description="Ouvrez la personnalisation de l’affichage pour réactiver au moins une colonne." /> : rows?.rows.length ? <div className="max-h-[70vh] overflow-auto rounded-2xl border border-[var(--app-border)] bg-white">
      <table className="table-fixed text-left text-sm" style={{ width: tableWidth, minWidth: "100%", fontSize: `${activeView.zoom}%` }}>
        <thead className="sticky top-0 z-30 bg-slate-50 text-xs uppercase text-slate-500"><tr>{visibleColumns.map((column) => { const sortMode = COLUMN_SORT_MODE[column.id]; return <th key={column.id} {...createColumnDragHandlers(column.id, moveColumn)} className={cellClass(column.pinned, true)} style={cellStyle(column.width, column.pinned ? pinnedOffsets.get(column.id) : undefined)}><ColumnDragLabel label={ERP_PLANNING_COLUMN_LABELS[column.id]} />{sortMode ? <ColumnSortButton id={sortMode} sort={sortState} onSort={onHeaderSort} /> : null}</th>; })}</tr></thead>
        <tbody>{groups.map((group) => <PlanningGroup key={group.id} group={group} groupBy={activeView.groupBy} isCollapsed={collapsedGroups.has(group.id)} columns={visibleColumns} pinnedOffsets={pinnedOffsets} machines={activeMachines} busy={busy} onToggle={() => setCollapsedGroups((current) => toggleSetValue(current, group.id))} onUpdate={onUpdateOperation} onOpenWorkOrder={onOpenWorkOrder} />)}</tbody>
      </table>
    </div> : <EmptyState title={busy ? "Chargement…" : "Aucune opération"} description="Aucune opération ne correspond aux filtres actifs." />}

    <div className="flex items-center justify-between text-sm"><span>{rows ? `${rows.total.toLocaleString("fr-BE")} opération(s)` : ""}</span><div className="flex gap-2"><button className={secondaryButton} disabled={page <= 1 || busy} onClick={() => onPage(page - 1)}>Précédent</button><span className="self-center">Page {page}</span><button className={secondaryButton} disabled={!rows || page * rows.pageSize >= rows.total || busy} onClick={() => onPage(page + 1)}>Suivant</button></div></div>
  </section>;
}

function PlanningGroup({ group, groupBy, isCollapsed, columns, pinnedOffsets, machines, busy, onToggle, onUpdate, onOpenWorkOrder }: { group: ReturnType<typeof groupErpPlanningRows>[number]; groupBy: ErpPlanningSavedView["groupBy"]; isCollapsed: boolean; columns: ErpPlanningSavedView["columns"]; pinnedOffsets: Map<ErpPlanningColumnId, number>; machines: MachineSettings[]; busy: boolean; onToggle: () => void; onUpdate: (id: string, patch: Record<string, unknown>) => Promise<void>; onOpenWorkOrder: (id: string) => void }) {
  const articleCount = group.articleCode ? Math.max(...group.rows.map((row) => row.articleWorkOrderCount)) : group.workOrderCount;
  const colors = group.articleCode && articleCount > 1 ? articleColor(group.articleCode) : null;
  return <>
    {groupBy !== "none" ? <tr className="border-t border-slate-200"><td colSpan={columns.length} className="bg-slate-100 px-3 py-2"><button type="button" className="flex w-full items-center gap-2 text-left font-semibold" aria-expanded={!isCollapsed} onClick={onToggle}><span aria-hidden="true">{isCollapsed ? "▶" : "▼"}</span><span>{group.label}</span><span className="rounded-full border px-2 py-0.5 text-xs" style={colors ? { backgroundColor: colors.background, borderColor: colors.border, color: colors.text } : undefined}>{articleCount.toLocaleString("fr-BE")} OF</span><span className="ml-auto text-xs font-normal text-slate-500">{group.rows.length.toLocaleString("fr-BE")} opération(s) affichée(s)</span></button></td></tr> : null}
    {!isCollapsed ? group.rows.map((row) => <OperationRow key={row.id} row={row} columns={columns} pinnedOffsets={pinnedOffsets} machines={machines} busy={busy} onUpdate={onUpdate} onOpenWorkOrder={onOpenWorkOrder} />) : null}
  </>;
}

const OperationRow = memo(function OperationRow({ row, columns, pinnedOffsets, machines, busy, onUpdate, onOpenWorkOrder }: { row: OperationView; columns: ErpPlanningSavedView["columns"]; pinnedOffsets: Map<ErpPlanningColumnId, number>; machines: MachineSettings[]; busy: boolean; onUpdate: (id: string, patch: Record<string, unknown>) => Promise<void>; onOpenWorkOrder: (id: string) => void }) {
  return <tr draggable={!busy} onDragStart={(event) => event.dataTransfer.setData("application/x-prodpilot-operation", row.id)} className="border-t border-slate-100 align-top hover:bg-slate-50">{columns.map((column) => <td key={column.id} className={cellClass(column.pinned, false)} style={cellStyle(column.width, column.pinned ? pinnedOffsets.get(column.id) : undefined)}>{renderCell(column.id, row, machines, busy, onUpdate, onOpenWorkOrder)}</td>)}</tr>;
});

function renderCell(column: ErpPlanningColumnId, row: OperationView, machines: MachineSettings[], busy: boolean, onUpdate: (id: string, patch: Record<string, unknown>) => Promise<void>, onOpenWorkOrder: (id: string) => void): ReactNode {
  if (column === "score") return <><strong className="text-lg tabular-nums">{row.priorityScore}</strong>{row.hasManualOverride ? <span title="Ajustement local" className="ml-1 text-blue-600">●</span> : null}</>;
  if (column === "work-order") return <button className="font-semibold text-[var(--app-primary)] hover:underline" onClick={() => onOpenWorkOrder(row.workOrderId)}>{row.workOrderId}</button>;
  if (column === "operation") return <><span>Op. {row.operationNumber}</span><span className="block text-xs text-slate-500">Tâche {row.taskCode || "—"}</span></>;
  if (column === "client") return <span className="font-semibold">{row.workOrder?.customerName || "Client inconnu"}</span>;
  if (column === "article") {
    const colors = row.articleWorkOrderCount > 1 ? articleColor(row.articleCode) : null;
    return <div><span className="font-semibold">{row.articleCode || "Article inconnu"}</span>{colors ? <span className="ml-2 inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold" style={{ backgroundColor: colors.background, borderColor: colors.border, color: colors.text }}>{row.articleWorkOrderCount} OF</span> : null}</div>;
  }
  if (column === "description") return <span className="line-clamp-3" title={row.description ?? ""}>{row.description || "Sans description"}</span>;
  if (column === "date") return <input type="date" className={`${fieldClass} w-36`} value={row.plannedDate ?? ""} disabled={busy} onChange={(event) => void onUpdate(row.id, { plannedDate: event.target.value || null })} />;
  if (column === "delay") {
    const tone = row.delayDays === null ? "neutral" : row.delayDays > 15 ? "danger" : row.delayDays > 0 ? "warning" : "success";
    return <StatusPill tone={tone}>{row.delayDays === null ? "Sans date" : row.delayDays > 0 ? `${row.delayDays} j retard` : row.delayDays < 0 ? `${Math.abs(row.delayDays)} j avance` : "Aujourd’hui"}</StatusPill>;
  }
  if (column === "machine") return <><select className={`${fieldClass} w-full`} value={row.machineId ?? ""} disabled={busy} onChange={(event) => void onUpdate(row.id, { machineId: event.target.value || null })}><option value="">Machine non définie</option>{machines.map((entry) => <option key={entry.id} value={entry.id}>{entry.displayName}</option>)}</select><span className="mt-1 block text-xs text-slate-500">Code ERP {row.sourceMachineCode || "vide"}</span></>;
  if (column === "priority") return <input type="number" min="0" max="999" className={`${fieldClass} w-full`} defaultValue={row.priority} disabled={busy} onBlur={(event) => { const value = Number(event.target.value); if (value !== row.priority) void onUpdate(row.id, { priority: value }); }} />;
  if (column === "status") return <select className={`${fieldClass} w-full`} value={row.status} disabled={busy} onChange={(event) => void onUpdate(row.id, { status: event.target.value })}>{STATUS_OPTIONS.map((entry) => <option key={entry.value} value={entry.value}>{entry.label}</option>)}</select>;
  if (column === "comment") return <textarea className={`${fieldClass} min-h-16 w-full resize-y py-2`} defaultValue={row.comment ?? ""} maxLength={500} disabled={busy} placeholder="Ajouter un commentaire" onBlur={(event) => { if (event.target.value.trim() !== (row.comment ?? "")) void onUpdate(row.id, { comment: event.target.value }); }} />;
  return row.issues.length ? <span className="text-xs text-amber-800">{row.issues.slice(0, 2).join(" · ")}{row.issues.length > 2 ? ` +${row.issues.length - 2}` : ""}</span> : <StatusPill tone="success">Conforme</StatusPill>;
}

function MachineDropTargets({ machines, onUpdate }: { machines: MachineSettings[]; onUpdate: (id: string, patch: Record<string, unknown>) => Promise<void> }) {
  return <div className="rounded-2xl border border-dashed border-[var(--app-border)] bg-white p-3"><p className="mb-2 text-xs font-semibold text-slate-500">Glissez une opération vers une machine, ou utilisez sa liste déroulante.</p><div className="flex gap-2 overflow-x-auto">{machines.map((entry) => <button key={entry.id} type="button" className={`${secondaryButton} whitespace-nowrap`} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { const id = event.dataTransfer.getData("application/x-prodpilot-operation"); if (id && window.confirm(`Affecter cette opération à ${entry.displayName} ?`)) void onUpdate(id, { machineId: entry.id }); }}>{entry.displayName}</button>)}</div></div>;
}

function cellClass(isPinned: boolean, isHeader: boolean): string {
  return `overflow-hidden p-3 ${isPinned ? `sticky ${isHeader ? "z-40 bg-slate-50" : "z-20 bg-white"} shadow-[2px_0_0_0_rgba(148,163,184,0.25)]` : ""}`;
}

function cellStyle(width: number, left?: number): CSSProperties {
  return { width, minWidth: width, maxWidth: width, ...(left === undefined ? {} : { left }) };
}

function toggleSetValue(current: Set<string>, value: string): Set<string> {
  const next = new Set(current);
  if (next.has(value)) next.delete(value); else next.add(value);
  return next;
}

const STATUS_OPTIONS: Array<{ value: ErpOperationStatus; label: string }> = [
  { value: "not-started", label: "À faire" }, { value: "in-progress", label: "En cours" },
  { value: "completed", label: "Terminée" }, { value: "blocked", label: "Bloquée" }, { value: "waiting", label: "En attente" }, { value: "unknown", label: "À qualifier" },
];
