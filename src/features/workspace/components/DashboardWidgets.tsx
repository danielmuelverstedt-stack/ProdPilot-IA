import Link from "next/link";
import type { ReactNode } from "react";
import { AppIcon } from "@/components/ui/AppIcon";
import { MiniBarChart, type ChartBar } from "@/components/ui/MiniBarChart";
import { MiniAreaChart, type ChartPoint } from "@/components/ui/MiniAreaChart";
import { formatEuropeanDate, StatusPill } from "@/components/ui/ModuleUi";
import type { MachineDowntimeEntry, WorkOrderTrackingTotals } from "@/features/workspace/services/workspace-dashboard-metrics";
import type { WorkOrder } from "@/features/demo/types/demo";

export function WidgetCard({ title, icon, iconColor, footer, children }: { title: string; icon: string; iconColor: string; footer?: ReactNode; children: ReactNode }) {
  return <section className="flex flex-col rounded-2xl border border-[var(--app-border)] bg-[var(--app-card)] p-5 shadow-[var(--app-shadow-sm)]">
    <div className="flex items-center gap-2"><span className="grid size-8 shrink-0 place-items-center rounded-lg" style={{ backgroundColor: `color-mix(in srgb, ${iconColor} 14%, white)`, color: iconColor }}><AppIcon name={icon} className="size-4" /></span><h3 className="text-sm font-semibold text-[var(--app-text)]">{title}</h3></div>
    <div className="mt-4 flex-1">{children}</div>
    {footer ? <div className="mt-4 border-t border-[var(--app-border)] pt-3">{footer}</div> : null}
  </section>;
}

export function WidgetFooterLink({ href, children }: { href: string; children: ReactNode }) {
  return <Link href={href} className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--app-primary)] hover:underline">{children} <AppIcon name="arrow" className="size-3.5" /></Link>;
}

export function MachineDowntimeWidget({ entries }: { entries: MachineDowntimeEntry[] }) {
  return <WidgetCard title="Indisponibilités machines" icon="wrench" iconColor="var(--app-warning)" footer={<WidgetFooterLink href="/machines/maintenance">Voir toutes les indisponibilités</WidgetFooterLink>}>
    {entries.length ? <ul className="space-y-2">{entries.map(({ machine, event }) => <li key={machine.id} className="flex items-center justify-between gap-3 rounded-xl border border-[var(--app-border)] px-3 py-2">
      <div className="flex min-w-0 items-center gap-2"><AppIcon name={machine.status === "En panne" ? "alert" : "wrench"} className={`size-4 shrink-0 ${machine.status === "En panne" ? "text-[var(--app-danger)]" : "text-[var(--app-warning)]"}`} /><Link href={`/machines/${machine.id}`} className="truncate text-sm font-medium text-[var(--app-text)] hover:underline">{machine.displayName}</Link></div>
      <div className="shrink-0 text-right"><StatusPill tone={machine.status === "En panne" ? "danger" : "warning"}>{event?.type ?? machine.status}</StatusPill>{event ? <p className="mt-1 text-[11px] text-slate-400">{formatEuropeanDate(event.date)}</p> : null}</div>
    </li>)}</ul> : <p className="text-sm text-slate-500">Aucune machine indisponible actuellement.</p>}
  </WidgetCard>;
}

export function OccupancyChartWidget({ title, data, color = "var(--app-information)" }: { title: string; data: ChartPoint[]; color?: string }) {
  return <WidgetCard title={title} icon="gauge" iconColor={color}>
    <MiniAreaChart data={data} color={color} valueSuffix=" %" />
    <p className="mt-2 text-[11px] text-slate-400">Données de démonstration, calculées sur les opérations planifiées.</p>
  </WidgetCard>;
}

export function DepartmentLoadWidget({ data }: { data: ChartBar[] }) {
  return <WidgetCard title="Charge par département" icon="trend" iconColor="var(--app-success)">
    <MiniBarChart data={data} valueFormatter={(value) => `${value} %`} />
  </WidgetCard>;
}

export function WorkOrderTrackingWidget({ totals }: { totals: WorkOrderTrackingTotals }) {
  return <WidgetCard title="Suivi des OF" icon="chart" iconColor="var(--app-primary)" footer={<WidgetFooterLink href="/of">Voir tous les OF</WidgetFooterLink>}>
    <MiniBarChart data={[
      { label: "Prévu", value: totals.planned, color: "#ca8a04" },
      { label: "Réalisé", value: totals.realized, color: "var(--app-success)" },
    ]} />
  </WidgetCard>;
}

export function UpcomingWorkOrdersWidget({ orders }: { orders: WorkOrder[] }) {
  return <WidgetCard title="OF à planifier" icon="clipboard" iconColor="var(--app-primary)" footer={<WidgetFooterLink href="/of">Voir tous les OF à planifier</WidgetFooterLink>}>
    {orders.length ? <ul className="space-y-3">{orders.map((order) => <li key={order.id}><Link href={`/of/${order.id}`} className="flex items-start justify-between gap-3 hover:underline">
      <span className="min-w-0"><span className="block truncate text-sm font-semibold text-[var(--app-text)]">{order.article} <span className="font-normal text-slate-400">— Qté : {order.quantity.toLocaleString("fr-BE")}</span></span><span className="text-xs text-slate-500">Échéance {formatEuropeanDate(order.dueDate)}</span></span>
      <StatusPill tone={order.priority === "Urgente" || order.priority === "Bloquante" ? "danger" : order.priority === "Haute" ? "warning" : "neutral"}>{order.priority}</StatusPill>
    </Link></li>)}</ul> : <p className="text-sm text-slate-500">Aucun OF en attente de planification.</p>}
  </WidgetCard>;
}
