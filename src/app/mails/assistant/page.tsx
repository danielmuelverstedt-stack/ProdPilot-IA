import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { MailAssistantWorkspace } from "@/features/mail-assistant/components/MailAssistantWorkspace";

export default function MailAssistantPage() {
  return <AppShell activeSection="mails" headerTitle="Assistant mails"><div className="mx-auto max-w-7xl"><header><p className="text-sm font-semibold uppercase tracking-[0.13em] text-[#247052]">Conversation opérationnelle</p><div className="mt-2 flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-3xl font-semibold tracking-[-0.045em] text-[#17211d] sm:text-4xl">Assistant mails</h1><p className="mt-3 max-w-3xl text-base leading-7 text-[#64736c]">Triez, corrigez et préparez vos réponses sans quitter la conversation.</p></div><Link href="/mails" className="min-h-10 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold">Voir la liste traditionnelle</Link></div></header><MailAssistantWorkspace /></div></AppShell>;
}
