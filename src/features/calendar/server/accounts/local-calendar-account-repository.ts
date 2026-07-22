import "server-only";

import { randomUUID } from "node:crypto";
import path from "node:path";
import {
  createDefaultDemoCalendarAccount,
  createDefaultStoredCalendarAccounts,
  normalizeStoredCalendarAccounts,
  parseStoredCalendarAccounts,
  type StoredCalendarAccounts,
} from "@/features/calendar/server/accounts/local-calendar-account-storage";
import type {
  CalendarAccountRepository,
  ConnectGoogleCalendarAccountInput,
  CreateCalendarAccountInput,
} from "@/features/calendar/server/accounts/calendar-account-repository";
import { SerializedAtomicJsonFile } from "@/features/mail/server/accounts/serialized-atomic-json-file";
import type { CalendarAccount } from "@/features/calendar/types/calendar";

const STORAGE_FILE = path.join(process.cwd(), ".local-data", "calendar-accounts.json");

export class LocalCalendarAccountRepository implements CalendarAccountRepository {
  private readonly storage = new SerializedAtomicJsonFile<StoredCalendarAccounts>({
    storageFile: STORAGE_FILE,
    parse: parseStoredCalendarAccounts,
    createDefault: createDefaultStoredCalendarAccounts,
    normalize: normalizeStoredCalendarAccounts,
    readErrorMessage: "Le registre local des comptes Calendrier est illisible.",
    beforeReplace: async () => {
      if (process.env.NODE_ENV === "production") throw new Error("Le registre local des comptes est désactivé en production.");
    },
  });

  async list(): Promise<CalendarAccount[]> {
    return structuredClone((await this.storage.read()).accounts);
  }

  async get(accountId: string): Promise<CalendarAccount | null> {
    const stored = await this.storage.read();
    return structuredClone(stored.accounts.find((account) => account.id === accountId) ?? null);
  }

  async getActive(): Promise<CalendarAccount> {
    const stored = await this.storage.read();
    return structuredClone(stored.accounts.find((account) => account.isActive) ?? stored.accounts[0]);
  }

  async add(input: CreateCalendarAccountInput): Promise<CalendarAccount> {
    return this.storage.update((stored) => {
      const account: CalendarAccount = {
        id: `calendar-account-${randomUUID()}`,
        provider: input.provider,
        emailAddress: input.emailAddress,
        displayName: input.displayName,
        mode: "demo",
        status: "connected",
        connectedAt: new Date().toISOString(),
        lastSuccessfulSyncAt: null,
        isActive: stored.accounts.length === 0,
        error: null,
      };
      stored.accounts.push(account);
      return { value: stored, result: structuredClone(account) };
    });
  }

  async connectGoogle(input: ConnectGoogleCalendarAccountInput): Promise<CalendarAccount> {
    return this.storage.update((stored) => {
      const existingIndex = stored.accounts.findIndex((account) => account.id === input.accountId);
      const existing = existingIndex >= 0 ? stored.accounts[existingIndex] : null;
      if (existing && existing.provider !== "google") throw new Error("Le compte ciblé n’est pas un compte Google Calendrier.");
      const account: CalendarAccount = {
        id: input.accountId,
        provider: "google",
        emailAddress: input.emailAddress,
        displayName: existing?.displayName ?? `Google — ${input.emailAddress}`,
        mode: "oauth",
        status: "connected",
        connectedAt: input.connectedAt,
        lastSuccessfulSyncAt: existing?.lastSuccessfulSyncAt ?? null,
        isActive: true,
        error: null,
      };
      stored.accounts = stored.accounts.map((item) => ({ ...item, isActive: false }));
      if (existingIndex >= 0) stored.accounts[existingIndex] = account;
      else stored.accounts.push(account);
      return { value: stored, result: structuredClone(account) };
    });
  }

  async activate(accountId: string): Promise<CalendarAccount> {
    return this.storage.update((stored) => {
      const target = stored.accounts.find((account) => account.id === accountId);
      if (!target) throw new Error("Le compte Calendrier est introuvable.");
      stored.accounts = stored.accounts.map((account) => ({ ...account, isActive: account.id === accountId }));
      return { value: stored, result: structuredClone(stored.accounts.find((account) => account.id === accountId)!) };
    });
  }

  async markConnectionTest(accountId: string, testedAt: string): Promise<CalendarAccount> {
    return this.updateAccount(accountId, (account) => ({ ...account, status: "connected", error: null, lastSuccessfulSyncAt: account.lastSuccessfulSyncAt ?? testedAt }));
  }

  async markSynchronization(accountId: string, synchronizedAt: string): Promise<CalendarAccount> {
    return this.updateAccount(accountId, (account) => ({ ...account, status: "connected", lastSuccessfulSyncAt: synchronizedAt, error: null }));
  }

  async markConnectionError(accountId: string, message: string): Promise<CalendarAccount> {
    return this.updateAccount(accountId, (account) => ({ ...account, status: "error", error: message }));
  }

  async delete(accountId: string): Promise<void> {
    await this.storage.update((stored) => {
      const deleted = stored.accounts.find((account) => account.id === accountId);
      if (!deleted) throw new Error("Le compte Calendrier est introuvable.");
      stored.accounts = stored.accounts.filter((account) => account.id !== accountId);
      if (stored.accounts.length === 0) stored.accounts = [createDefaultDemoCalendarAccount()];
      if (deleted.isActive) stored.accounts = stored.accounts.map((account, index) => ({ ...account, isActive: index === 0 }));
      return { value: stored, result: undefined };
    });
  }

  private updateAccount(accountId: string, updater: (account: CalendarAccount) => CalendarAccount): Promise<CalendarAccount> {
    return this.storage.update((stored) => {
      const index = stored.accounts.findIndex((account) => account.id === accountId);
      if (index < 0) throw new Error("Le compte Calendrier est introuvable.");
      stored.accounts[index] = updater(stored.accounts[index]);
      return { value: stored, result: structuredClone(stored.accounts[index]) };
    });
  }
}

export const calendarAccountRepository: CalendarAccountRepository = new LocalCalendarAccountRepository();
