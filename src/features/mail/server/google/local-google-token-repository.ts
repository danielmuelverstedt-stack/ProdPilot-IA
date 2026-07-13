import "server-only";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type {
  GoogleConnectionRecord,
  GoogleTokenKey,
  GoogleTokenRepository,
  StoredGoogleTokens,
} from "@/features/mail/server/google/google-token-repository";

const STORAGE_DIRECTORY = path.join(process.cwd(), ".local-data");
const STORAGE_FILE = path.join(STORAGE_DIRECTORY, "google-mail-tokens.json");
const STORAGE_VERSION = 2;
let writeQueue: Promise<void> = Promise.resolve();

interface StoredGoogleConnections {
  version: number;
  records: GoogleConnectionRecord[];
}

/** Stockage serveur local uniquement. À remplacer par une base chiffrée en production. */
export class LocalGoogleTokenRepository implements GoogleTokenRepository {
  async get(key: GoogleTokenKey): Promise<GoogleConnectionRecord | null> {
    const record = (await this.read()).records.find((item) => sameKey(item.key, key));
    return record ? structuredClone(record) : null;
  }

  async save(record: GoogleConnectionRecord): Promise<void> {
    this.assertDevelopment();
    const stored = await this.read();
    const index = stored.records.findIndex((item) => sameKey(item.key, record.key));
    if (index >= 0) stored.records[index] = structuredClone(record);
    else stored.records.push(structuredClone(record));
    await this.write(stored);
  }

  async updateTokens(key: GoogleTokenKey, tokens: StoredGoogleTokens): Promise<void> {
    await this.update(key, (current) => ({
      ...current,
      tokens: {
        ...current.tokens,
        ...tokens,
        refreshToken: tokens.refreshToken ?? current.tokens.refreshToken,
      },
    }));
  }

  async updateSynchronization(key: GoogleTokenKey, value: string): Promise<void> {
    await this.update(key, (current) => ({
      ...current,
      lastSuccessfulSyncAt: value,
      lastError: null,
    }));
  }

  async updateError(key: GoogleTokenKey, message: string | null): Promise<void> {
    await this.update(key, (current) => ({ ...current, lastError: message }));
  }

  async delete(key: GoogleTokenKey): Promise<void> {
    this.assertDevelopment();
    const stored = await this.read();
    stored.records = stored.records.filter((record) => !sameKey(record.key, key));
    await this.write(stored);
  }

  private async update(
    key: GoogleTokenKey,
    updater: (record: GoogleConnectionRecord) => GoogleConnectionRecord,
  ): Promise<void> {
    const current = await this.get(key);
    if (current) await this.save(updater(current));
  }

  private async read(): Promise<StoredGoogleConnections> {
    try {
      const raw = await readFile(STORAGE_FILE, "utf8");
      const value: unknown = JSON.parse(raw);
      if (!isStoredConnections(value)) throw new Error("invalid-record");
      return value;
    } catch (error) {
      if (isFileMissing(error)) return { version: STORAGE_VERSION, records: [] };
      throw new Error("Le stockage local des connexions Google est illisible.");
    }
  }

  private async write(value: StoredGoogleConnections): Promise<void> {
    this.assertDevelopment();
    writeQueue = writeQueue.catch(() => undefined).then(async () => {
      await mkdir(STORAGE_DIRECTORY, { recursive: true });
      await writeFile(
        STORAGE_FILE,
        JSON.stringify({ version: STORAGE_VERSION, records: value.records }),
        { encoding: "utf8", mode: 0o600 },
      );
    });
    await writeQueue;
  }

  private assertDevelopment(): void {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Le stockage local des jetons est désactivé en production.");
    }
  }
}

function sameKey(first: GoogleTokenKey, second: GoogleTokenKey): boolean {
  return first.userId === second.userId
    && first.companyId === second.companyId
    && first.accountId === second.accountId
    && first.provider === second.provider;
}

function isStoredConnections(value: unknown): value is StoredGoogleConnections {
  if (!isRecord(value) || !Array.isArray(value.records)) return false;
  return value.records.every(isConnectionRecord);
}

function isConnectionRecord(value: unknown): value is GoogleConnectionRecord {
  if (!isRecord(value) || !isTokenKey(value.key)) return false;
  if (typeof value.emailAddress !== "string" || typeof value.connectedAt !== "string") return false;
  if (!isNullableString(value.lastSuccessfulSyncAt) || !isNullableString(value.lastError)) return false;
  if (!isRecord(value.tokens)) return false;
  return (value.tokens.refreshToken === undefined || typeof value.tokens.refreshToken === "string")
    && (value.tokens.accessToken === undefined || typeof value.tokens.accessToken === "string")
    && (value.tokens.expiryDate === undefined || typeof value.tokens.expiryDate === "number");
}

function isTokenKey(value: unknown): value is GoogleTokenKey {
  return isRecord(value)
    && typeof value.userId === "string"
    && typeof value.companyId === "string"
    && typeof value.accountId === "string"
    && value.provider === "google";
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

export const googleTokenRepository: GoogleTokenRepository = new LocalGoogleTokenRepository();
