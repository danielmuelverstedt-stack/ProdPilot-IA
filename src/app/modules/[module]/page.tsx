import { notFound } from "next/navigation";
import { AppShell, type ActiveSection } from "@/components/layout/AppShell";

const modules: Record<
  string,
  { title: string; description: string; activeSection: ActiveSection }
> = {
  planning: {
    title: "Planning",
    description: "Le planning machines et la gestion des conflits seront disponibles dans une prochaine étape.",
    activeSection: "planning",
  },
  of: {
    title: "Ordres de fabrication",
    description: "La consultation des OF nettoyés sera ajoutée après la fondation des imports ERP.",
    activeSection: "work-orders",
  },
  reunions: {
    title: "Réunions",
    description: "La préparation et le suivi des réunions de production seront disponibles prochainement.",
    activeSection: "meetings",
  },
  actions: {
    title: "Actions",
    description: "Le suivi centralisé des actions est prévu dans une prochaine version.",
    activeSection: "actions",
  },
  "parc-machines": {
    title: "Parc Machines",
    description: "Les fiches et disponibilités machines seront ajoutées progressivement.",
    activeSection: "machines",
  },
  qrqc: {
    title: "QRQC",
    description: "Le suivi structuré des problèmes QRQC sera disponible dans une prochaine version.",
    activeSection: "workspace",
  },
  "tableau-de-bord": { title: "Tableau de bord", description: "Les indicateurs consolidés seront disponibles prochainement.", activeSection: "dashboard" },
  "qualite-erp": { title: "Qualité ERP", description: "Les contrôles de cohérence ERP seront ajoutés sans écriture directe dans la première version.", activeSection: "erp-quality" },
  suivi: { title: "Suivi", description: "Le centre de suivi transversal est en préparation.", activeSection: "tracking" },
  analyses: { title: "Analyses", description: "Les analyses de charge et de performance seront disponibles prochainement.", activeSection: "analytics" },
};

export default async function ModulePage({
  params,
}: {
  params: Promise<{ module: string }>;
}) {
  const { module: moduleId } = await params;
  const selectedModule = modules[moduleId];
  if (!selectedModule) notFound();

  return (
    <AppShell activeSection={selectedModule.activeSection} headerTitle={selectedModule.title}>
      <div className="mx-auto grid min-h-[65vh] max-w-4xl place-items-center">
        <section className="w-full rounded-3xl border border-[#dce5e0] bg-white px-6 py-14 text-center shadow-[0_16px_45px_rgba(29,64,50,0.07)] sm:px-10">
          <span aria-hidden="true" className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#e7f2ed] text-lg font-bold text-[#195c45]">…</span>
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.14em] text-[#247052]">Module en préparation</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#17211d]">{selectedModule.title}</h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-[#64736c]">{selectedModule.description}</p>
        </section>
      </div>
    </AppShell>
  );
}
