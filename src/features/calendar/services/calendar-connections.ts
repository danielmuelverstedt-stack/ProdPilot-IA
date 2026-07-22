import "server-only";

import { getCalendarProviderForAccount } from "@/features/calendar/providers/provider-factory";
import { calendarAccountRepository } from "@/features/calendar/server/accounts/local-calendar-account-repository";
import type { CreateCalendarAccountInput } from "@/features/calendar/server/accounts/calendar-account-repository";
import type { CalendarAccount } from "@/features/calendar/types/calendar";

export async function getCalendarAccounts(): Promise<CalendarAccount[]> {
  const accounts = await calendarAccountRepository.list();
  return Promise.all(accounts.map(async (account) => {
    if (account.mode === "demo") return account;
    try {
      const connection = await getCalendarProviderForAccount(account).getConnectionStatus();
      return { ...account, status: connection.state, emailAddress: connection.emailAddress ?? account.emailAddress, connectedAt: connection.connectedAt ?? account.connectedAt, error: connection.error ?? null };
    } catch {
      return { ...account, status: "error" as const, error: "L’état de la connexion n’a pas pu être vérifié." };
    }
  }));
}

export async function addCalendarAccount(input: CreateCalendarAccountInput): Promise<CalendarAccount> {
  return calendarAccountRepository.add({ provider: input.provider, emailAddress: normalizeEmail(input.emailAddress), displayName: normalizeDisplayName(input.displayName) });
}

export async function activateCalendarAccount(accountId: string): Promise<CalendarAccount> {
  return calendarAccountRepository.activate(accountId);
}

export async function testCalendarAccount(accountId: string): Promise<CalendarAccount> {
  const account = await getRequiredAccount(accountId);
  const provider = getCalendarProviderForAccount(account);
  try {
    const status = await provider.testConnection();
    if (status.state !== "connected") throw new Error(status.error ?? "La connexion de ce compte n’est pas disponible.");
    return calendarAccountRepository.markConnectionTest(accountId, new Date().toISOString());
  } catch (error) {
    const message = error instanceof Error ? error.message : "Le test de connexion a échoué.";
    await calendarAccountRepository.markConnectionError(accountId, message);
    throw new Error(message);
  }
}

export async function disconnectCalendarAccount(accountId: string): Promise<void> {
  const account = await getRequiredAccount(accountId);
  await getCalendarProviderForAccount(account).disconnect();
  await calendarAccountRepository.delete(accountId);
}

export async function getGoogleCalendarAccountForOAuth(accountId: string): Promise<CalendarAccount> {
  const account = await getRequiredAccount(accountId);
  if (account.provider !== "google") throw new Error("Le compte ciblé n’est pas un compte Google Calendrier.");
  return account;
}

export async function connectGoogleCalendarAccount(input: { accountId: string; emailAddress: string; connectedAt: string }): Promise<CalendarAccount> {
  return calendarAccountRepository.connectGoogle(input);
}

async function getRequiredAccount(accountId: string): Promise<CalendarAccount> {
  if (!/^[-a-zA-Z0-9]{1,100}$/.test(accountId)) throw new Error("L’identifiant du compte Calendrier est invalide.");
  const account = await calendarAccountRepository.get(accountId);
  if (!account) throw new Error("Le compte Calendrier est introuvable.");
  return account;
}

function normalizeDisplayName(value: string): string {
  const displayName = value.trim();
  if (!displayName || displayName.length > 80) throw new Error("Le nom du compte doit contenir entre 1 et 80 caractères.");
  return displayName;
}

function normalizeEmail(value: string): string {
  const emailAddress = value.trim().toLowerCase();
  if (emailAddress.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailAddress)) throw new Error("L’adresse e-mail du compte est invalide.");
  return emailAddress;
}
