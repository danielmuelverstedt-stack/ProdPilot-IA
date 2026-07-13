import { connection } from "next/server";
import { AppShell } from "@/components/layout/AppShell";
import { MailConnectionsPanel } from "@/features/mail/components/MailConnectionsPanel";
import { getMailAccounts } from "@/features/mail/services/mail-connections";

interface MailSettingsPageProps {
  searchParams: Promise<{ google?: string; reason?: string }>;
}

export default async function MailSettingsPage({ searchParams }: MailSettingsPageProps) {
  await connection();
  const query = await searchParams;
  const accounts = await getMailAccounts();
  const initialNotice = getGoogleNotice(query.google, query.reason);

  return (
    <AppShell activeSection="settings" headerTitle="Réglages">
      <div className="mx-auto max-w-7xl">
        <nav aria-label="Fil d’Ariane" className="text-sm text-[#64736c]"><ol className="flex flex-wrap items-center gap-2"><li>Réglages</li><li aria-hidden="true">/</li><li>Connexions</li><li aria-hidden="true">/</li><li className="font-medium text-[#263b32]" aria-current="page">Messagerie</li></ol></nav>
        <header className="mt-7 max-w-3xl"><p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#247052]">Centre de connexions</p><h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#17211d] sm:text-4xl">Messagerie</h1><p className="mt-4 text-base leading-7 text-[#64736c] sm:text-lg">Gérez plusieurs comptes Google Workspace, Microsoft 365 ou Mock et choisissez celui utilisé dans tout ProdPilot IA.</p></header>
        <aside className="mt-6 rounded-2xl border border-[#d7e4de] bg-[#f7faf8] p-4 text-sm text-[#40554b]"><strong>Compte actif unique.</strong> Gmail utilise OAuth côté serveur. Les comptes Mock restent disponibles pour tester l’interface sans connexion externe.</aside>
        <MailConnectionsPanel initialAccounts={accounts} initialNotice={initialNotice} />
      </div>
    </AppShell>
  );
}

function getGoogleNotice(google?: string, reason?: string) {
  if (google === "connected") {
    return { tone: "success" as const, message: "Compte Google Workspace connecté et activé." };
  }
  if (google !== "error") return undefined;
  const messages: Record<string, string> = {
    configuration: "Configuration Google absente ou invalide. Vérifiez les variables serveur.",
    account: "Compte Google non autorisé par la politique serveur.",
    state: "Session OAuth invalide ou expirée. Recommencez la connexion.",
    token: "Autorisation refusée, révoquée ou incomplète. Reconnectez le compte.",
    oauth: "Autorisation Google annulée ou refusée.",
  };
  return {
    tone: "error" as const,
    message: messages[reason ?? "oauth"] ?? messages.oauth,
  };
}
