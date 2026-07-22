"use client";

import { useState } from "react";
import { primaryButton } from "@/components/ui/ModuleUi";

export interface ReviewableDraft {
  key: string;
  draftId: string | null;
  recipient: string;
  subject: string;
  bodyText: string;
}

export function MailDraftReviewCard({ draft, sendingEnabled, onSent }: {
  draft: ReviewableDraft;
  sendingEnabled: boolean;
  onSent: (key: string) => void;
}) {
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function send() {
    if (!draft.draftId) return;
    setSending(true);
    setError(null);
    try {
      const response = await fetch(`/api/mail/drafts/${encodeURIComponent(draft.draftId)}/send`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ confirmed: true }) });
      const payload = await response.json() as { message?: string };
      if (!response.ok) throw new Error(payload.message ?? "L’envoi a échoué.");
      setSent(true);
      onSent(draft.key);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "L’envoi a échoué.");
    } finally {
      setSending(false);
    }
  }

  return <div className="mt-4 rounded-2xl border border-[var(--app-border)] bg-white p-4 shadow-[var(--app-shadow-sm)]">
    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Brouillon prêt · relisez avant d’envoyer</p>
    <p className="mt-2 text-sm"><strong className="font-semibold">À :</strong> {draft.recipient}</p>
    <p className="mt-1 text-sm font-semibold text-[var(--app-text)]">{draft.subject}</p>
    <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{draft.bodyText}</p>
    {sent ? <p className="mt-3 text-sm font-semibold text-emerald-700">Message envoyé.</p> : (
      <div className="mt-3 flex flex-wrap items-center gap-3">
        {sendingEnabled
          ? <button className={primaryButton} disabled={sending || !draft.draftId} onClick={() => void send()}>{sending ? "Envoi…" : "Envoyer"}</button>
          : <p className="text-xs text-amber-700">L’envoi depuis ProdPilot est désactivé pour ce compte. Activez-le dans Réglages → Connexions → Messagerie, ou ouvrez le brouillon dans votre messagerie.</p>}
        {error ? <span className="text-xs font-medium text-red-700">{error}</span> : null}
      </div>
    )}
  </div>;
}
