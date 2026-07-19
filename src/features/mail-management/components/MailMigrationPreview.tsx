"use client";

import { useState } from "react";
import type { MailClassificationDecision, MailManagementAction } from "@/features/mail-management/types/mail-management";
import type { MailMessage } from "@/features/mail/types/mail";

interface Proposal { messageId: string; subject: string; decision: MailClassificationDecision; automaticArchiveAllowed: boolean }

export function MailMigrationPreview({ messages, pending, onApply }: { messages: MailMessage[]; pending: boolean; onApply: (action: MailManagementAction, ids: string[], source: "user" | "ai", ai?: { reason: string; confidence: number }) => void }) {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function preview() {
    setLoading(true); setError(null);
    try {
      const response = await fetch("/api/mail/management/classify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messageIds: messages.slice(0, 25).map((message) => message.id) }) });
      const result = await response.json() as { proposals?: Proposal[]; message?: string };
      if (!response.ok || !result.proposals) throw new Error(result.message ?? "L’aperçu de migration n’a pas pu être préparé.");
      setProposals(result.proposals);
    } catch (current) { setError(current instanceof Error ? current.message : "L’aperçu n’a pas pu être préparé."); }
    finally { setLoading(false); }
  }

  const toProcess = proposals.filter((item) => ["to_process", "needs_review"].includes(item.decision.classification));
  const archive = proposals.filter((item) => item.automaticArchiveAllowed);
  return <details className="rounded-2xl border border-[#dce5e0] bg-white p-4">
    <summary className="cursor-pointer font-semibold text-[#263b32]">Assistant de migration des mails existants</summary>
    <p className="mt-2 text-sm text-[#64736c]">Analyse locale limitée aux 25 mails récents affichés. Aucune modification n’est exécutée pendant l’aperçu.</p>
    <button type="button" disabled={loading || pending || messages.length === 0} onClick={() => void preview()} className="mt-3 min-h-10 rounded-xl border border-[#cbd7d1] bg-white px-4 text-sm font-semibold disabled:opacity-40">{loading ? "Analyse…" : "Préparer l’aperçu"}</button>
    {error ? <p role="alert" className="mt-3 text-sm text-red-700">{error}</p> : null}
    {proposals.length ? <div className="mt-4 space-y-3"><div className="grid gap-2 sm:grid-cols-3"><Count label="À traiter ou vérifier" value={toProcess.length}/><Count label="Informatifs" value={proposals.filter((item) => item.decision.classification === "informational").length}/><Count label="Archivage autorisé" value={archive.length}/></div><ul className="max-h-64 space-y-2 overflow-auto text-sm">{proposals.map((item) => <li key={item.messageId} className="rounded-lg bg-[#f7faf8] p-2"><strong>{item.subject}</strong><span className="block text-[#64736c]">{item.decision.reason} · {Math.round(item.decision.confidence * 100)} %</span></li>)}</ul><div className="flex flex-wrap gap-2">{toProcess.length ? <button type="button" disabled={pending} onClick={() => onApply("to_process", toProcess.map((item) => item.messageId), "user")} className={actionClass}>Confirmer À traiter ({toProcess.length})</button> : null}{archive.length ? <button type="button" disabled={pending} onClick={() => onApply("archive", archive.map((item) => item.messageId), "ai", { reason: "La classification locale et une règle utilisateur approuvée autorisent ce lot réversible.", confidence: Math.min(...archive.map((item) => item.decision.confidence)) })} className={actionClass}>Confirmer l’archivage IA ({archive.length})</button> : null}</div></div> : null}
  </details>;
}

const actionClass = "min-h-10 rounded-xl bg-[#195c45] px-4 text-sm font-semibold text-white disabled:opacity-40";
function Count({ label, value }: { label: string; value: number }) { return <div className="rounded-xl bg-[#f4f7f5] p-3"><strong className="text-xl">{value}</strong><span className="ml-2 text-xs text-[#64736c]">{label}</span></div>; }
