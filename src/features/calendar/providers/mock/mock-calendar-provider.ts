import "server-only";

import { randomUUID } from "node:crypto";
import type { CalendarProvider } from "@/features/calendar/services/calendar-provider";
import type { CalendarAccount, CalendarConnectionStatus, CalendarEvent, CreateCalendarEventInput } from "@/features/calendar/types/calendar";

export class MockCalendarProvider implements CalendarProvider {
  readonly type = "mock" as const;
  readonly name = "Calendrier de démonstration";
  readonly isAvailable = true;
  readonly isMock = true;

  constructor(private readonly account: CalendarAccount) {}

  async getConnectionStatus(): Promise<CalendarConnectionStatus> {
    return { provider: this.type, state: this.account.status, emailAddress: this.account.emailAddress, connectedAt: this.account.connectedAt, error: this.account.error };
  }

  async testConnection(): Promise<CalendarConnectionStatus> {
    return this.getConnectionStatus();
  }

  async disconnect(): Promise<void> {}

  async listEventsBetween(startIso: string, endIso: string): Promise<CalendarEvent[]> {
    return getMockCalendarEvents(this.account.id).filter((event) => event.start >= startIso && event.start <= endIso);
  }

  async createEvent(input: CreateCalendarEventInput): Promise<CalendarEvent> {
    return {
      id: `mock-event-${randomUUID()}`,
      calendarAccountId: this.account.id,
      title: input.title,
      description: input.description ?? null,
      location: input.location ?? null,
      start: input.start,
      end: input.end,
      attendees: input.attendees ?? [],
      htmlLink: null,
      status: "confirmed",
    };
  }
}

function getMockCalendarEvents(accountId: string): CalendarEvent[] {
  const today = new Date().toISOString().slice(0, 10);
  return [
    { id: "mock-event-1", calendarAccountId: accountId, title: "Point qualité hebdomadaire", description: "Revue des non-conformités de la semaine.", location: "Salle Atelier", start: `${today}T08:30:00.000Z`, end: `${today}T09:00:00.000Z`, attendees: [{ email: "qualite@exemple.fr", name: "Julie Qualité" }], htmlLink: null, status: "confirmed" },
    { id: "mock-event-2", calendarAccountId: accountId, title: "Revue de planning client Safran", description: "Point d’avancement OF-240184.", location: null, start: `${today}T14:00:00.000Z`, end: `${today}T14:30:00.000Z`, attendees: [{ email: "planning@exemple.fr", name: "Sophie Planification" }], htmlLink: null, status: "confirmed" },
  ];
}
