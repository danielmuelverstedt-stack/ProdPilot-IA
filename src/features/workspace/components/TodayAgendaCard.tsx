import type { CalendarEvent } from "@/features/calendar/types/calendar";
import { WidgetCard, WidgetFooterLink } from "@/features/workspace/components/DashboardWidgets";

const timeFormatter = new Intl.DateTimeFormat("fr-BE", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Brussels" });

export function TodayAgendaCard({ events }: { events: CalendarEvent[] }) {
  return <WidgetCard title="Votre agenda du jour" icon="calendar" iconColor="var(--app-information)" footer={<WidgetFooterLink href="/reglages/connexions/calendrier">Gérer la connexion</WidgetFooterLink>}>
    {events.length ? <ul className="space-y-2">{events.map((event) => <li key={event.id} className="flex items-start gap-3 rounded-xl border border-[var(--app-border)] p-3">
      <time className="w-14 shrink-0 text-sm font-semibold text-[var(--app-primary)]">{timeFormatter.format(new Date(event.start))}</time>
      <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-[var(--app-text)]">{event.title}</p><p className="mt-0.5 truncate text-xs text-slate-500">{[event.location, event.attendees.length ? `${event.attendees.length} participant${event.attendees.length > 1 ? "s" : ""}` : null].filter(Boolean).join(" · ") || "Aucun détail supplémentaire"}</p></div>
      {event.htmlLink ? <a href={event.htmlLink} target="_blank" rel="noreferrer" className="shrink-0 text-xs font-semibold text-[var(--app-primary)] hover:underline">Ouvrir</a> : null}
    </li>)}</ul> : <p className="text-sm text-slate-500">Aucun événement aujourd’hui. Connectez votre agenda Google Calendar pour voir vos réunions réelles ici.</p>}
  </WidgetCard>;
}
