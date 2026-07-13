import "server-only";

import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import type {
  GoogleConnectionRecord,
  GoogleTokenRepository,
  StoredGoogleTokens,
} from "@/features/mail/server/google/google-token-repository";

const STORAGE_DIRECTORY = path.join(process.cwd(), ".local-data");
const STORAGE_FILE = path.join(STORAGE_DIRECTORY, "google-mail-tokens.json");

export class LocalGoogleTokenRepository implements GoogleTokenRepository {
  async get(): Promise<GoogleConnectionRecord | null> {
    try {
      const raw = await readFile(STORAGE_FILE, "utf8");
      const value: unknown = JSON.parse(raw);
      if (!isConnectionRecord(value)) throw new Error("invalid-record");
      return value;
    } catch (error) {
      if (isFileMissing(error)) return null;
      throw new Error("Le stockage local de la connexion Google est illisible.");
    }
  }

  async save(record: GoogleConnectionRecord): Promise<void> {
    this.assertDevelopment();
    await mkdir(STORAGE_DIRECTORY, { recursive: true });
    await writeFile(STORAGE_FILE, JSON.stringify(record), { encoding: "utf8", mode: 0o600 });
  }

  async updateTokens(tokens: StoredGoogleTokens): Promise<void> {
    const current = await this.get();
    if (!current) return;
    await this.save({
      ...current,
      tokens: {
        ...current.tokens,
        ...tokens,
        refreshToken: tokens.refreshToken ?? current.tokens.refreshToken,
      },
    });
  }

  async updateSynchronization(lastSuccessfulSyncAt: string): Promise<void> {
    const current = await this.get();
    if (current) await this.save({ ...current, lastSuccessfulSyncAt, lastError: null });
  }

  async updateError(message: string | null): Promise<void> {
    const current = await this.get();
    if (current) await this.save({ ...current, lastError: message });
  }

  async delete(): Promise<void> {
    this.assertDevelopment();
    await rm(STORAGE_FILE, { force: true });
  }

  private assertDevelopment() {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Le stockage local des jetons est désactivé en production.");
    }
  }
}

function isFileMissing(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
}

function isConnectionRecord(value: unknown): value is GoogleConnectionRecord {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  if (typeof record.emailAddress !== "string" || typeof record.connectedAt !== "string") return false;
  if (record.lastSuccessfulSyncAt !== null && typeof record.lastSuccessfulSyncAt !== "string") return false;
  if (record.lastError !== null && typeof record.lastError !== "string") return false;
  if (typeof record.tokens !== "object" || record.tokens === null) return false;
  const tokens = record.tokens as Record<string, unknown>;
  return (tokens.refreshToken === undefined || typeof tokens.refreshToken === "string")
    && (tokens.accessToken === undefined || typeof tokens.accessToken === "string")
    && (tokens.expiryDate === undefined || typeof tokens.expiryDate === "number");
}

export const googleTokenRepository: GoogleTokenRepository = new LocalGoogleTokenRepository();
