import type { MailAssistantReplyProposal } from "@/features/mail-assistant/types/mail-assistant";

export function MailReplyProposal({ reply }: { reply: MailAssistantReplyProposal }) {
  return <div className="mt-5 rounded-2xl bg-[#f5f7f5] p-4 sm:p-5"><p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">Réponse proposée</p><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#2a3932]">{reply.versions[reply.currentVersion].bodyText}</p>{reply.status === "draft_created" ? <p className="mt-4 font-semibold text-[#1f5f49]">Brouillon créé · Aucun message envoyé</p> : reply.status === "approved" ? <p className="mt-4 font-semibold text-[#1f5f49]">Proposition validée</p> : null}</div>;
}
