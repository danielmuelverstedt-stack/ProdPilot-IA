import "server-only";

import { isCalendarProviderType, type CalendarAccount } from "@/features/calendar/types/calendar";

export const CALENDAR_ACCOUNT_STORAGE_VERSION = 1;

export interface StoredCalendarAccounts {
  version: number;
  accounts: CalendarAccount[];
}

export function createDefaultStoredCalendarAccounts(): StoredCalendarAccounts {
  return normalizeStoredCalendarAccounts({ version: CALENDAR_ACCOUNT_STORAGE_VERSION, accounts: [createDefaultDemoCalendarAccount()] });
}

export function createDefaultDemoCalendarAccount(): CalendarAccount {
  return {
    id: "calendar-mock-demo",
    provider: "mock",
    emailAddress: "production@demo.example",
    displayName: "Calendrier de démonstration",
    mode: "demo",
    status: "connected",
    connectedAt: "2026-07-13T08:00:00.000Z",
    lastSuccessfulSyncAt: "2026-07-13T08:00:00.000Z",
    isActive: true,
    error: null,
  };
}

export function normalizeStoredCalendarAccounts(value: StoredCalendarAccounts): StoredCalendarAccounts {
  const accounts = value.accounts.length ? value.accounts : [createDefaultDemoCalendarAccount()];
  const activeIndex = accounts.findIndex((account) => account.isActive);
  return {
    version: CALENDAR_ACCOUNT_STORAGE_VERSION,
    accounts: accounts.map((account, index) => ({ ...account, isActive: index === (activeIndex >= 0 ? activeIndex : 0) })),
  };
}

export function parseStoredCalendarAccounts(value: unknown): StoredCalendarAccounts | null {
  if (!isRecord(value) || !Array.isArray(value.accounts)) return null;
  const accounts = value.accounts.map(parseCalendarAccount);
  if (accounts.some((account) => account === null)) return null;
  return normalizeStoredCalendarAccounts({
    version: CALENDAR_ACCOUNT_STORAGE_VERSION,
    accounts: accounts.filter((account): account is CalendarAccount => account !== null),
  });
}

function parseCalendarAccount(value: unknown): CalendarAccount | null {
  if (!isRecord(value)
    || typeof value.id !== "string"
    || !isCalendarProviderType(value.provider)
    || typeof value.emailAddress !== "string"
    || typeof value.displayName !== "string"
    || (value.mode !== "demo" && value.mode !== "oauth")
    || !["connected", "disconnected", "unavailable", "error"].includes(String(value.status))
    || !isNullableString(value.connectedAt)
    || !isNullableString(value.lastSuccessfulSyncAt)
    || typeof value.isActive !== "boolean"
    || !isNullableString(value.error)) return null;
  return {
    id: value.id, provider: value.provider, emailAddress: value.emailAddress, displayName: value.displayName,
    mode: value.mode, status: value.status as CalendarAccount["status"], connectedAt: value.connectedAt,
    lastSuccessfulSyncAt: value.lastSuccessfulSyncAt, isActive: value.isActive, error: value.error,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}
