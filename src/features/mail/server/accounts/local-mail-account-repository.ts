import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type {
  CreateMailAccountInput,
  MailAccountRepository,
} from "@/features/mail/server/accounts/mail-account-repository";
import {
  isMailProviderType,
  type MailAccount,
} from "@/features/mail/types/mail";

const STORAGE_DIRECTORY = path.join(process.cwd(), ".local-data");
const STORAGE_FILE = path.join(STORAGE_DIRECTORY, "mail-accounts.json");
const STORAGE_VERSION = 1;
let writeQueue: Promise<void> = Promise.resolve();

interface StoredMailAccounts {
  version: number;
  accounts: MailAccount[];
}

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
    };
    stored.accounts.push(account);
    await this.write(stored);
    return structuredClone(account);
  }

  async rename(accountId: string, displayName: string): Promise<MailAccount> {
    return this.updateAccount(accountId, (account) => ({ ...account, displayName }));
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

  async delete(accountId: string): Promise<void> {
    const stored = await this.read();
    const deleted = stored.accounts.find((account) => account.id === accountId);
    if (!deleted) throw new Error("Le compte de messagerie est introuvable.");
    stored.accounts = stored.accounts.filter((account) => account.id !== accountId);
    if (stored.accounts.length === 0) stored.accounts = [createDefaultMockAccount()];
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
      return isStoredMailAccounts(value) ? normalizeActiveAccount(value) : createDefaults();
    } catch (error) {
      if (isFileMissing(error)) return createDefaults();
      throw new Error("Le registre local des comptes de messagerie est illisible.");
    }
  }

  private async write(value: StoredMailAccounts): Promise<void> {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Le registre local des comptes est désactivé en production.");
    }
    writeQueue = writeQueue.catch(() => undefined).then(async () => {
      await mkdir(STORAGE_DIRECTORY, { recursive: true });
      await writeFile(STORAGE_FILE, JSON.stringify(normalizeActiveAccount(value), null, 2), {
        encoding: "utf8",
        mode: 0o600,
      });
    });
    await writeQueue;
  }
}

function createDefaults(): StoredMailAccounts {
  return {
    version: STORAGE_VERSION,
    accounts: [
      createDefaultMockAccount(),
      createDemoAccount("google-demo", "google", "Google Production", "production@google.example"),
      createDemoAccount("microsoft-demo", "microsoft", "Microsoft Planification", "planning@microsoft.example"),
    ],
  };
}

function createDefaultMockAccount(): MailAccount {
  return {
    ...createDemoAccount("mock-demo", "mock", "Boîte de démonstration", "production@demo.example"),
    isActive: true,
  };
}

function createDemoAccount(
  id: string,
  provider: MailAccount["provider"],
  displayName: string,
  emailAddress: string,
): MailAccount {
  return {
    id,
    provider,
    emailAddress,
    displayName,
    mode: "demo",
    status: "connected",
    connectedAt: "2026-07-13T08:00:00.000Z",
    lastSuccessfulSyncAt: "2026-07-13T08:00:00.000Z",
    lastConnectionTestAt: null,
    isActive: false,
    error: null,
  };
}

function normalizeActiveAccount(value: StoredMailAccounts): StoredMailAccounts {
  const accounts = value.accounts.length ? value.accounts : [createDefaultMockAccount()];
  const activeIndex = accounts.findIndex((account) => account.isActive);
  return {
    version: STORAGE_VERSION,
    accounts: accounts.map((account, index) => ({
      ...account,
      isActive: index === (activeIndex >= 0 ? activeIndex : 0),
    })),
  };
}

function isStoredMailAccounts(value: unknown): value is StoredMailAccounts {
  if (!isRecord(value) || !Array.isArray(value.accounts)) return false;
  return value.accounts.every((account) =>
    isRecord(account) &&
    typeof account.id === "string" &&
    isMailProviderType(account.provider) &&
    typeof account.emailAddress === "string" &&
    typeof account.displayName === "string" &&
    (account.mode === "demo" || account.mode === "oauth") &&
    ["connected", "disconnected", "unavailable", "error"].includes(String(account.status)) &&
    isNullableString(account.connectedAt) &&
    isNullableString(account.lastSuccessfulSyncAt) &&
    isNullableString(account.lastConnectionTestAt) &&
    typeof account.isActive === "boolean" &&
    isNullableString(account.error),
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

function isFileMissing(error: unknown): boolean {
  return isRecord(error) && error.code === "ENOENT";
}

export const mailAccountRepository: MailAccountRepository = new LocalMailAccountRepository();
