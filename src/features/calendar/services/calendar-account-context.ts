import "server-only";

import { getCalendarProviderForAccount } from "@/features/calendar/providers/provider-factory";
import { calendarAccountRepository } from "@/features/calendar/server/accounts/local-calendar-account-repository";

/** Point d'entrée unique pour le Calendrier et les futures fonctions IA liées aux réunions. */
export async function getActiveCalendarContext() {
  const account = await calendarAccountRepository.getActive();
  return { account, provider: getCalendarProviderForAccount(account) };
}

export async function listActiveCalendarEventsBetween(startIso: string, endIso: string) {
  const { account, provider } = await getActiveCalendarContext();
  if (account.status !== "connected") return { account, events: [] };
  try {
    const events = await provider.listEventsBetween(startIso, endIso);
    await calendarAccountRepository.markSynchronization(account.id, new Date().toISOString());
    return { account, events };
  } catch (error) {
    const message = error instanceof Error ? error.message : "La lecture du calendrier a échoué.";
    await calendarAccountRepository.markConnectionError(account.id, message);
    throw error;
  }
}
