import "server-only";

import { listActiveCalendarEventsBetween } from "@/features/calendar/services/calendar-account-context";
import type { CalendarEvent } from "@/features/calendar/types/calendar";

/** Bornes du jour courant en heure de Bruxelles (hiver/été correctement gérés), exprimées avec leur décalage UTC réel. */
function todayBoundsInBrussels(): { startIso: string; endIso: string } {
  const now = new Date();
  const dateParts = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Brussels", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const dateKey = `${dateParts.find((part) => part.type === "year")?.value}-${dateParts.find((part) => part.type === "month")?.value}-${dateParts.find((part) => part.type === "day")?.value}`;
  const offsetPart = new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Brussels", timeZoneName: "longOffset" }).formatToParts(now).find((part) => part.type === "timeZoneName")?.value ?? "GMT+02:00";
  const offset = offsetPart.replace("GMT", "") || "+02:00";
  return { startIso: `${dateKey}T00:00:00${offset}`, endIso: `${dateKey}T23:59:59${offset}` };
}

export async function getCalendarWorkspaceEventsForToday(): Promise<CalendarEvent[]> {
  try {
    const { startIso, endIso } = todayBoundsInBrussels();
    const { events } = await listActiveCalendarEventsBetween(startIso, endIso);
    return events.sort((first, second) => new Date(first.start).getTime() - new Date(second.start).getTime());
  } catch {
    return [];
  }
}
