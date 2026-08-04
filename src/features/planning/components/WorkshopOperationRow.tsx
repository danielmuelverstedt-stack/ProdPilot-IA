"use client";

import { memo, useState } from "react";
import Link from "next/link";
import { StatusPill } from "@/components/ui/ModuleUi";
import { ERP_OPERATION_STATUS_LABELS, erpOperationDelayLabel, erpOperationDelayTone } from "@/features/erp-import/services/erp-operation-status-presentation";
import { articleColor } from "@/features/erp-import/services/erp-planning-grouping";
import { WorkshopMachinePicker } from "@/features/planning/components/WorkshopMachinePicker";
import type { OperationView } from "@/features/erp-import/types/erp-import";
import type { MachineSettings } from "@/features/settings/types/settings";
import type { WorkshopColumnId } from "@/features/planning/types/workshop-view";

export const WORKSHOP_OPERATION_DRAG_MIME_TYPE = "application/x-prodpilot-workshop-operation";

/**
 * `fieldClass`/`secondaryButton` imposent `px-3`/`text-sm`/`min-h-10` : empilés avec des
 * utilitaires plus petits (`px-1`, `h-5`…) pour ce tableau resserré, Tailwind v4 ne garantit pas
 * que le second l'emporte (conflit résolu par l'ordre du CSS généré, pas par l'ordre des classes
 * dans le JSX) — en pratique le padding `px-3` d'origine restait appliqué, écrasant visuellement
 * le contenu des cellules compactes. Classes entièrement autonomes ci-dessous, sans dépendance
 * aux primitives standard, pour éviter tout conflit de propriété CSS.
 */
const compactFieldClass = "h-5 rounded-md border border-[var(--app-border)] bg-white px-1 py-0 text-[10px] leading-none outline-none focus:border-[var(--app-primary)] disabled:cursor-not-allowed disabled:opacity-50";
const compactButtonClass = "inline-flex h-5 items-center justify-center whitespace-nowrap rounded-md border border-[var(--app-border)] bg-white px-1.5 text-[10px] font-semibold hover:bg-slate-100 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 disabled:active:scale-100";

interface WorkshopOperationRowProps {
  operation: OperationView;
  visibleColumnIds: WorkshopColumnId[];
  machineId: string | null;
  machines: MachineSettings[];
  busy: boolean;
  onUpdatePriority: (operationId: string, priority: number) => void;
  onUpdateMachine: (operationId: string, machineId: string) => void;
  onUpdateStatus: (operationId: string, status: OperationView["status"]) => void;
  onReorder: (draggedOperationId: string, targetOperationId: string) => void;
}

export const WorkshopOperationRow = memo(function WorkshopOperationRow({ operation, visibleColumnIds, machineId, machines, busy, onUpdatePriority, onUpdateMachine, onUpdateStatus, onReorder }: WorkshopOperationRowProps) {
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
      className="cursor-grab border-t border-slate-100 align-middle hover:bg-slate-50 active:cursor-grabbing"
    >
      {visibleColumnIds.map((columnId) => <td key={columnId} className="p-1 text-[11px]">{renderCell(columnId, operation, machines, busy, onUpdatePriority, onUpdateMachine, onUpdateStatus)}</td>)}
      <td className="p-1 text-right text-[11px]">
        <div className="flex flex-wrap justify-end gap-0.5">
          <button type="button" className={compactButtonClass} aria-expanded={isExpanded} title={isExpanded ? "Fermer" : "Ouvrir l’opération"} onClick={() => setIsExpanded((current) => !current)}>{isExpanded ? "Fermer" : "Détails"}</button>
          {machineId ? <Link href={`/machines/${machineId}`} className={compactButtonClass} title="Fiche machine">Fiche</Link> : null}
          <Link href={`/of/${operation.workOrderId}`} className={compactButtonClass} title="Ouvrir l’OF">OF</Link>
        </div>
      </td>
    </tr>
    {isExpanded ? <tr className="border-t border-slate-50 bg-slate-50/60"><td colSpan={visibleColumnIds.length + 1} className="p-3"><OperationDetail operation={operation} /></td></tr> : null}
  </>;
});

function renderCell(columnId: WorkshopColumnId, operation: OperationView, machines: MachineSettings[], busy: boolean, onUpdatePriority: (operationId: string, priority: number) => void, onUpdateMachine: (operationId: string, machineId: string) => void, onUpdateStatus: (operationId: string, status: OperationView["status"]) => void) {
  if (columnId === "priority") return <input
    key={operation.effectivePriority}
    type="number"
    min="0"
    max="999"
    className={`${compactFieldClass} w-11`}
    defaultValue={operation.effectivePriority}
    disabled={busy}
    onBlur={(event) => {
      const value = Number(event.target.value);
      if (Number.isFinite(value) && value !== operation.effectivePriority) onUpdatePriority(operation.id, value);
    }}
  />;
  if (columnId === "work-order") return <span className="font-semibold">{operation.workOrderId}</span>;
  if (columnId === "operation") return <span className="block truncate" title={`Op. ${operation.operationNumber} · Tâche ${operation.taskCode || "—"}`}>Op. {operation.operationNumber} · T.{operation.taskCode || "—"}</span>;
  if (columnId === "article") {
    const colors = operation.articleWorkOrderCount > 1 ? articleColor(operation.articleCode) : null;
    return <div className="flex items-center gap-1"><span className="min-w-0 truncate font-semibold">{operation.articleCode || "Article inconnu"}</span>{colors ? <span className="shrink-0 rounded-full border px-1 text-[9px] font-semibold" style={{ backgroundColor: colors.background, borderColor: colors.border, color: colors.text }} title="Cet article est présent dans plusieurs OF en cours">{operation.articleWorkOrderCount}</span> : null}</div>;
  }
  if (columnId === "client") return <span className="block truncate">{operation.workOrder?.customerName || "—"}</span>;
  if (columnId === "quantity") return <span>{operation.workOrder?.quantity != null ? operation.workOrder.quantity.toLocaleString("fr-BE") : "—"}</span>;
  if (columnId === "description") return <span className="line-clamp-1" title={operation.description ?? ""}>{operation.description || "Sans description"}</span>;
  if (columnId === "time") return <span className="text-[9px] italic text-slate-400" title="Le temps de fabrication n’est pas encore disponible dans les données ERP importées">Non disp.</span>;
  if (columnId === "status") return <select className={`${compactFieldClass} w-full`} value={operation.effectiveStatus} disabled={busy} onChange={(event) => onUpdateStatus(operation.id, event.target.value as OperationView["status"])}>
    {(Object.keys(ERP_OPERATION_STATUS_LABELS) as Array<OperationView["status"]>).map((code) => <option key={code} value={code}>{ERP_OPERATION_STATUS_LABELS[code]}</option>)}
  </select>;
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
    ["Quantité", operation.workOrder?.quantity != null ? operation.workOrder.quantity.toLocaleString("fr-BE") : "—"],
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
