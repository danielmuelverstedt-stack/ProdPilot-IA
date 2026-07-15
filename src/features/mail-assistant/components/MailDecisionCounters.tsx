import type { MailAssistantSession } from "@/features/mail-assistant/types/mail-assistant";

export function MailDecisionCounters({ session }: { session: MailAssistantSession }) {
  const noAction = session.messages.filter((message) => !message.classification.requiresReply && !message.classification.suggestsAction && message.classification.group !== "review").length;
  const counters = [
    [noAction, "Sans action"], [session.replies.length, "Réponses préparées"],
    [session.messages.filter((message) => message.classification.suggestsAction).length, "Actions suggérées"],
    [session.messages.filter((message) => message.classification.group === "review").length, "À vérifier"],
    [session.messages.filter((message) => message.classification.isUrgent).length, "Urgent"],
  ] as const;
  return <div className="mt-10 grid grid-cols-2 gap-2 sm:grid-cols-5">{counters.map(([value, label]) => <div key={label} className="mail-session-enter rounded-2xl border border-black/[0.055] bg-white/75 px-4 py-4 text-center"><strong className="block text-2xl font-semibold tracking-tight text-[#1b2923]">{value}</strong><span className="mt-1 block text-xs leading-4 text-slate-500">{label}</span></div>)}</div>;
}
