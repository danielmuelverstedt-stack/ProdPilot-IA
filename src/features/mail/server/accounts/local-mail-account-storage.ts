import "server-only";

import { createDefaultMailAccountSettings, migrateMailAccountSettings } from "@/features/mail/config/mail-account-defaults";
import { isMailProviderType, type MailAccount } from "@/features/mail/types/mail";

export const MAIL_ACCOUNT_STORAGE_VERSION = 3;

export interface StoredMailAccounts {
  version: number;
  accounts: MailAccount[];
}

export function createDefaultStoredMailAccounts(): StoredMailAccounts {
  return normalizeStoredMailAccounts({
    version: MAIL_ACCOUNT_STORAGE_VERSION,
    accounts: [
      createDefaultDemoAccount(),
      createDemoAccount("google-demo", "google", "Google Production", "production@google.example"),
      createDemoAccount("microsoft-demo", "microsoft", "Microsoft Planification", "planning@microsoft.example"),
    ],
  });
}

export function createDefaultDemoAccount(): MailAccount {
  return { ...createDemoAccount("mock-demo", "mock", "Boîte de démonstration", "production@demo.example"), isActive: true };
}

export function normalizeStoredMailAccounts(value: StoredMailAccounts): StoredMailAccounts {
  const accounts = value.accounts.length ? value.accounts : [createDefaultDemoAccount()];
  const activeIndex = accounts.findIndex((account) => account.isActive);
  return {
    version: MAIL_ACCOUNT_STORAGE_VERSION,
    accounts: accounts.map((account, index) => ({ ...account, isActive: index === (activeIndex >= 0 ? activeIndex : 0) })),
  };
}

export function parseStoredMailAccounts(value: unknown): StoredMailAccounts | null {
  if (!isRecord(value) || !Array.isArray(value.accounts)) return null;
  const accounts = value.accounts.map(parseMailAccount);
  if (accounts.some((account) => account === null)) return null;
  return normalizeStoredMailAccounts({
    version: MAIL_ACCOUNT_STORAGE_VERSION,
    accounts: accounts.filter((account): account is MailAccount => account !== null),
  });
}

function createDemoAccount(id: string, provider: MailAccount["provider"], displayName: string, emailAddress: string): MailAccount {
  return {
    id, provider, emailAddress, displayName, mode: "demo", status: "connected",
    connectedAt: "2026-07-13T08:00:00.000Z", lastSuccessfulSyncAt: "2026-07-13T08:00:00.000Z",
    lastConnectionTestAt: null, isActive: false, error: null, organizationId: null,
    settings: createDefaultMailAccountSettings(),
  };
}

function parseMailAccount(value: unknown): MailAccount | null {
  if (!isRecord(value)
    || typeof value.id !== "string"
    || !isMailProviderType(value.provider)
    || typeof value.emailAddress !== "string"
    || typeof value.displayName !== "string"
    || (value.mode !== "demo" && value.mode !== "oauth")
    || !["connected", "disconnected", "unavailable", "error"].includes(String(value.status))
    || !isNullableString(value.connectedAt)
    || !isNullableString(value.lastSuccessfulSyncAt)
    || !isNullableString(value.lastConnectionTestAt)
    || typeof value.isActive !== "boolean"
    || !isNullableString(value.error)
    || !(value.organizationId === undefined || isNullableString(value.organizationId))) return null;
  const settings = value.settings === undefined ? createDefaultMailAccountSettings() : migrateMailAccountSettings(value.settings);
  if (!settings) return null;
  return {
    id: value.id, provider: value.provider, emailAddress: value.emailAddress, displayName: value.displayName,
    mode: value.mode, status: value.status as MailAccount["status"], connectedAt: value.connectedAt,
    lastSuccessfulSyncAt: value.lastSuccessfulSyncAt, lastConnectionTestAt: value.lastConnectionTestAt,
    isActive: value.isActive, error: value.error, organizationId: value.organizationId ?? null, settings,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}
