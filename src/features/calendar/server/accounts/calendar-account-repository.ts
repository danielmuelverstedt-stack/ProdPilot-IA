import "server-only";

import type { CalendarAccount, CalendarProviderType } from "@/features/calendar/types/calendar";

export interface CreateCalendarAccountInput {
  provider: CalendarProviderType;
  emailAddress: string;
  displayName: string;
}

export interface ConnectGoogleCalendarAccountInput {
  accountId: string;
  emailAddress: string;
  connectedAt: string;
}

export interface CalendarAccountRepository {
  list(): Promise<CalendarAccount[]>;
  get(accountId: string): Promise<CalendarAccount | null>;
  getActive(): Promise<CalendarAccount>;
  add(input: CreateCalendarAccountInput): Promise<CalendarAccount>;
  connectGoogle(input: ConnectGoogleCalendarAccountInput): Promise<CalendarAccount>;
  activate(accountId: string): Promise<CalendarAccount>;
  markConnectionTest(accountId: string, testedAt: string): Promise<CalendarAccount>;
  markSynchronization(accountId: string, synchronizedAt: string): Promise<CalendarAccount>;
  markConnectionError(accountId: string, message: string): Promise<CalendarAccount>;
  delete(accountId: string): Promise<void>;
}
