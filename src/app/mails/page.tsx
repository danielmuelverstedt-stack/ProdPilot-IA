import { AppShell } from "@/components/layout/AppShell";
import { MailWorkspace } from "@/features/mail/components/MailWorkspace";
import { getMailWorkspaceMessages } from "@/features/mail/services/mail-workspace";

export default async function MailsPage() {
  const messages = await getMailWorkspaceMessages();

  return (
    <AppShell activeSection="mail" headerTitle="Mails">
      <div className="mx-auto max-w-7xl">
        <header>
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm font-semibold uppercase tracking-[0.13em] text-[#247052]">Centre de travail</p>
            <span className="rounded-full bg-[#eef1ff] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#575d9b]">
              Démonstration
            </span>
          </div>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em] text-[#17211d] sm:text-4xl">Mails</h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-[#64736c]">
            Une vue priorisée de messages Google Workspace simulés. Microsoft 365 est prévu dans une prochaine étape et aucun e-mail ne peut être envoyé.
          </p>
        </header>
        <MailWorkspace initialMessages={messages} />
      </div>
    </AppShell>
  );
}
