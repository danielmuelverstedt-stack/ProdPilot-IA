"use client";

import { useState } from "react";
import { fieldClass, secondaryButton } from "@/components/ui/ModuleUi";
import { ERP_PLANNING_COLUMN_LABELS, moveErpPlanningColumn } from "@/features/erp-import/services/erp-planning-view-preferences";
import type { ErpPlanningColumnId, ErpPlanningSavedView } from "@/features/erp-import/types/erp-planning-view";

interface ErpPlanningViewToolbarProps {
  activeView: ErpPlanningSavedView;
  views: ErpPlanningSavedView[];
  persistenceError: string | null;
  onSelect: (viewId: string) => void;
  onUpdate: (update: (view: ErpPlanningSavedView) => ErpPlanningSavedView) => void;
  onSaveAs: (name: string) => void;
  onRename: (name: string) => void;
  onDelete: () => void;
  onReset: () => void;
}

export function ErpPlanningViewToolbar({ activeView, views, persistenceError, onSelect, onUpdate, onSaveAs, onRename, onDelete, onReset }: ErpPlanningViewToolbarProps) {
  const [isConfiguring, setIsConfiguring] = useState(false);

  function saveAs() {
    const name = window.prompt("Nom de la nouvelle vue", `${activeView.name} – copie`);
    if (name?.trim()) onSaveAs(name);
  }

  function rename() {
    const name = window.prompt("Nouveau nom de la vue", activeView.name);
    if (name?.trim()) onRename(name);
  }

  return <section className="rounded-2xl border border-[var(--app-border)] bg-white p-4">
    <div className="flex flex-wrap items-center gap-2">
      <label className="flex min-w-56 items-center gap-2 text-sm font-semibold text-slate-700">
        Vue
        <select className={fieldClass} value={activeView.id} onChange={(event) => onSelect(event.target.value)}>
          {views.map((view) => <option key={view.id} value={view.id}>{view.name}</option>)}
        </select>
      </label>
      <button type="button" className={secondaryButton} onClick={saveAs}>Enregistrer sous</button>
      <button type="button" className={secondaryButton} onClick={rename}>Renommer</button>
      <button type="button" className={secondaryButton} disabled={views.length <= 1} onClick={() => { if (window.confirm(`Supprimer la vue « ${activeView.name} » ?`)) onDelete(); }}>Supprimer</button>
      <button type="button" className={secondaryButton} onClick={() => { if (window.confirm("Réinitialiser cette vue avec l’affichage par défaut ?")) onReset(); }}>Réinitialiser</button>
      <button type="button" className={`${secondaryButton} ml-auto`} aria-expanded={isConfiguring} onClick={() => setIsConfiguring((current) => !current)}>{isConfiguring ? "Fermer la personnalisation" : "Personnaliser l’affichage"}</button>
      <span className={`text-xs ${persistenceError ? "text-red-700" : "text-slate-500"}`} role={persistenceError ? "alert" : "status"}>{persistenceError ?? "Enregistrement automatique actif"}</span>
    </div>

    <div className="mt-3 grid gap-2 md:grid-cols-3">
      <label className="text-xs font-semibold text-slate-600">Regrouper par
        <select className={`${fieldClass} mt-1`} value={activeView.groupBy} onChange={(event) => onUpdate((view) => ({ ...view, groupBy: event.target.value as ErpPlanningSavedView["groupBy"] }))}>
          <option value="none">Aucun regroupement</option><option value="article">Article</option><option value="work-order">OF</option><option value="machine">Machine</option><option value="department">Atelier</option><option value="client">Client</option><option value="family">Famille</option><option value="priority">Priorité</option><option value="status">Statut</option><option value="date">Date</option>
        </select>
      </label>
      <label className="text-xs font-semibold text-slate-600">Articles
        <select className={`${fieldClass} mt-1`} value={activeView.filters.articleMultiplicity} onChange={(event) => onUpdate((view) => ({ ...view, filters: { ...view.filters, articleMultiplicity: event.target.value as ErpPlanningSavedView["filters"]["articleMultiplicity"] } }))}>
          <option value="all">Tous les articles</option><option value="multiple">Présents dans plusieurs OF</option><option value="unique">Présents dans un seul OF</option>
        </select>
      </label>
      <label className="text-xs font-semibold text-slate-600">Zoom : {activeView.zoom} %
        <input className="mt-2 w-full accent-[var(--app-primary)]" type="range" min="80" max="120" step="10" value={activeView.zoom} onChange={(event) => onUpdate((view) => ({ ...view, zoom: Number(event.target.value) }))} />
      </label>
    </div>

    {isConfiguring ? <div className="mt-4 border-t border-slate-200 pt-4">
      <p className="mb-3 text-xs text-slate-500">Glissez les colonnes pour les réordonner. Les changements restent propres à cette vue.</p>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {activeView.columns.map((column, index) => <ColumnConfiguration key={column.id} column={column} canMoveUp={index > 0} canMoveDown={index < activeView.columns.length - 1} onMove={(direction) => { const target = activeView.columns[index + direction]; if (target) onUpdate((view) => ({ ...view, columns: moveErpPlanningColumn(view.columns, column.id, target.id) })); }} onDrop={(sourceId) => onUpdate((view) => ({ ...view, columns: moveErpPlanningColumn(view.columns, sourceId, column.id) }))} onChange={(patch) => onUpdate((view) => ({ ...view, columns: view.columns.map((entry) => entry.id === column.id ? { ...entry, ...patch } : entry) }))} />)}
      </div>
    </div> : null}
  </section>;
}

