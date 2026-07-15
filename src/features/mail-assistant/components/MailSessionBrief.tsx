import { MailDecisionCounters } from "@/features/mail-assistant/components/MailDecisionCounters";
import type { MailAssistantSession } from "@/features/mail-assistant/types/mail-assistant";

export function MailSessionBrief({ firstName, session }: { firstName: string; session: MailAssistantSession }) {
  const assistantIntro = session.conversation.find((entry) => entry.role === "assistant")?.text ?? "La session est prête.";
  const explanation = assistantIntro.split(". ").slice(-2).join(". ");
  return <section className="pt-12 text-center sm:pt-16">
    <p className="text-base text-slate-500">Bonjour {firstName}</p>
    <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">J’ai analysé vos nouveaux messages.</h1>
    <p className="mt-4 text-xl font-medium text-[#1f5f49]">{session.messages.length} nouveau{session.messages.length > 1 ? "x" : ""} e-mail{session.messages.length > 1 ? "s" : ""}</p>
    <MailDecisionCounters session={session}/>
    <div className="mx-auto mt-8 max-w-2xl text-left"><p className="rounded-2xl bg-[#edf3ef] px-5 py-4 text-sm leading-6 text-[#30443a]">{explanation}</p><details className="mt-3 text-center text-sm"><summary className="cursor-pointer font-medium text-[#1f5f49]">Voir comment les messages ont été classés</summary><div className="mt-3 rounded-2xl border border-black/[0.06] bg-white p-4 text-left text-xs leading-5 text-slate-600">{session.messages.map((message) => <p key={message.id} className="py-1"><strong>{message.sessionNumber}. {message.subject}</strong> — {message.classification.reason}</p>)}</div></details></div>
  </section>;
}
