"use client";

import Link from "next/link";
import { useState } from "react";
import { fieldClass, formatEuropeanDate, secondaryButton, StatusPill } from "@/components/ui/ModuleUi";
import { completeAction, postponeAction } from "@/features/actions/services/action-service";
import type { ProductionAction } from "@/features/demo/types/demo";
import type { ActionColumnSettings, ActionOriginSettings } from "@/features/settings/types/settings";

function isOverdue(action: ProductionAction): boolean {
  return action.statut !== "Fait" && action.echeance < new Date().toISOString().slice(0, 10);
}

function statusTone(statut: ProductionAction["statut"]) {
  if (statut === "Fait") return "success" as const;
  if (statut === "Reporté") return "warning" as const;
  return "neutral" as const;
}

function renderCell(columnId: string, action: ProductionAction, origins: ActionOriginSettings[]) {
  if (columnId === "dateEncodage") return formatEuropeanDate(action.dateEncodage);
  if (columnId === "introduitPar") return action.introduitPar;
  if (columnId === "origine") { const origin = origins.find((item) => item.value === action.origine); return <StatusPill tone="neutral">{origin?.label ?? action.origine}</StatusPill>; }
  if (columnId === "description") return <Link href={`/actions/${action.id}`} className="font-medium text-[var(--app-primary)] hover:underline">{action.description}</Link>;
  if (columnId === "responsable") return action.responsable;
  if (columnId === "echeance") return <span className={isOverdue(action) ? "font-semibold text-red-700" : undefined}>{formatEuropeanDate(action.echeance)}</span>;
  if (columnId === "statut") return <StatusPill tone={statusTone(action.statut)}>{action.statut}</StatusPill>;
  if (columnId === "remarque") return action.remarque ?? "—";
  if (columnId === "lienContexte") return action.contextLink ? <Link href={action.contextLink.href} className="underline">{action.contextLink.label}</Link> : "—";
  return null;
}

export function ActionRow({ action, columns, origins }: { action: ProductionAction; columns: ActionColumnSettings[]; origins: ActionOriginSettings[] }) {
  const [postponing, setPostponing] = useState(false);
  const [newDate, setNewDate] = useState(action.echeance);

  function confirmPostpone() {
    if (!newDate) return;
    postponeAction(action.id, newDate);
    setPostponing(false);
  }

  return <tr className="border-b border-slate-100 align-top">
    {columns.map((column) => <td key={column.id} className="p-3 text-sm">{renderCell(column.id, action, origins)}</td>)}
    <td className="p-3">
      {postponing ? <div className="flex items-center gap-1"><input type="date" className={`${fieldClass} min-h-9 w-36`} value={newDate} onChange={(event) => setNewDate(event.target.value)} /><button className={secondaryButton} onClick={confirmPostpone}>Confirmer</button><button className={secondaryButton} onClick={() => setPostponing(false)}>Annuler</button></div>
        : action.statut === "Fait" ? null
        : <div className="flex flex-wrap gap-1"><button className={secondaryButton} onClick={() => completeAction(action.id)}>Fait</button><button className={secondaryButton} onClick={() => setPostponing(true)}>Reporter</button></div>}
    </td>
  </tr>;
}
