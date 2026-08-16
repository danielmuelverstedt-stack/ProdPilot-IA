"use client";

import { useState } from "react";
import { fieldClass, formatEuropeanDate, secondaryButton } from "@/components/ui/ModuleUi";
import type { ProductionAction } from "@/features/demo/types/demo";

/**
 * Commentaires (auteur + date + texte) et historique des changements d'une action — partagé par la
 * fiche action (`ActionDetail.tsx`) et le panneau rapide de réunion (`ActionQuickEditPanel.tsx`),
 * pour qu'il n'existe qu'un seul endroit où cette activité est composée et affichée.
 */
export function ActionActivity({ action, onAddComment }: { action: ProductionAction; onAddComment: (text: string) => void }) {
  const [comment, setComment] = useState("");

  function submit() {
    if (!comment.trim()) return;
    onAddComment(comment);
    setComment("");
  }

  const comments = [...action.comments].reverse();
  const history = [...action.history].reverse();

  return <div className="grid gap-4">
    <div>
      <h3 className="text-xs font-semibold uppercase text-slate-500">Commentaires</h3>
      <div className="mt-2 flex gap-1">
        <input className={`${fieldClass} min-w-0 flex-1`} value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Ajouter un commentaire…" onKeyDown={(event) => { if (event.key === "Enter") submit(); }} />
        <button type="button" className={secondaryButton} onClick={submit}>Commenter</button>
      </div>
      {comments.length ? <ul className="mt-3 space-y-2">{comments.map((item) => <li key={item.id} className="rounded-lg bg-slate-50 p-2.5 text-sm">
        <p className="flex flex-wrap items-baseline gap-1.5 text-xs text-slate-500"><strong className="font-semibold text-[var(--app-text)]">{item.author}</strong>{formatEuropeanDate(item.date, true)}</p>
        <p className="mt-1">{item.text}</p>
      </li>)}</ul> : <p className="mt-3 text-sm text-slate-500">Aucun commentaire pour l’instant.</p>}
    </div>
    {history.length ? <details>
      <summary className="cursor-pointer text-xs font-semibold uppercase text-slate-500">Voir l’historique complet ({history.length})</summary>
      <ul className="mt-2 space-y-1.5">{history.map((entry) => <li key={entry.id} className="text-xs text-slate-500"><span className="font-medium text-slate-700">{formatEuropeanDate(entry.date, true)}</span> · {entry.author} — {entry.description}</li>)}</ul>
    </details> : null}
  </div>;
}