function ColumnConfiguration({ column, canMoveUp, canMoveDown, onMove, onDrop, onChange }: { column: ErpPlanningSavedView["columns"][number]; canMoveUp: boolean; canMoveDown: boolean; onMove: (direction: -1 | 1) => void; onDrop: (sourceId: ErpPlanningColumnId) => void; onChange: (patch: Partial<ErpPlanningSavedView["columns"][number]>) => void }) {
  return <div draggable onDragStart={(event) => event.dataTransfer.setData("application/x-prodpilot-column", column.id)} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { const source = event.dataTransfer.getData("application/x-prodpilot-column") as ErpPlanningColumnId; if (source) onDrop(source); }} className="grid grid-cols-[auto_1fr_auto] items-center gap-2 rounded-xl border border-slate-200 p-3">
    <span className="cursor-grab text-slate-400" aria-hidden="true">↔</span>
    <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={column.visible} onChange={(event) => onChange({ visible: event.target.checked })} />{ERP_PLANNING_COLUMN_LABELS[column.id]}</label>
    <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={column.pinned} onChange={(event) => onChange({ pinned: event.target.checked })} />Figer</label>
    <label className="col-span-3 grid grid-cols-[1fr_80px] items-center gap-2 text-xs text-slate-500">Largeur
      <input className={`${fieldClass} h-8 py-1`} type="number" min="80" max="480" step="10" value={column.width} onChange={(event) => onChange({ width: Math.min(480, Math.max(80, Number(event.target.value) || 80)) })} />
    </label>
    <div className="col-span-3 flex justify-end gap-1"><button type="button" className="rounded border border-slate-200 px-2 py-1 text-xs disabled:opacity-40" disabled={!canMoveUp} aria-label={`Déplacer ${ERP_PLANNING_COLUMN_LABELS[column.id]} vers la gauche`} onClick={() => onMove(-1)}>←</button><button type="button" className="rounded border border-slate-200 px-2 py-1 text-xs disabled:opacity-40" disabled={!canMoveDown} aria-label={`Déplacer ${ERP_PLANNING_COLUMN_LABELS[column.id]} vers la droite`} onClick={() => onMove(1)}>→</button></div>
  </div>;
}
