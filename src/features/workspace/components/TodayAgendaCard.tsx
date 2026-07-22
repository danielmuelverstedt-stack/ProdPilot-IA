import Link from "next/link";
import type { CalendarEvent } from "@/features/calendar/types/calendar";

const timeFormatter = new Intl.DateTimeFormat("fr-BE", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Brussels" });

export function TodayAgendaCard({ events }: { events: CalendarEvent[] }) {
  return <section aria-labelledby="today-agenda-title" className="mt-6 rounded-2xl border border-[var(--app-border)] bg-[var(--app-card)] p-5 shadow-[var(--app-shadow-sm)]">
    <div className="flex items-center justify-between"><h2 id="today-agenda-title" className="text-lg font-semibold text-[var(--app-text)]">Votre agenda du jour</h2><Link href="/reglages/connexions/calendrier" className="text-xs font-semibold text-[var(--app-primary)] hover:underline">Gérer la connexion</Link></div>
    {events.length ? <ul className="mt-4 space-y-2">{events.map((event) => <li key={event.id} className="flex items-start gap-4 rounded-xl border border-[var(--app-border)] p-3">
      <time className="w-16 shrink-0 text-sm font-semibold text-[var(--app-primary)]">{timeFormatter.format(new Date(event.start))}</time>
      <div className="min-w-0 flex-1"><p className="truncate font-medium text-[var(--app-text)]">{event.title}</p><p className="mt-0.5 text-xs text-slate-500">{[event.location, event.attendees.length ? `${event.attendees.length} participant${event.attendees.length > 1 ? "s" : ""}` : null].filter(Boolean).join(" · ") || "Aucun détail supplémentaire"}</p></div>
      {event.htmlLink ? <a href={event.htmlLink} target="_blank" rel="noreferrer" className="shrink-0 text-xs font-semibold text-[var(--app-primary)] hover:underline">Ouvrir</a> : null}
    </li>)}</ul> : <p className="mt-3 text-sm text-slate-500">Aucun événement aujourd’hui. Connectez votre agenda Google Calendar pour voir vos réunions réelles ici.</p>}
  </section>;
}
