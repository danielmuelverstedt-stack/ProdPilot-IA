"use client";

import type { MailActivityEntry } from "@/features/mail-management/types/mail-management";

export function MailActivityPanel({ entries, pending, onUndo }: { entries: MailActivityEntry[]; pending: boolean; onUndo: (id: string) => void }) {
  return <details className="rounded-2xl border border-[#dce5e0] bg-white p-4">
    <summary className="cursor-pointer font-semibold text-[#263b32]">Activité de l’IA et des classements <span className="text-sm font-normal text-[#64736c]">({entries.length})</span></summary>
    <div className="mt-4 space-y-3">
      {entries.length ? entries.slice(0, 20).map((entry) => <article key={entry.id} className="rounded-xl border border-[#e4ebe7] bg-[#fafcfb] p-3 text-sm">
        <div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-semibold text-[#33473e]">{entry.subject}</p><p className="mt-1 text-[#64736c]">{entry.reason}</p></div><time dateTime={entry.createdAt} className="text-xs text-[#7a8982]">{formatDate(entry.createdAt)}</time></div>
        <p className="mt-2 text-xs text-[#64736c]">{entry.automatic ? "Automatique" : "Confirmé par l’utilisateur"} · {gmailResultLabels[entry.gmailResult]}{entry.aiConfidence !== null ? ` · confiance ${Math.round(entry.aiConfidence * 100)} %` : ""}</p>
        {(entry.labelsAdded.length || entry.labelsRemoved.length) ? <p className="mt-1 text-xs text-[#64736c]">Ajoutés : {entry.labelsAdded.join(", ") || "aucun"} · Retirés : {entry.labelsRemoved.join(", ") || "aucun"}</p> : null}
        {entry.canUndo ? <button type="button" disabled={pending} onClick={() => onUndo(entry.id)} className="mt-3 min-h-9 rounded-lg border border-[#cbd7d1] bg-white px-3 text-xs font-semibold">Annuler dans Gmail</button> : null}
      </article>) : <p className="text-sm text-[#64736c]">Aucune action enregistrée pour ce compte.</p>}
    </div>
  </details>;
}

const gmailResultLabels: Record<MailActivityEntry["gmailResult"], string> = {
  confirmed: "Confirmé par Gmail",
  failed: "Échec Gmail journalisé",
  undone: "Annulé dans Gmail",
};

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("fr-BE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(value));
}
