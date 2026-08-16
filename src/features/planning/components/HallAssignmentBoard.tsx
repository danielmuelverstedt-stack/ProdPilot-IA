"use client";

import { useState, type DragEvent, type ReactNode } from "react";
import type { HallSettings } from "@/features/settings/types/settings";

export interface HallBoardItem { id: string; label: string; hallId: string | null; hallOrder: number; meta?: ReactNode; selected?: boolean; }

export function HallAssignmentBoard({ title, description, itemLabel, halls, items, actions, onSelect, onEdit, onMove }: {
  title: string; description: string; itemLabel: string; halls: HallSettings[]; items: HallBoardItem[]; actions?: ReactNode;
  onSelect?: (id: string) => void; onEdit?: (id: string) => void;
  onMove: (draggedId: string, hallId: string | null, targetId: string | null) => void;
}) {
  const activeHalls = [...halls].filter((hall) => hall.active).sort((a, b) => a.order - b.order);
  const activeHallIds = new Set(activeHalls.map((hall) => hall.id));
  const zones = [...activeHalls.map((hall) => ({ id: hall.id, label: hall.label, color: hall.color, hallId: hall.id as string | null })), { id: "unassigned", label: "Non affectées", color: "#64748b", hallId: null }];
  const initiallyUnassigned = items.some((item) => !item.hallId || !activeHallIds.has(item.hallId));
  const [selectedZoneId, setSelectedZoneId] = useState(initiallyUnassigned ? "unassigned" : zones[0]?.id ?? "unassigned");
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const selectedZone = zones.find((zone) => zone.id === selectedZoneId) ?? zones[0];
  const dragType = `application/x-prodpilot-${itemLabel}`;
  const visibleItems = selectedZone ? items.filter((item) => selectedZone.hallId === null ? !item.hallId || !activeHallIds.has(item.hallId) : item.hallId === selectedZone.hallId).sort((a, b) => a.hallOrder - b.hallOrder) : [];
  const countFor = (hallId: string | null) => items.filter((item) => hallId === null ? !item.hallId || !activeHallIds.has(item.hallId) : item.hallId === hallId).length;
  function drop(event: DragEvent, hallId: string | null, targetId: string | null) { event.preventDefault(); event.stopPropagation(); setDropTarget(null); const draggedId = event.dataTransfer.getData(dragType); if (draggedId && draggedId !== targetId) onMove(draggedId, hallId, targetId); }

  return <section aria-label={title} className="rounded-xl border border-[var(--app-border)] bg-slate-50/70 p-3">
    <div className="flex flex-wrap items-center justify-between gap-2"><div><h2 className="text-sm font-bold text-slate-800">{title}</h2><p className="text-xs text-slate-500">{description}</p></div>{actions ? <div className="flex gap-2">{actions}</div> : null}</div>
    <div role="tablist" aria-label="Halls" className="mt-3 flex flex-wrap gap-1.5">{zones.map((zone) => { const active = selectedZone?.id === zone.id; const target = `hall:${zone.id}`; return <button key={zone.id} type="button" role="tab" aria-selected={active} onClick={() => setSelectedZoneId(zone.id)} onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = "move"; setDropTarget(target); }} onDrop={(event) => { drop(event, zone.hallId, null); setSelectedZoneId(zone.id); }} className={`inline-flex min-h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-semibold transition ${dropTarget === target ? "border-[var(--app-primary)] ring-2 ring-[color-mix(in_srgb,var(--app-primary)_18%,transparent)]" : active ? "border-[var(--app-primary)] bg-white text-[var(--app-primary)] shadow-sm" : "border-[var(--app-border)] bg-white text-slate-600 hover:bg-slate-50"}`}><span className="size-2 rounded-full" style={{ backgroundColor: zone.color }} />{zone.label}<span className="text-[10px] font-normal text-slate-400">{countFor(zone.hallId)}</span></button>; })}</div>
    {selectedZone ? <div role="tabpanel" className="mt-2 max-h-64 min-h-16 overflow-y-auto rounded-lg border border-[var(--app-border)] bg-white p-2" onDragOver={(event) => { event.preventDefault(); setDropTarget(`zone:${selectedZone.id}`); }} onDrop={(event) => drop(event, selectedZone.hallId, null)}><div className="space-y-1">{visibleItems.map((item) => { const target = `item:${item.id}`; return <div key={item.id} draggable onDragStart={(event) => { event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData(dragType, item.id); }} onDragEnd={() => setDropTarget(null)} onDragOver={(event) => { event.preventDefault(); event.stopPropagation(); setDropTarget(target); }} onDrop={(event) => drop(event, selectedZone.hallId, item.id)} className={`flex cursor-grab items-center gap-1 rounded-md border px-2 py-1.5 text-sm active:cursor-grabbing ${dropTarget === target ? "border-[var(--app-primary)]" : item.selected ? "border-[var(--app-primary)] bg-[color-mix(in_srgb,var(--app-primary)_7%,white)]" : "border-slate-200"}`}><span aria-hidden="true" className="text-slate-300">⋮⋮</span>{onSelect ? <button type="button" onClick={() => onSelect(item.id)} className="min-w-0 flex-1 truncate text-left font-semibold text-slate-700">{item.label}</button> : <span className="min-w-0 flex-1 truncate font-semibold text-slate-700">{item.label}</span>}{item.meta}{item.selected && onEdit ? <button type="button" aria-label={`Modifier ${item.label}`} className="rounded px-1 text-[var(--app-primary)]" onClick={() => onEdit(item.id)}>✎</button> : null}</div>; })}</div>{!visibleItems.length ? <p className="py-4 text-center text-xs text-slate-400">Déposez {itemLabel === "machine" ? "une machine" : "une catégorie"} ici</p> : null}</div> : null}
  </section>;
}
