"use client";

import { useMemo } from "react";
import { useSettings } from "@/features/settings/components/SettingsProvider";
import { AssistantPanel } from "@/features/workspace/components/AssistantPanel";
import { WorkspaceCard } from "@/features/workspace/components/WorkspaceCard";
import { TodayAgendaCard } from "@/features/workspace/components/TodayAgendaCard";
import { useDemoData } from "@/features/demo/services/demo-repository";
import type { CalendarEvent } from "@/features/calendar/types/calendar";

export function WorkspaceDashboard({ urgentMailCount, replyMailCount, todayEvents, date }: { urgentMailCount: number; replyMailCount: number; todayEvents: CalendarEvent[]; date: string }) {
  const { settings } = useSettings();
  const demo = useDemoData();
  const cards = useMemo(
    () => [...settings.workspaceCards].filter((item) => item.visible).sort((a, b) => a.order - b.order).map((item) => item.id === "mails" ? { ...item, href: "/mails/assistant", description: "Démarrez votre synthèse conversationnelle, préparez les réponses et gardez la liste traditionnelle accessible." } : item),
    [settings.workspaceCards],
  );
  const cardMetrics = useMemo(
    () => new Map(cards.map((card) => [card.id, getCardMetric(card.id, demo, urgentMailCount, replyMailCount)])),
    [cards, demo, urgentMailCount, replyMailCount],
  );
  const user = settings.users.find((item) => item.active) ?? settings.users[0];
  return <div className="mx-auto max-w-7xl">
    <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-widest text-[var(--app-primary)]">Votre journée</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-[var(--app-text)] sm:text-4xl">Bonjour {user?.firstName ?? "Daniel"}</h1><p className="mt-2 text-slate-600">Voici les sujets qui demandent votre attention aujourd’hui.</p></div><time className="w-fit rounded-full border border-[var(--app-border)] bg-white px-4 py-2 text-sm capitalize shadow-[var(--app-shadow-sm)]">{date}</time></header>
    <section className="mt-8" aria-labelledby="workspace-overview"><div className="mb-4 flex items-center justify-between"><h2 id="workspace-overview" className="text-lg font-semibold text-[var(--app-text)]">Vue d’ensemble</h2><span className="text-xs text-slate-500">Données locales et connectées</span></div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{cards.map((card) => { const metric = cardMetrics.get(card.id)!; return <WorkspaceCard key={card.id} card={card} counter={metric.counter} status={metric.status} />; })}</div></section>
    <TodayAgendaCard events={todayEvents} />
    <AssistantPanel todayEvents={todayEvents} />
  </div>;
}

function getCardMetric(id: string, demo: ReturnType<typeof useDemoData>, urgentMailCount: number, replyMailCount: number) {
  if (id === "mails") return { counter: urgentMailCount + replyMailCount, status: `${urgentMailCount} urgents · ${replyMailCount} réponses` };
  if (id === "open-actions") { const today = new Date().toISOString().slice(0, 10); const open = demo.actions.filter((item) => item.statut !== "Fait"); return { counter: open.length, status: `${open.filter((item) => item.echeance < today).length} en retard` }; }
  if (id === "planning") return { counter: demo.planning.filter((item) => item.status === "Bloquée").length + demo.machines.filter((item) => item.status === "En panne").length, status: "Arbitrages requis" };
  if (id === "qrqc") return { counter: demo.meetings.filter((item) => item.type === "QRQC" && item.status !== "Clôturée").length, status: "Prochain QRQC préparé" };
  if (id === "production-meeting") return { counter: demo.meetings.filter((item) => item.type === "Production" && item.status !== "Clôturée").length, status: "Réunion planifiée" };
  if (id === "machines") return { counter: demo.machines.filter((item) => item.status === "En panne" || item.status === "Maintenance prévue").length, status: "Alertes maintenance" };
  if (id === "requests") return { counter: demo.requests.filter((item) => item.status !== "Terminée" && item.status !== "Refusée").length, status: "Demandes ouvertes" };
  if (id === "erp-quality") return { counter: demo.erpQuality.filter((item) => item.status !== "Résolue").length, status: "Anomalies détectées" };
  return { counter: 0, status: "À consulter" };
}
