"use client";

import { useState } from "react";
import { fieldClass, formatEuropeanDate, secondaryButton } from "@/components/ui/ModuleUi";
import { useDemoData } from "@/features/demo/services/demo-repository";
import { useSettings } from "@/features/settings/components/SettingsProvider";
import { completeAction, postponeAction, reassignAction } from "@/features/actions/services/action-service";

export function MeetingActionReview({ origine }: { origine: string }) {
  const data = useDemoData();
  const { settings } = useSettings();
  const items = data.actions.filter((item) => item.origine === origine && item.statut === "À faire");
  const [postponingId, setPostponingId] = useState<string | null>(null);
  const [newDate, setNewDate] = useState("");

  if (!items.length) return <p className="mt-4 text-sm text-slate-600">Aucune action « À faire » en attente pour cette origine. Vous pouvez passer aux nouveaux sujets.</p>;

  return <div className="mt-4 grid gap-2">{items.map((action) => <article key={action.id} className="rounded-xl border border-[var(--app-border)] p-3">
    <p className="text-sm font-medium">{action.description}</p>
    <p className="mt-1 text-xs text-slate-500">{action.responsable} · Échéance {formatEuropeanDate(action.echeance)}</p>
    {postponingId === action.id
      ? <div className="mt-2 flex flex-wrap items-center gap-1"><input type="date" className={`${fieldClass} min-h-9`} value={newDate} onChange={(event) => setNewDate(event.target.value)} /><button className={secondaryButton} onClick={() => { if (newDate) { postponeAction(action.id, newDate); setPostponingId(null); } }}>Confirmer</button><button className={secondaryButton} onClick={() => setPostponingId(null)}>Annuler</button></div>
      : <div className="mt-2 flex flex-wrap items-center gap-2">
        <button className={secondaryButton} onClick={() => completeAction(action.id)}>Fait</button>
        <button className={secondaryButton} onClick={() => { setPostponingId(action.id); setNewDate(action.echeance); }}>Reporté</button>
        <select aria-label={`Réassigner ${action.id}`} className={`${fieldClass} min-h-9`} value={action.responsable} onChange={(event) => reassignAction(action.id, event.target.value)}>
          <option value={action.responsable}>{action.responsable}</option>
          {settings.users.filter((user) => user.active).map((user) => `${user.firstName} ${user.lastName}`).filter((name) => name !== action.responsable).map((name) => <option key={name} value={name}>{name}</option>)}
        </select>
      </div>}
  </article>)}</div>;
}
