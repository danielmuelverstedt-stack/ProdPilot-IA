"use client";

import { useState } from "react";

export function AssistantPanel() {
  const [message, setMessage] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!message.trim()) {
      setNotice("Saisissez une question pour préparer votre demande.");
      return;
    }
    const request = message.toLocaleLowerCase("fr");
    if (request.includes("priorit")) setNotice("Priorités de démonstration : sécuriser FIL-01, confirmer FRA-10 et traiter l’échéance OF-240184.");
    else if (request.includes("planning")) setNotice("Le planning signale une panne en découpe fil et une maintenance prévue sur FRA-10.");
    else if (request.includes("action")) setNotice("Trois actions urgentes ou bloquantes sont ouvertes dans les données de démonstration.");
    else setNotice("Réponse de démonstration : consultez Actions, Planning et Qualité ERP pour préparer votre arbitrage.");
  }

  return (
    <section aria-labelledby="assistant-title" className="mt-8 overflow-hidden rounded-3xl bg-[#123d30] p-6 text-white shadow-[0_20px_55px_rgba(18,61,48,0.18)] sm:p-8">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-200/70">Assistant ProdPilot</p>
        <h2 id="assistant-title" className="mt-2 text-2xl font-semibold tracking-[-0.03em]">Que souhaitez-vous préparer ?</h2>
        <p className="mt-2 text-sm leading-6 text-emerald-50/70">Posez une question sur vos priorités. Les réponses sont déterministes et utilisent uniquement les données de démonstration.</p>
      </div>
      <form onSubmit={handleSubmit} className="mt-6">
        <label htmlFor="assistant-message" className="sr-only">Votre demande à l’assistant</label>
        <textarea
          id="assistant-message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Exemple : quelles sont mes priorités de production aujourd’hui ?"
          className="min-h-32 w-full resize-y rounded-2xl border border-white/15 bg-white/10 p-4 text-base text-white placeholder:text-emerald-50/45 focus:bg-white/12"
        />
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p aria-live="polite" className="text-sm text-emerald-100/75">{notice ?? "Assistant local de démonstration · aucune donnée ne quitte l’application."}</p>
          <button type="submit" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-white px-5 text-sm font-semibold text-[#123d30] hover:bg-emerald-50">Préparer la demande</button>
        </div>
      </form>
    </section>
  );
}
