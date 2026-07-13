import { AppShell } from "@/components/layout/AppShell";
import { MailConnectionsPanel } from "@/features/mail/components/MailConnectionsPanel";
import { getMailConnectionSummaries } from "@/features/mail/services/mail-connections";

export default async function MailSettingsPage() {
  const connections = await getMailConnectionSummaries();

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
            Testez les futurs fournisseurs de messagerie avec des comptes de démonstration, sans autorisation ni donnée réelle.
          </p>
        </header>

        <section aria-labelledby="providers-title" className="mt-10">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 id="providers-title" className="text-lg font-semibold text-[#17211d]">Fournisseurs disponibles</h2>
              <p className="mt-1 text-sm leading-6 text-[#64736c]">Google Workspace utilise des données simulées. Microsoft 365 est présenté comme prochaine intégration.</p>
            </div>
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#cfe0d8] bg-white px-3 py-1.5 text-xs font-medium text-[#376151] shadow-sm">
              <span aria-hidden="true" className="size-2 rounded-full bg-[#41a77f]" />
              Aucun identifiant réel requis
            </div>
          </div>
          <MailConnectionsPanel initialConnections={connections} />
        </section>

        <aside className="mt-8 rounded-2xl border border-[#d7e2dd] bg-white/70 p-5 text-sm leading-6 text-[#55675f]">
          <strong className="font-semibold text-[#263b32]">Confidentialité.</strong>{" "}
          Les futures autorisations seront traitées côté serveur avec les droits minimaux nécessaires. Aucun secret de messagerie ne sera envoyé au navigateur.
        </aside>
      </div>
    </AppShell>
  );
}
