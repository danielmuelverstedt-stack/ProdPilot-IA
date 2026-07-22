import "server-only";

import { GoogleCalendarProvider } from "@/features/calendar/providers/google/google-calendar-provider";
import { MockCalendarProvider } from "@/features/calendar/providers/mock/mock-calendar-provider";
import type { CalendarProvider } from "@/features/calendar/services/calendar-provider";
import type { CalendarAccount } from "@/features/calendar/types/calendar";

export function getCalendarProviderForAccount(account: CalendarAccount): CalendarProvider {
  if (account.mode === "demo" || account.provider === "mock") return new MockCalendarProvider(account);
  return new GoogleCalendarProvider(account);
}
