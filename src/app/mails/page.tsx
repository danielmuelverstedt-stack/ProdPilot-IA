import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { MailWorkspaceLoader } from "@/features/mail/components/MailWorkspaceLoader";

export default function MailsPage() {
  return (
    <AppShell activeSection="mails" headerTitle="Mails">
      <div className="mx-auto max-w-7xl">
        <header>
          <div className="flex flex-wrap items-center gap-3"><p className="text-sm font-semibold uppercase tracking-[0.13em] text-[#247052]">Centre de travail</p><span className="rounded-full bg-[#eef1ff] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#575d9b]">Compte actif</span></div>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em] text-[#17211d] sm:text-4xl">Mails</h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-[#64736c]">Consultez uniquement les messages du compte actif. Le changement de compte s’effectue dans Réglages.</p>
          <div className="mt-5 flex flex-wrap gap-2"><Link href="/mails/assistant" className="inline-flex min-h-11 items-center rounded-xl bg-[#195c45] px-5 text-sm font-semibold text-white">Démarrer ma session mails</Link><Link href="/mails/diagnostic" className="inline-flex min-h-11 items-center rounded-xl border border-[#cbd7d1] bg-white px-5 text-sm font-semibold text-[#263b32]">Diagnostic Mail</Link></div>
        </header>
        <MailWorkspaceLoader />
      </div>
    </AppShell>
  );
}
