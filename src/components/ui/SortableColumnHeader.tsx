"use client";

import type { DragEvent } from "react";
import type { ColumnSortState } from "@/lib/table-columns";

const COLUMN_DRAG_MIME_TYPE = "application/x-prodpilot-table-column";

export interface ColumnDragHandlers {
  draggable: true;
  onDragStart: (event: DragEvent<HTMLTableCellElement>) => void;
  onDragOver: (event: DragEvent<HTMLTableCellElement>) => void;
  onDrop: (event: DragEvent<HTMLTableCellElement>) => void;
}

/** Glisser-déposer natif (HTML5 Drag&Drop) à étaler sur le `<th>` d'un tableau, sur le même modèle que celui déjà en place dans l'Atelier et le Cockpit ERP. */
export function createColumnDragHandlers<ColumnId extends string>(columnId: ColumnId, onMove: (sourceId: ColumnId, targetId: ColumnId) => void): ColumnDragHandlers {
  return {
    draggable: true,
    onDragStart: (event) => event.dataTransfer.setData(COLUMN_DRAG_MIME_TYPE, columnId),
    onDragOver: (event) => event.preventDefault(),
    onDrop: (event) => {
      const source = event.dataTransfer.getData(COLUMN_DRAG_MIME_TYPE) as ColumnId;
      if (source) onMove(source, columnId);
    },
  };
}

/** Étiquette d'en-tête avec poignée visuelle de glisser-déposer, identique à celle de l'Atelier. */
export function ColumnDragLabel({ label }: { label: string }) {
  return <span className="cursor-grab select-none" title="Glisser pour déplacer la colonne">↔ {label}</span>;
}

/** Bouton de tri d'en-tête (⇅/▼/▲), identique visuellement à celui déjà en place dans l'Atelier. */
export function ColumnSortButton<ColumnId extends string>({ id, sort, onSort }: { id: ColumnId; sort: ColumnSortState<ColumnId>; onSort: (id: ColumnId) => void }) {
  const isActive = sort.column === id;
  const icon = !isActive ? "⇅" : sort.direction === "desc" ? "▼" : "▲";
  const title = !isActive ? "Trier par ordre décroissant" : sort.direction === "desc" ? "Trier par ordre croissant" : "Annuler le tri";
  return <button type="button" className="ml-1 text-slate-500 hover:text-slate-800" title={title} onClick={() => onSort(id)}>{icon}</button>;
}
