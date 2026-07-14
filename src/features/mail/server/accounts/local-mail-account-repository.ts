import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
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
  CreateMailAccountInput,
  ConnectGoogleAccountInput,
  MailAccountRepository,
} from "@/features/mail/server/accounts/mail-account-repository";
import type { MailAccount } from "@/features/mail/types/mail";

const STORAGE_DIRECTORY = path.join(process.cwd(), ".local-data");
const STORAGE_FILE = path.join(STORAGE_DIRECTORY, "mail-accounts.json");
let writeQueue: Promise<void> = Promise.resolve();

export class LocalMailAccountRepository implements MailAccountRepository {
  async list(): Promise<MailAccount[]> {
    return structuredClone((await this.read()).accounts);
  }

  async get(accountId: string): Promise<MailAccount | null> {
    return (await this.list()).find((account) => account.id === accountId) ?? null;
  }

  async getActive(): Promise<MailAccount> {
    const accounts = await this.list();
    return accounts.find((account) => account.isActive) ?? accounts[0];
  }

  async add(input: CreateMailAccountInput): Promise<MailAccount> {
    const stored = await this.read();
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
    await this.write(stored);
    return structuredClone(account);
  }

  async connectGoogle(input: ConnectGoogleAccountInput): Promise<MailAccount> {
    const stored = await this.read();
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
    await this.write(stored);
    return structuredClone(account);
  }

  async rename(accountId: string, displayName: string): Promise<MailAccount> {
    return this.updateAccount(accountId, (account) => ({ ...account, displayName }));
  }

  async updateSettings(
    accountId: string,
    displayName: string,
    settings: MailAccount["settings"],
  ): Promise<MailAccount> {
    return this.updateAccount(accountId, (account) => ({
      ...account,
      displayName,
      settings: { ...settings, sendingEnabled: false },
    }));
  }

  async activate(accountId: string): Promise<MailAccount> {
    const stored = await this.read();
    const target = stored.accounts.find((account) => account.id === accountId);
    if (!target) throw new Error("Le compte de messagerie est introuvable.");
    stored.accounts = stored.accounts.map((account) => ({
      ...account,
      isActive: account.id === accountId,
    }));
    await this.write(stored);
    return structuredClone(stored.accounts.find((account) => account.id === accountId)!);
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
      lastSuccessfulSyncAt: synchronizedAt,
      error: null,
    }));
  }

  async markConnectionError(accountId: string, message: string): Promise<MailAccount> {
    return this.updateAccount(accountId, (account) => ({
      ...account,
      status: "error",
      error: message,
    }));
  }

  async delete(accountId: string): Promise<void> {
    const stored = await this.read();
    const deleted = stored.accounts.find((account) => account.id === accountId);
    if (!deleted) throw new Error("Le compte de messagerie est introuvable.");
    stored.accounts = stored.accounts.filter((account) => account.id !== accountId);
    if (stored.accounts.length === 0) stored.accounts = [createDefaultDemoAccount()];
    if (deleted.isActive) {
      stored.accounts = stored.accounts.map((account, index) => ({
        ...account,
        isActive: index === 0,
      }));
    }
    await this.write(stored);
  }

  private async updateAccount(
    accountId: string,
    updater: (account: MailAccount) => MailAccount,
  ): Promise<MailAccount> {
    const stored = await this.read();
    const index = stored.accounts.findIndex((account) => account.id === accountId);
    if (index < 0) throw new Error("Le compte de messagerie est introuvable.");
    stored.accounts[index] = updater(stored.accounts[index]);
    await this.write(stored);
    return structuredClone(stored.accounts[index]);
  }

  private async read(): Promise<StoredMailAccounts> {
    try {
      const raw = await readFile(STORAGE_FILE, "utf8");
      const value: unknown = JSON.parse(raw);
      return parseStoredMailAccounts(value) ?? createDefaultStoredMailAccounts();
    } catch (error) {
      if (isFileMissing(error)) return createDefaultStoredMailAccounts();
      throw new Error("Le registre local des comptes de messagerie est illisible.");
    }
  }

  private async write(value: StoredMailAccounts): Promise<void> {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Le registre local des comptes est désactivé en production.");
    }
    writeQueue = writeQueue.catch(() => undefined).then(async () => {
      await mkdir(STORAGE_DIRECTORY, { recursive: true });
      await writeFile(STORAGE_FILE, JSON.stringify(normalizeStoredMailAccounts(value), null, 2), {
        encoding: "utf8",
        mode: 0o600,
      });
    });
    await writeQueue;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFileMissing(error: unknown): boolean {
  return isRecord(error) && error.code === "ENOENT";
}

export const mailAccountRepository: MailAccountRepository = new LocalMailAccountRepository();
