import { AppShell } from "@/components/layout/AppShell";
import { MailWorkspaceLoader } from "@/features/mail/components/MailWorkspaceLoader";

export default function MailsPage() {
  return (
    <AppShell activeSection="mail" headerTitle="Mails">
      <div className="mx-auto max-w-7xl">
        <header>
          <div className="flex flex-wrap items-center gap-3"><p className="text-sm font-semibold uppercase tracking-[0.13em] text-[#247052]">Centre de travail</p><span className="rounded-full bg-[#eef1ff] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#575d9b]">Compte actif</span></div>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em] text-[#17211d] sm:text-4xl">Mails</h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-[#64736c]">Consultez uniquement les messages du compte actif. Le changement de compte s’effectue dans Réglages.</p>
        </header>
        <MailWorkspaceLoader />
      </div>
    </AppShell>
  );
}
