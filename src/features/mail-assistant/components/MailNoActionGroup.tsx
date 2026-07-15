import type { MailAssistantSession } from "@/features/mail-assistant/types/mail-assistant";

export function MailNoActionGroup({ session, onCommand }: { session: MailAssistantSession; onCommand: (text: string) => void }) {
  const messages = session.messages.filter((message) => !message.classification.requiresReply && !message.classification.suggestsAction && message.classification.group !== "review" && !message.ignored);
  if (!messages.length) return null;
  return <details className="mt-8 rounded-2xl border border-black/[0.06] bg-white/60 p-4"><summary className="cursor-pointer font-semibold text-slate-600">{messages.length} message{messages.length > 1 ? "s" : ""} sans action recommandée</summary><ul className="mt-4 divide-y divide-black/[0.05]">{messages.map((message) => <li key={message.id} className="flex items-start justify-between gap-4 py-3 text-sm"><div><p className="font-semibold">{message.from.name ?? message.from.email} · {message.subject}</p><p className="mt-1 text-xs text-slate-500">{message.classification.reason}</p></div><button type="button" onClick={() => onCommand(`Ouvre le mail ${message.sessionNumber}`)} className="shrink-0 text-xs font-semibold text-[#1f5f49]">Revoir</button></li>)}</ul></details>;
}
