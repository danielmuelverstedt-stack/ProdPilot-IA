import { MailConnectionsPanel } from "@/features/mail/components/MailConnectionsPanel";
import { getMailConnectionSummaries } from "@/features/mail/services/mail-connections";

export default async function MailSettingsPage() {
  const connections = await getMailConnectionSummaries();

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[244px_1fr]">
      <aside className="border-b border-[#dfe6e2] bg-[#123d30] px-5 py-5 text-white lg:min-h-screen lg:border-b-0 lg:px-6 lg:py-8">
        <div className="flex items-center justify-between lg:block">
          <div className="flex items-center gap-3">
            <div
              aria-hidden="true"
              className="grid size-10 place-items-center rounded-xl bg-white/12 text-lg font-bold ring-1 ring-white/20"
            >
              P
            </div>
            <div>
              <p className="font-semibold tracking-[-0.02em]">ProdPilot IA</p>
              <p className="text-xs text-emerald-100/70">Pilotage de production</p>
            </div>
          </div>
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-emerald-50 lg:mt-10 lg:inline-flex">
            Réglages
          </span>
        </div>

        <nav aria-label="Navigation des réglages" className="mt-5 hidden lg:block">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-100/55">
            Espace de travail
          </p>
          <a
            aria-current="page"
            className="flex items-center gap-3 rounded-xl bg-white/12 px-3 py-3 text-sm font-medium ring-1 ring-white/10"
            href="/reglages/connexions/messagerie"
          >
            <span aria-hidden="true" className="size-2 rounded-full bg-[#69d3a7]" />
            Connexions
          </a>
        </nav>
      </aside>

      <main className="px-5 py-8 sm:px-8 lg:px-12 lg:py-12 xl:px-16">
        <div className="mx-auto max-w-5xl">
          <nav aria-label="Fil d’Ariane" className="text-sm text-[#64736c]">
            <ol className="flex flex-wrap items-center gap-2">
              <li>Réglages</li>
              <li aria-hidden="true">/</li>
              <li>Connexions</li>
              <li aria-hidden="true">/</li>
              <li className="font-medium text-[#263b32]" aria-current="page">
                Messagerie
              </li>
            </ol>
          </nav>

          <header className="mt-7 max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#247052]">
              Centre de connexions
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#17211d] sm:text-4xl">
              Messagerie
            </h1>
            <p className="mt-4 text-base leading-7 text-[#64736c] sm:text-lg">
              Connectez votre messagerie professionnelle pour regrouper les messages importants et préparer vos prochaines actions.
            </p>
          </header>

          <section aria-labelledby="providers-title" className="mt-10">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 id="providers-title" className="text-lg font-semibold text-[#17211d]">
                  Fournisseurs disponibles
                </h2>
                <p className="mt-1 text-sm leading-6 text-[#64736c]">
                  Les connexions de cette version utilisent des données de démonstration.
                </p>
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
      </main>
    </div>
  );
}
