"use client";

import Link from "next/link";
import { useState } from "react";
import { fieldClass, formatEuropeanDate, secondaryButton, StatusPill } from "@/components/ui/ModuleUi";
import { completeAction, deleteAction, planAction, postponeAction } from "@/features/actions/services/action-service";
import { actionStatusTone, isActionOverdue } from "@/features/actions/services/action-status";
import type { ProductionAction } from "@/features/demo/types/demo";
import type { ActionColumnSettings, ActionOriginSettings } from "@/features/settings/types/settings";

/** Valeur comparable par colonne, utilisée par le tri au clic du tableau Actions (ActionGroupedList.tsx) — même mapping columnId → donnée que renderCell ci-dessous. */
export function getActionSortValue(action: ProductionAction, columnId: string, origins: ActionOriginSettings[]): string | number {
  if (columnId === "dateEncodage") return action.dateEncodage;
  if (columnId === "introduitPar") return action.introduitPar;
  if (columnId === "origine") { const origin = origins.find((item) => item.value === action.origine); return origin?.label ?? action.origine; }
  if (columnId === "description") return action.description;
  if (columnId === "responsable") return action.responsable;
  if (columnId === "echeance") return action.echeance;
  if (columnId === "statut") return action.statut;
  if (columnId === "remarque") return action.remarque ?? "";
  if (columnId === "lienContexte") return action.contextLink?.label ?? "";
  return "";
}

function renderCell(columnId: string, action: ProductionAction, origins: ActionOriginSettings[]) {
  if (columnId === "dateEncodage") return formatEuropeanDate(action.dateEncodage);
  if (columnId === "introduitPar") return action.introduitPar;
  if (columnId === "origine") { const origin = origins.find((item) => item.value === action.origine); return <StatusPill tone="neutral">{origin?.label ?? action.origine}</StatusPill>; }
  if (columnId === "description") return <Link href={`/actions/${action.id}`} className="font-medium text-[var(--app-primary)] hover:underline">{action.description}</Link>;
  if (columnId === "responsable") return action.responsable || "—";
  if (columnId === "echeance") return action.statut === "À planifier" ? <span className="text-slate-400">—</span> : <span className={isActionOverdue(action) ? "font-semibold text-red-700" : undefined}>{formatEuropeanDate(action.echeance)}</span>;
  if (columnId === "statut") return <StatusPill tone={actionStatusTone(action.statut)}>{action.statut}</StatusPill>;
  if (columnId === "remarque") return action.remarque ?? "—";
  if (columnId === "lienContexte") return action.contextLink ? <Link href={action.contextLink.href} className="underline">{action.contextLink.label}</Link> : "—";
  return null;
}

export function ActionRow({ action, columns, origins, variant = "current" }: { action: ProductionAction; columns: ActionColumnSettings[]; origins: ActionOriginSettings[]; variant?: "current" | "backlog" }) {
  const [postponing, setPostponing] = useState(false);
  const [newDate, setNewDate] = useState(action.echeance);
  const [planning, setPlanning] = useState(false);
  const [planResponsable, setPlanResponsable] = useState("");
  const [planEcheance, setPlanEcheance] = useState("");

  function confirmPostpone() {
    if (!newDate) return;
    postponeAction(action.id, newDate);
    setPostponing(false);
  }

  function confirmPlan() {
    if (!planResponsable.trim() || !planEcheance) return;
    planAction(action.id, planResponsable, planEcheance);
    setPlanning(false);
  }

  function remove() {
    if (!window.confirm(`Supprimer l’idée « ${action.description} » ?`)) return;
    deleteAction(action.id);
  }

  return <tr className="border-b border-slate-100 align-top">
    {columns.map((column) => <td key={column.id} className="p-3 text-sm">{renderCell(column.id, action, origins)}</td>)}
    <td className="p-3">
      {variant === "backlog"
        ? planning
          ? <div className="flex flex-wrap items-center gap-1">
            <input required placeholder="Responsable" className={`${fieldClass} min-h-9 w-36`} value={planResponsable} onChange={(event) => setPlanResponsable(event.target.value)} />
            <input required type="date" className={`${fieldClass} min-h-9 w-36`} value={planEcheance} onChange={(event) => setPlanEcheance(event.target.value)} />
            <button className={secondaryButton} onClick={confirmPlan}>Confirmer</button>
            <button className={secondaryButton} onClick={() => setPlanning(false)}>Annuler</button>
          </div>
          : <div className="flex flex-wrap gap-1"><button className={secondaryButton} onClick={() => setPlanning(true)}>Planifier</button><button className={`${secondaryButton} text-red-700`} onClick={remove}>Supprimer</button></div>
        : postponing ? <div className="flex items-center gap-1"><input type="date" className={`${fieldClass} min-h-9 w-36`} value={newDate} onChange={(event) => setNewDate(event.target.value)} /><button className={secondaryButton} onClick={confirmPostpone}>Confirmer</button><button className={secondaryButton} onClick={() => setPostponing(false)}>Annuler</button></div>
          : action.statut === "Fait" ? null
          : <div className="flex flex-wrap gap-1"><button className={secondaryButton} onClick={() => completeAction(action.id)}>Fait</button><button className={secondaryButton} onClick={() => setPostponing(true)}>Reporter</button></div>}
    </td>
  </tr>;
}
