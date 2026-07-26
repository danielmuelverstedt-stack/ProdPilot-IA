"use client";

import { useState } from "react";
import { fieldClass, secondaryButton } from "@/components/ui/ModuleUi";
import { WORKSHOP_COLUMN_LABELS } from "@/features/planning/services/workshop-view-preferences";
import type { WorkshopColumnId, WorkshopColumnPreference, WorkshopRowsPerMachine } from "@/features/planning/types/workshop-view";

const ROWS_PER_MACHINE_CHOICES: Array<{ value: WorkshopRowsPerMachine; label: string }> = [
  { value: 10, label: "10 lignes" },
  { value: 25, label: "25 lignes" },
  { value: 50, label: "50 lignes" },
  { value: "all", label: "Toutes" },
];

interface WorkshopColumnSelectorProps {
  columns: WorkshopColumnPreference[];
  rowsPerMachine: WorkshopRowsPerMachine;
  persistenceError: string | null;
  onToggleColumn: (columnId: WorkshopColumnId) => void;
  onChangeRowsPerMachine: (value: WorkshopRowsPerMachine) => void;
}

export function WorkshopColumnSelector({ columns, rowsPerMachine, persistenceError, onToggleColumn, onChangeRowsPerMachine }: WorkshopColumnSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  return <div className="rounded-2xl border border-[var(--app-border)] bg-white p-3">
    <div className="flex flex-wrap items-center gap-3">
      <button type="button" className={secondaryButton} aria-expanded={isOpen} onClick={() => setIsOpen((current) => !current)}>{isOpen ? "Fermer les colonnes" : "Colonnes"}</button>
      <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">Lignes par machine
        <select className={`${fieldClass} h-9 py-0`} value={String(rowsPerMachine)} onChange={(event) => onChangeRowsPerMachine((event.target.value === "all" ? "all" : Number(event.target.value)) as WorkshopRowsPerMachine)}>
          {ROWS_PER_MACHINE_CHOICES.map((choice) => <option key={choice.value} value={choice.value}>{choice.label}</option>)}
        </select>
      </label>
      <span className={`ml-auto text-xs ${persistenceError ? "text-red-700" : "text-slate-500"}`} role={persistenceError ? "alert" : "status"}>{persistenceError ?? "Enregistrement automatique actif"}</span>
    </div>
    {isOpen ? <div className="mt-3 flex flex-wrap gap-3 border-t border-slate-100 pt-3">{columns.map((column) => <label key={column.id} className="flex items-center gap-2 text-xs"><input type="checkbox" checked={column.visible} onChange={() => onToggleColumn(column.id)} /><span>{WORKSHOP_COLUMN_LABELS[column.id]}</span></label>)}<p className="w-full text-xs text-slate-400">Glissez l’en-tête d’une colonne dans un tableau pour la réordonner.</p></div> : null}
  </div>;
}
