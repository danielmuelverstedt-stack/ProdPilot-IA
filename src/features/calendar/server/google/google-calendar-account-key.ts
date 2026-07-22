import "server-only";

import { getCurrentCalendarOwnerContext } from "@/features/calendar/server/accounts/calendar-owner-context";
import type { GoogleCalendarTokenKey } from "@/features/calendar/server/google/google-calendar-token-repository";

export function getGoogleCalendarTokenKey(accountId: string): GoogleCalendarTokenKey {
  const owner = getCurrentCalendarOwnerContext();
  return { ...owner, accountId, provider: "google-calendar" };
}
