"use client";

import { useSettings } from "@/features/settings/components/SettingsProvider";
import { AssistantPanel } from "@/features/workspace/components/AssistantPanel";
import { WorkspaceCard } from "@/features/workspace/components/WorkspaceCard";

export function WorkspaceDashboard({ urgentMailCount, replyMailCount, date }: { urgentMailCount: number; replyMailCount: number; date: string }) {
  const { settings } = useSettings();
  const cards = [...settings.workspaceCards].filter((item) => item.visible).sort((a, b) => a.order - b.order);
  const user = settings.users.find((item) => item.active) ?? settings.users[0];
  return <div className="mx-auto max-w-7xl">
    <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-widest text-[var(--app-primary)]">Votre journée</p><h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Bonjour {user?.firstName ?? "Daniel"}</h1><p className="mt-2 text-slate-600">Voici les sujets qui demandent votre attention aujourd’hui.</p></div><time className="w-fit rounded-full border border-[var(--app-border)] bg-white px-4 py-2 text-sm capitalize shadow-sm">{date}</time></header>
    <section className="mt-8" aria-labelledby="workspace-overview"><div className="mb-4 flex items-center justify-between"><h2 id="workspace-overview" className="text-lg font-semibold">Vue d’ensemble</h2><span className="text-xs text-slate-500">Données de démonstration</span></div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{cards.map((card) => <WorkspaceCard key={card.id} card={card} counter={card.id === "mails" ? urgentMailCount + replyMailCount : undefined} status={card.id === "mails" ? `${urgentMailCount} urgents · ${replyMailCount} réponses` : undefined} />)}</div></section>
    <AssistantPanel />
  </div>;
}
