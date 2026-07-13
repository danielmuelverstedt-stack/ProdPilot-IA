import { connection } from "next/server";
import { AppShell } from "@/components/layout/AppShell";
import { MailConnectionsPanel } from "@/features/mail/components/MailConnectionsPanel";
import { getMailAccounts } from "@/features/mail/services/mail-connections";

export default async function MailSettingsPage() {
  await connection();
  const accounts = await getMailAccounts();

  return (
    <AppShell activeSection="settings" headerTitle="Réglages">
      <div className="mx-auto max-w-7xl">
        <nav aria-label="Fil d’Ariane" className="text-sm text-[#64736c]"><ol className="flex flex-wrap items-center gap-2"><li>Réglages</li><li aria-hidden="true">/</li><li>Connexions</li><li aria-hidden="true">/</li><li className="font-medium text-[#263b32]" aria-current="page">Messagerie</li></ol></nav>
        <header className="mt-7 max-w-3xl"><p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#247052]">Centre de connexions</p><h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#17211d] sm:text-4xl">Messagerie</h1><p className="mt-4 text-base leading-7 text-[#64736c] sm:text-lg">Gérez plusieurs comptes Google Workspace, Microsoft 365 ou Mock et choisissez celui utilisé dans tout ProdPilot IA.</p></header>
        <aside className="mt-6 rounded-2xl border border-[#ead7ae] bg-[#fff8e8] p-4 text-sm text-[#805d1f]"><strong>Mode démonstration.</strong> Les comptes restent locaux et n’ouvrent aucun flux OAuth. Les intégrations réelles seront raccordées ultérieurement au même registre.</aside>
        <MailConnectionsPanel initialAccounts={accounts} />
      </div>
    </AppShell>
  );
}
