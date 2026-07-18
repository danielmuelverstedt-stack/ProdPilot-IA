import "server-only";

import { randomUUID } from "node:crypto";
import path from "node:path";
import { createDefaultMailAccountSettings } from "@/features/mail/config/mail-account-defaults";
import {
  createDefaultDemoAccount,
  createDefaultStoredMailAccounts,
  normalizeStoredMailAccounts,
  parseStoredMailAccounts,
  type StoredMailAccounts,
} from "@/features/mail/server/accounts/local-mail-account-storage";
import type {
  ConnectGoogleAccountInput,
  CreateMailAccountInput,
  MailAccountRepository,
} from "@/features/mail/server/accounts/mail-account-repository";
import { SerializedAtomicJsonFile } from "@/features/mail/server/accounts/serialized-atomic-json-file";
import type { MailAccount } from "@/features/mail/types/mail";

const STORAGE_FILE = path.join(process.cwd(), ".local-data", "mail-accounts.json");

interface LocalMailAccountRepositoryOptions {
  storageFile?: string;
  beforeReplace?: (temporaryFile: string) => Promise<void>;
}

export class LocalMailAccountRepository implements MailAccountRepository {
  private readonly storage: SerializedAtomicJsonFile<StoredMailAccounts>;

  constructor(options: LocalMailAccountRepositoryOptions = {}) {
    this.storage = new SerializedAtomicJsonFile({
      storageFile: options.storageFile ?? STORAGE_FILE,
      parse: parseStoredMailAccounts,
      createDefault: createDefaultStoredMailAccounts,
      normalize: normalizeStoredMailAccounts,
      readErrorMessage: "Le registre local des comptes de messagerie est illisible.",
      beforeReplace: async (temporaryFile) => {
        if (process.env.NODE_ENV === "production") {
          throw new Error("Le registre local des comptes est désactivé en production.");
        }
        await options.beforeReplace?.(temporaryFile);
      },
    });
  }

  async list(): Promise<MailAccount[]> {
    return structuredClone((await this.storage.read()).accounts);
  }

  async get(accountId: string): Promise<MailAccount | null> {
    const stored = await this.storage.read();
    return structuredClone(stored.accounts.find((account) => account.id === accountId) ?? null);
  }

  async getActive(): Promise<MailAccount> {
    const stored = await this.storage.read();
    return structuredClone(stored.accounts.find((account) => account.isActive) ?? stored.accounts[0]);
  }

  async add(input: CreateMailAccountInput): Promise<MailAccount> {
    return this.storage.update((stored) => {
      const account: MailAccount = {
        id: `mail-account-${randomUUID()}`,
        provider: input.provider,
        emailAddress: input.emailAddress,
        displayName: input.displayName,
        mode: "demo",
        status: "connected",
        connectedAt: new Date().toISOString(),
        lastSuccessfulSyncAt: null,
        lastConnectionTestAt: null,
        isActive: stored.accounts.length === 0,
        error: null,
        organizationId: null,
        settings: createDefaultMailAccountSettings(),
      };
      stored.accounts.push(account);
      return { value: stored, result: structuredClone(account) };
    });
  }

  async connectGoogle(input: ConnectGoogleAccountInput): Promise<MailAccount> {
    return this.storage.update((stored) => {
      const existingIndex = stored.accounts.findIndex((account) => account.id === input.accountId);
      const existing = existingIndex >= 0 ? stored.accounts[existingIndex] : null;
      if (existing && existing.provider !== "google") {
        throw new Error("Le compte ciblé n’est pas un compte Google Workspace.");
      }
      const account: MailAccount = {
        id: input.accountId,
        provider: "google",
        emailAddress: input.emailAddress,
        displayName: existing?.displayName ?? `Google — ${input.emailAddress}`,
        mode: "oauth",
        status: "connected",
        connectedAt: input.connectedAt,
        lastSuccessfulSyncAt: existing?.lastSuccessfulSyncAt ?? null,
        lastConnectionTestAt: existing?.lastConnectionTestAt ?? null,
        isActive: true,
        error: null,
        organizationId: existing?.organizationId ?? null,
        settings: existing?.settings ?? createDefaultMailAccountSettings(),
      };
      stored.accounts = stored.accounts.map((item) => ({ ...item, isActive: false }));
      if (existingIndex >= 0) stored.accounts[existingIndex] = account;
      else stored.accounts.push(account);
      return { value: stored, result: structuredClone(account) };
    });
  }

  async rename(accountId: string, displayName: string): Promise<MailAccount> {
    return this.updateAccount(accountId, (account) => ({ ...account, displayName }));
  }

  async updateSettings(accountId: string, displayName: string, settings: MailAccount["settings"]): Promise<MailAccount> {
    return this.updateAccount(accountId, (account) => ({
      ...account,
      displayName,
      settings: { ...settings, sendingEnabled: false },
    }));
  }

  async activate(accountId: string): Promise<MailAccount> {
    return this.storage.update((stored) => {
      const target = stored.accounts.find((account) => account.id === accountId);
      if (!target) throw new Error("Le compte de messagerie est introuvable.");
      stored.accounts = stored.accounts.map((account) => ({
        ...account,
        isActive: account.id === accountId,
      }));
      return {
        value: stored,
        result: structuredClone(stored.accounts.find((account) => account.id === accountId)!),
      };
    });
  }

  async markConnectionTest(accountId: string, testedAt: string): Promise<MailAccount> {
    return this.updateAccount(accountId, (account) => ({
      ...account,
      status: "connected",
      lastConnectionTestAt: testedAt,
      error: null,
    }));
  }

  async markSynchronization(accountId: string, synchronizedAt: string): Promise<MailAccount> {
    return this.updateAccount(accountId, (account) => ({
      ...account,
      status: "connected",
      lastSuccessfulSyncAt: synchronizedAt,
      error: null,
    }));
  }

  async markConnectionError(accountId: string, message: string): Promise<MailAccount> {
    return this.updateAccount(accountId, (account) => ({ ...account, status: "error", error: message }));
  }

  async delete(accountId: string): Promise<void> {
    await this.storage.update((stored) => {
      const deleted = stored.accounts.find((account) => account.id === accountId);
      if (!deleted) throw new Error("Le compte de messagerie est introuvable.");
      stored.accounts = stored.accounts.filter((account) => account.id !== accountId);
      if (stored.accounts.length === 0) stored.accounts = [createDefaultDemoAccount()];
      if (deleted.isActive) {
        stored.accounts = stored.accounts.map((account, index) => ({ ...account, isActive: index === 0 }));
      }
      return { value: stored, result: undefined };
    });
  }

  private updateAccount(
    accountId: string,
    updater: (account: MailAccount) => MailAccount,
  ): Promise<MailAccount> {
    return this.storage.update((stored) => {
      const index = stored.accounts.findIndex((account) => account.id === accountId);
      if (index < 0) throw new Error("Le compte de messagerie est introuvable.");
      stored.accounts[index] = updater(stored.accounts[index]);
      return { value: stored, result: structuredClone(stored.accounts[index]) };
    });
  }
}

export const mailAccountRepository: MailAccountRepository = new LocalMailAccountRepository();
