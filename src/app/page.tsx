import { connection } from "next/server";
import { AppShell } from "@/components/layout/AppShell";
import { getMailWorkspaceMessages } from "@/features/mail/services/mail-workspace";
import { AssistantPanel } from "@/features/workspace/components/AssistantPanel";
import { WorkspaceCard } from "@/features/workspace/components/WorkspaceCard";

const currentDateFormatter = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "2-digit",
  month: "long",
  year: "numeric",
  timeZone: "Europe/Brussels",
});

export default async function HomePage() {
  await connection();
  const messages = await getMailWorkspaceMessages();
  const urgentCount = messages.filter((message) => message.category === "urgent").length;
  const replyCount = messages.filter((message) => message.category === "reply_required").length;
  const currentDate = currentDateFormatter.format(new Date());

  const cards = [
    {
      title: "Mails",
      status: `${urgentCount} urgents · ${replyCount} réponses`,
      description: "Consultez les messages récents et préparez les prochaines actions.",
      href: "/mails",
      actionLabel: "Ouvrir les mails",
      marker: "MA",
      tone: "brand" as const,
    },
    {
      title: "Actions",
      status: "3 prioritaires",
      description: "Suivez les décisions et les tâches qui demandent une intervention.",
      href: "/modules/actions",
      actionLabel: "Voir les actions",
      marker: "AC",
      tone: "warning" as const,
    },
    {
      title: "Planning",
      status: "2 conflits à vérifier",
      description: "Visualisez la charge et les points de vigilance du planning machines.",
      href: "/modules/planning",
      actionLabel: "Ouvrir le planning",
      marker: "PL",
      tone: "warning" as const,
    },
    {
      title: "QRQC",
      status: "1 point ouvert",
      description: "Retrouvez les problèmes en cours et les contre-mesures associées.",
      href: "/modules/qrqc",
      actionLabel: "Ouvrir le QRQC",
      marker: "QR",
    },
    {
      title: "Réunion Production",
      status: "Demain à 09 h 30",
      description: "Préparez l’ordre du jour, les décisions et les points de suivi.",
      href: "/modules/reunions",
      actionLabel: "Voir la réunion",
      marker: "RP",
    },
    {
      title: "Parc Machines",
      status: "1 indisponibilité",
      description: "Consultez l’état opérationnel des équipements de production.",
      href: "/modules/parc-machines",
      actionLabel: "Voir les machines",
      marker: "PM",
    },
  ];

  return (
    <AppShell activeSection="workspace" headerTitle="Mon Espace">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.13em] text-[#247052]">Votre journée</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em] text-[#17211d] sm:text-4xl">Bonjour Daniel</h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-[#64736c]">Voici les sujets qui demandent votre attention aujourd’hui.</p>
          </div>
          <time dateTime={new Date().toISOString().slice(0, 10)} className="w-fit rounded-full border border-[#d5e3dc] bg-white px-4 py-2 text-sm capitalize text-[#51645b] shadow-sm">{currentDate}</time>
        </header>

        <section aria-labelledby="overview-title" className="mt-9">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 id="overview-title" className="text-lg font-semibold text-[#263b32]">Vue d’ensemble</h2>
            <span className="text-xs font-medium text-[#75847d]">Données de démonstration</span>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {cards.map((card) => <WorkspaceCard key={card.title} {...card} />)}
          </div>
        </section>

        <AssistantPanel />
      </div>
    </AppShell>
  );
}
