import type { CalendarProviderType } from "@/features/calendar/types/calendar";

export interface CalendarProviderDefinition {
  type: CalendarProviderType;
  label: string;
  description: string;
}

export const CALENDAR_PROVIDER_CATALOG: Record<CalendarProviderType, CalendarProviderDefinition> = {
  google: { type: "google", label: "Google Calendar", description: "Agenda réel via une connexion OAuth sécurisée côté serveur." },
  mock: { type: "mock", label: "Compte de démonstration", description: "Événements locaux sans connexion à un service externe." },
};

export function getCalendarProviderDefinition(type: CalendarProviderType): CalendarProviderDefinition {
  return CALENDAR_PROVIDER_CATALOG[type];
}

export function getCalendarProviderReconnectHref(type: CalendarProviderType, accountId: string): string | null {
  return type === "google" ? `/api/auth/google-calendar?accountId=${encodeURIComponent(accountId)}` : null;
}
