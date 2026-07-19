import type { MailAssistantReplyProposal } from "@/features/mail-assistant/types/mail-assistant";

export function MailReplyProposal({ reply }: { reply: MailAssistantReplyProposal }) {
  return <div className="mt-5 rounded-2xl border border-[var(--app-border)] bg-slate-50 p-4 sm:p-5"><p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">Réponse proposée</p><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{reply.versions[reply.currentVersion].bodyText}</p>{reply.status === "draft_created" ? <p className="mt-4 font-semibold text-[var(--app-primary)]">Brouillon créé · Aucun message envoyé</p> : reply.status === "approved" ? <p className="mt-4 font-semibold text-[var(--app-primary)]">Proposition validée</p> : null}</div>;
}
