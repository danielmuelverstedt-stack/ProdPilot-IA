"use client";

import { useMemo } from "react";
import { useSettings } from "@/features/settings/components/SettingsProvider";
import { AssistantPanel } from "@/features/workspace/components/AssistantPanel";
import { WorkspaceCard } from "@/features/workspace/components/WorkspaceCard";
import { WorkspaceWelcomeBanner } from "@/features/workspace/components/WorkspaceWelcomeBanner";
import { TodayAgendaCard } from "@/features/workspace/components/TodayAgendaCard";
import { DepartmentLoadWidget, MachineDowntimeWidget, OccupancyChartWidget, UpcomingWorkOrdersWidget, WorkOrderTrackingWidget } from "@/features/workspace/components/DashboardWidgets";
import { buildDepartmentLoad, buildMachineDowntimeEntries, buildUpcomingWorkOrders, buildWeeklyMachineOccupancy, buildWorkOrderTrackingTotals } from "@/features/workspace/services/workspace-dashboard-metrics";
import { useDemoData } from "@/features/demo/services/demo-repository";
import type { CalendarEvent } from "@/features/calendar/types/calendar";

export function WorkspaceDashboard({ urgentMailCount, replyMailCount, todayEvents, date }: { urgentMailCount: number; replyMailCount: number; todayEvents: CalendarEvent[]; date: string }) {
  const { settings } = useSettings();
  const demo = useDemoData();
  const cards = useMemo(
    () => [...settings.workspaceCards].filter((item) => item.visible).sort((a, b) => a.order - b.order).map((item) => item.id === "mails" ? { ...item, description: "Démarrez votre synthèse conversationnelle, préparez les réponses et gardez la liste traditionnelle accessible." } : item),
    [settings.workspaceCards],
  );
  const cardCounters = useMemo(
    () => new Map(cards.map((card) => [card.id, getCardCounter(card.id, demo, urgentMailCount, replyMailCount)])),
    [cards, demo, urgentMailCount, replyMailCount],
  );
  const user = settings.users.find((item) => item.active) ?? settings.users[0];

  const machineDowntimeEntries = useMemo(() => buildMachineDowntimeEntries(demo), [demo]);
  const weeklyOccupancy = useMemo(() => buildWeeklyMachineOccupancy(demo), [demo]);
  const departmentLoad = useMemo(() => buildDepartmentLoad(demo), [demo]);
  const workOrderTotals = useMemo(() => buildWorkOrderTrackingTotals(demo), [demo]);
  const upcomingWorkOrders = useMemo(() => buildUpcomingWorkOrders(demo), [demo]);

  return <div className="mx-auto max-w-7xl">
    <section aria-labelledby="workspace-quick-launch" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
      <h2 id="workspace-quick-launch" className="sr-only">Accueil et accès rapide</h2>
      <WorkspaceWelcomeBanner firstName={user?.firstName ?? "Daniel"} date={date} />
      {cards.map((card) => <WorkspaceCard key={card.id} card={card} counter={cardCounters.get(card.id)} />)}
    </section>

    <section aria-label="Indicateurs de production" className="mt-4 grid gap-4 lg:grid-cols-3">
      <MachineDowntimeWidget entries={machineDowntimeEntries} />
      <OccupancyChartWidget title="Taux d’occupation machines" data={weeklyOccupancy} color="var(--app-information)" />
      <WorkOrderTrackingWidget totals={workOrderTotals} />
    </section>

    <section aria-label="Agenda et planification" className="mt-4 grid gap-4 lg:grid-cols-3">
      <TodayAgendaCard events={todayEvents} />
      <DepartmentLoadWidget data={departmentLoad} />
      <UpcomingWorkOrdersWidget orders={upcomingWorkOrders} />
    </section>

    <AssistantPanel todayEvents={todayEvents} />
  </div>;
}

function getCardCounter(id: string, demo: ReturnType<typeof useDemoData>, urgentMailCount: number, replyMailCount: number): number {
  if (id === "mails") return urgentMailCount + replyMailCount;
  if (id === "open-actions") return demo.actions.filter((item) => item.statut !== "Fait").length;
  if (id === "planning") return demo.planning.filter((item) => item.status === "Bloquée").length + demo.machines.filter((item) => item.status === "En panne").length;
  if (id === "qrqc") return demo.meetings.filter((item) => item.type === "QRQC" && item.status !== "Clôturée").length;
  if (id === "production-meeting") return demo.meetings.filter((item) => item.type === "Production" && item.status !== "Clôturée").length;
  if (id === "machines") return demo.machines.filter((item) => item.status === "En panne" || item.status === "Maintenance prévue").length;
  if (id === "requests") return demo.requests.filter((item) => item.status !== "Terminée" && item.status !== "Refusée").length;
  if (id === "erp-quality") return demo.erpQuality.filter((item) => item.status !== "Résolue").length;
  return 0;
}
