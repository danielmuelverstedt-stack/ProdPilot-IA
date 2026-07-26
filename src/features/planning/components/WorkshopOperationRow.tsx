"use client";

import { memo, useState } from "react";
import Link from "next/link";
import { fieldClass, secondaryButton, StatusPill } from "@/components/ui/ModuleUi";
import { ERP_OPERATION_STATUS_LABELS, erpOperationDelayLabel, erpOperationDelayTone, erpOperationStatusTone } from "@/features/erp-import/services/erp-operation-status-presentation";
import { articleColor } from "@/features/erp-import/services/erp-planning-grouping";
import { WorkshopMachinePicker } from "@/features/planning/components/WorkshopMachinePicker";
import type { OperationView } from "@/features/erp-import/types/erp-import";
import type { MachineSettings } from "@/features/settings/types/settings";
import type { WorkshopColumnId } from "@/features/planning/types/workshop-view";

export const WORKSHOP_OPERATION_DRAG_MIME_TYPE = "application/x-prodpilot-workshop-operation";

interface WorkshopOperationRowProps {
  operation: OperationView;
  visibleColumnIds: WorkshopColumnId[];
  machineId: string | null;
  machines: MachineSettings[];
  busy: boolean;
  onUpdatePriority: (operationId: string, priority: number) => void;
  onUpdateMachine: (operationId: string, machineId: string) => void;
  onReorder: (draggedOperationId: string, targetOperationId: string) => void;
}

export const WorkshopOperationRow = memo(function WorkshopOperationRow({ operation, visibleColumnIds, machineId, machines, busy, onUpdatePriority, onUpdateMachine, onReorder }: WorkshopOperationRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  return <>
    <tr
      draggable={!busy}
      onDragStart={(event) => event.dataTransfer.setData(WORKSHOP_OPERATION_DRAG_MIME_TYPE, operation.id)}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        const draggedId = event.dataTransfer.getData(WORKSHOP_OPERATION_DRAG_MIME_TYPE);
        if (draggedId && draggedId !== operation.id) onReorder(draggedId, operation.id);
      }}
      className="cursor-grab border-t border-slate-100 align-top hover:bg-slate-50 active:cursor-grabbing"
    >
      {visibleColumnIds.map((columnId) => <td key={columnId} className="p-3 text-sm">{renderCell(columnId, operation, machines, busy, onUpdatePriority, onUpdateMachine)}</td>)}
      <td className="p-3 text-right text-sm">
        <div className="flex justify-end gap-2">
          <button type="button" className={secondaryButton} aria-expanded={isExpanded} onClick={() => setIsExpanded((current) => !current)}>{isExpanded ? "Fermer" : "Ouvrir l’opération"}</button>
          {machineId ? <Link href={`/machines/${machineId}`} className={secondaryButton}>Fiche machine</Link> : null}
          <Link href={`/of/${operation.workOrderId}`} className={secondaryButton}>Ouvrir l’OF</Link>
        </div>
      </td>
    </tr>
    {isExpanded ? <tr className="border-t border-slate-50 bg-slate-50/60"><td colSpan={visibleColumnIds.length + 1} className="p-4"><OperationDetail operation={operation} /></td></tr> : null}
  </>;
});

function renderCell(columnId: WorkshopColumnId, operation: OperationView, machines: MachineSettings[], busy: boolean, onUpdatePriority: (operationId: string, priority: number) => void, onUpdateMachine: (operationId: string, machineId: string) => void) {
  if (columnId === "priority") return <input
    key={operation.effectivePriority}
    type="number"
    min="0"
    max="999"
    className={`${fieldClass} w-20`}
    defaultValue={operation.effectivePriority}
    disabled={busy}
    onBlur={(event) => {
      const value = Number(event.target.value);
      if (Number.isFinite(value) && value !== operation.effectivePriority) onUpdatePriority(operation.id, value);
    }}
  />;
  if (columnId === "work-order") return <span className="font-semibold">{operation.workOrderId}</span>;
  if (columnId === "operation") return <><span>Op. {operation.operationNumber}</span><span className="block text-xs text-slate-500">Tâche {operation.taskCode || "—"}</span></>;
  if (columnId === "article") {
    const colors = operation.articleWorkOrderCount > 1 ? articleColor(operation.articleCode) : null;
    return <div><span className="font-semibold">{operation.articleCode || "Article inconnu"}</span>{colors ? <span className="ml-2 inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold" style={{ backgroundColor: colors.background, borderColor: colors.border, color: colors.text }} title="Cet article est présent dans plusieurs OF en cours">{operation.articleWorkOrderCount} OF</span> : null}</div>;
  }
  if (columnId === "description") return <span className="line-clamp-2" title={operation.description ?? ""}>{operation.description || "Sans description"}</span>;
  if (columnId === "time") return <span className="text-xs italic text-slate-400" title="Le temps de fabrication n’est pas encore disponible dans les données ERP importées">Non disponible</span>;
  if (columnId === "status") return <StatusPill tone={erpOperationStatusTone(operation.effectiveStatus)}>{ERP_OPERATION_STATUS_LABELS[operation.effectiveStatus]}</StatusPill>;
  if (columnId === "start-date") return <span>{formatDate(operation.plannedDate)}</span>;
  if (columnId === "end-date") return <span>{formatDate(operation.dueDate)}</span>;
  if (columnId === "delay") return <StatusPill tone={erpOperationDelayTone(operation.delayDays)}>{erpOperationDelayLabel(operation.delayDays)}</StatusPill>;
  return <WorkshopMachinePicker machines={machines} currentMachineId={operation.machineId} busy={busy} onSelect={(nextMachineId) => onUpdateMachine(operation.id, nextMachineId)} />;
}

function OperationDetail({ operation }: { operation: OperationView }) {
  const entries: Array<[string, string]> = [
    ["OF", operation.workOrderId],
    ["Opération", `${operation.operationNumber}`],
    ["Tâche", operation.taskCode || "—"],
    ["Article", operation.articleCode || "—"],
    ["OF partageant cet article", `${operation.articleWorkOrderCount}`],
    ["Désignation", operation.description || "—"],
    ["Client", operation.workOrder?.customerName || "—"],
    ["Machine", operation.machine],
    ["Statut", ERP_OPERATION_STATUS_LABELS[operation.effectiveStatus]],
    ["Priorité", `${operation.effectivePriority}`],
    ["Date début", formatDate(operation.plannedDate)],
    ["Date fin", formatDate(operation.dueDate)],
    ["Retard", erpOperationDelayLabel(operation.delayDays)],
    ["Commentaire", operation.comment || "—"],
  ];
  return <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">{entries.map(([label, value]) => <div key={label}><dt className="text-xs font-semibold uppercase text-slate-500">{label}</dt><dd className="mt-1 font-medium">{value}</dd></div>)}</dl>;
}

function formatDate(value: string | null): string {
  return value ? new Intl.DateTimeFormat("fr-BE", { timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`)) : "—";
}
