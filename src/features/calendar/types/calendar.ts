export const CALENDAR_PROVIDER_TYPES = ["google", "mock"] as const;
export type CalendarProviderType = (typeof CALENDAR_PROVIDER_TYPES)[number];

export type CalendarAccountMode = "demo" | "oauth";

export type CalendarConnectionState = "connected" | "disconnected" | "unavailable" | "error";

export interface CalendarAccount {
  id: string;
  provider: CalendarProviderType;
  emailAddress: string;
  displayName: string;
  mode: CalendarAccountMode;
  status: CalendarConnectionState;
  connectedAt: string | null;
  lastSuccessfulSyncAt: string | null;
  isActive: boolean;
  error: string | null;
}

export interface CalendarEventAttendee {
  email: string;
  name?: string;
}

export interface CalendarEvent {
  id: string;
  calendarAccountId: string;
  title: string;
  description: string | null;
  location: string | null;
  start: string;
  end: string;
  attendees: CalendarEventAttendee[];
  htmlLink: string | null;
  status: "confirmed" | "tentative" | "cancelled";
}

export interface CreateCalendarEventInput {
  title: string;
  description?: string;
  location?: string;
  start: string;
  end: string;
  attendees?: CalendarEventAttendee[];
}

export interface CalendarConnectionStatus {
  provider: CalendarProviderType;
  state: CalendarConnectionState;
  emailAddress: string | null;
  connectedAt: string | null;
  error?: string | null;
}

export function isCalendarProviderType(value: unknown): value is CalendarProviderType {
  return typeof value === "string" && (CALENDAR_PROVIDER_TYPES as readonly string[]).includes(value);
}
