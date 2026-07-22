import "server-only";

import { google, type calendar_v3 } from "googleapis";
import {
  disconnectGoogleCalendarAccount,
  getAuthorizedGoogleCalendarClient,
  testGoogleCalendarConnection,
} from "@/features/calendar/server/google/google-calendar-auth";
import { getGoogleCalendarTokenKey } from "@/features/calendar/server/google/google-calendar-account-key";
import { getGoogleCalendarConfigurationStatus } from "@/features/calendar/server/google/google-calendar-config";
import { googleCalendarTokenRepository } from "@/features/calendar/server/google/local-google-calendar-token-repository";
import type { CalendarProvider } from "@/features/calendar/services/calendar-provider";
import type {
  CalendarAccount,
  CalendarConnectionStatus,
  CalendarEvent,
  CreateCalendarEventInput,
} from "@/features/calendar/types/calendar";

export class GoogleCalendarProvider implements CalendarProvider {
  readonly type = "google" as const;
  readonly name = "Google Calendar";
  readonly isAvailable = true;
  readonly isMock = false;

  constructor(private readonly account: CalendarAccount) {}

  async getConnectionStatus(): Promise<CalendarConnectionStatus> {
    const record = await googleCalendarTokenRepository.get(this.key);
    const configuration = getGoogleCalendarConfigurationStatus();
    if (!configuration.isValid) {
      return { provider: this.type, state: "error", emailAddress: record?.emailAddress ?? this.account.emailAddress, connectedAt: record?.connectedAt ?? this.account.connectedAt, error: configuration.error };
    }
    if (!record) {
      return { provider: this.type, state: "disconnected", emailAddress: this.account.emailAddress, connectedAt: this.account.connectedAt, error: "Aucun jeton serveur n’est associé à ce compte." };
    }
    return { provider: this.type, state: record.lastError ? "error" : "connected", emailAddress: record.emailAddress, connectedAt: record.connectedAt, error: record.lastError };
  }

  async testConnection(): Promise<CalendarConnectionStatus> {
    const result = await testGoogleCalendarConnection(this.key);
    return { provider: this.type, state: "connected", emailAddress: result.emailAddress, connectedAt: this.account.connectedAt, error: null };
  }

  async disconnect(): Promise<void> {
    await disconnectGoogleCalendarAccount(this.key);
  }

  async listEventsBetween(startIso: string, endIso: string): Promise<CalendarEvent[]> {
    return this.withCalendar(async (calendar) => {
      const result = await calendar.events.list({
        calendarId: "primary",
        timeMin: startIso,
        timeMax: endIso,
        singleEvents: true,
        orderBy: "startTime",
        maxResults: 100,
      });
      await googleCalendarTokenRepository.updateSynchronization(this.key, new Date().toISOString());
      return (result.data.items ?? []).map((item) => this.toCalendarEvent(item));
    });
  }

  async createEvent(input: CreateCalendarEventInput): Promise<CalendarEvent> {
    return this.withCalendar(async (calendar) => {
      const result = await calendar.events.insert({
        calendarId: "primary",
        requestBody: {
          summary: input.title,
          description: input.description,
          location: input.location,
          start: { dateTime: input.start },
          end: { dateTime: input.end },
          attendees: input.attendees?.map((attendee) => ({ email: attendee.email, displayName: attendee.name })),
        },
      });
      return this.toCalendarEvent(result.data);
    });
  }

  private toCalendarEvent(item: calendar_v3.Schema$Event): CalendarEvent {
    return {
      id: item.id ?? "",
      calendarAccountId: this.account.id,
      title: item.summary ?? "(Sans titre)",
      description: item.description ?? null,
      location: item.location ?? null,
      start: item.start?.dateTime ?? (item.start?.date ? `${item.start.date}T00:00:00.000Z` : ""),
      end: item.end?.dateTime ?? (item.end?.date ? `${item.end.date}T23:59:59.000Z` : ""),
      attendees: (item.attendees ?? []).flatMap((attendee) => attendee.email ? [{ email: attendee.email, name: attendee.displayName ?? undefined }] : []),
      htmlLink: item.htmlLink ?? null,
      status: item.status === "tentative" || item.status === "cancelled" ? item.status : "confirmed",
    };
  }

  private get key() {
    return getGoogleCalendarTokenKey(this.account.id);
  }

  private async withCalendar<T>(operation: (calendar: calendar_v3.Calendar) => Promise<T>): Promise<T> {
    const record = await googleCalendarTokenRepository.get(this.key);
    if (!record) throw new Error("Google Calendrier n’est pas connecté pour ce compte.");
    try {
      const auth = await getAuthorizedGoogleCalendarClient(this.key);
      const result = await operation(google.calendar({ version: "v3", auth: auth as never, fetchImplementation: globalThis.fetch, cache: "no-store" } as never));
      await googleCalendarTokenRepository.updateError(this.key, null);
      return result;
    } catch (error) {
      const status = getGoogleCalendarHttpStatus(error);
      const message = status === 401
        ? "La session Google a expiré ou a été révoquée. Reconnectez ce compte."
        : status === 403
          ? "Google refuse l’accès au calendrier. Vérifiez les autorisations accordées."
          : error instanceof Error && error.message.includes("expiré")
            ? error.message
            : "La communication avec Google Calendrier a échoué. Réessayez dans quelques instants.";
      await googleCalendarTokenRepository.updateError(this.key, message);
      throw new Error(message);
    }
  }
}

function getGoogleCalendarHttpStatus(error: unknown): number | null {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = (error as { code?: unknown }).code;
    return typeof code === "number" ? code : null;
  }
  return null;
}
