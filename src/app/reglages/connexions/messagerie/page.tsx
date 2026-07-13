import { AppShell } from "@/components/layout/AppShell";
import { connection } from "next/server";
import { MailConnectionsPanel } from "@/features/mail/components/MailConnectionsPanel";
import { getMailConnectionSummaries } from "@/features/mail/services/mail-connections";

export default async function MailSettingsPage({ searchParams }: { searchParams: Promise<{ google?: string; reason?: string }> }) {
  await connection();
  const connections = await getMailConnectionSummaries();
  const query = await searchParams;
  const callbackNotice = getGoogleCallbackNotice(query.google, query.reason);

  return (
    <AppShell activeSection="settings" headerTitle="Réglages">
      <div className="mx-auto max-w-5xl">
        <nav aria-label="Fil d’Ariane" className="text-sm text-[#64736c]">
          <ol className="flex flex-wrap items-center gap-2">
            <li>Réglages</li>
            <li aria-hidden="true">/</li>
            <li>Connexions</li>
            <li aria-hidden="true">/</li>
            <li className="font-medium text-[#263b32]" aria-current="page">Messagerie</li>
          </ol>
        </nav>

        <header className="mt-7 max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#247052]">Centre de connexions</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#17211d] sm:text-4xl">Messagerie</h1>
          <p className="mt-4 text-base leading-7 text-[#64736c] sm:text-lg">
            Connectez le compte Google Workspace autorisé. Les jetons restent exclusivement côté serveur et Microsoft 365 demeure indisponible.
          </p>
        </header>

        <section aria-labelledby="providers-title" className="mt-10">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 id="providers-title" className="text-lg font-semibold text-[#17211d]">Fournisseurs disponibles</h2>
              <p className="mt-1 text-sm leading-6 text-[#64736c]">Google Workspace utilise Gmail API. Microsoft 365 est présenté comme prochaine intégration.</p>
            </div>
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#cfe0d8] bg-white px-3 py-1.5 text-xs font-medium text-[#376151] shadow-sm">
              <span aria-hidden="true" className="size-2 rounded-full bg-[#41a77f]" />
              OAuth côté serveur
            </div>
          </div>
          <MailConnectionsPanel initialConnections={connections} callbackNotice={callbackNotice} />
        </section>

        <aside className="mt-8 rounded-2xl border border-[#d7e2dd] bg-white/70 p-5 text-sm leading-6 text-[#55675f]">
          <strong className="font-semibold text-[#263b32]">Confidentialité.</strong>{" "}
          Google OAuth et Gmail API sont traités côté serveur avec les droits minimaux nécessaires. Aucun secret ni jeton de messagerie n’est envoyé au navigateur.
        </aside>
      </div>
    </AppShell>
  );
}

function getGoogleCallbackNotice(status?: string, reason?: string) {
  if (status === "connected") return { tone: "success" as const, message: "Google Workspace est connecté. Les messages Gmail peuvent maintenant être synchronisés." };
  if (status !== "error") return null;
  const messages: Record<string, string> = {
    configuration: "La configuration serveur Google Workspace est incomplète.",
    account: "Le compte Google sélectionné n’est pas autorisé.",
    state: "La vérification de sécurité OAuth a échoué. Recommencez la connexion.",
    token: "La connexion Google n’a pas pu être finalisée. Révoquez l’accès Google puis réessayez.",
    oauth: "Google a refusé ou interrompu la demande de connexion.",
  };
  return { tone: "error" as const, message: messages[reason ?? ""] ?? messages.oauth };
}
