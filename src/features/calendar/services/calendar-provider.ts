import type {
  CalendarConnectionStatus,
  CalendarEvent,
  CalendarProviderType,
  CreateCalendarEventInput,
} from "@/features/calendar/types/calendar";

export interface CalendarProvider {
  readonly type: CalendarProviderType;
  readonly name: string;
  readonly isAvailable: boolean;
  readonly isMock: boolean;

  getConnectionStatus(): Promise<CalendarConnectionStatus>;
  testConnection(): Promise<CalendarConnectionStatus>;
  disconnect(): Promise<void>;
  listEventsBetween(startIso: string, endIso: string): Promise<CalendarEvent[]>;
  createEvent(input: CreateCalendarEventInput): Promise<CalendarEvent>;
}
