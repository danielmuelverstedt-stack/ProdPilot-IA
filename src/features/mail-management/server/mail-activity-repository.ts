import "server-only";

import path from "node:path";
import { SerializedAtomicJsonFile } from "@/features/mail/server/accounts/serialized-atomic-json-file";
import type { MailActivityEntry } from "@/features/mail-management/types/mail-management";

interface StoredMailActivity {
  version: 1;
  entries: MailActivityEntry[];
}

class MailActivityRepository {
  private readonly storage = new SerializedAtomicJsonFile<StoredMailActivity>({
    storageFile: path.join(process.cwd(), ".local-data", "mail-activity.json"),
    parse: parseStoredActivity,
    createDefault: () => ({ version: 1, entries: [] }),
    normalize: (value) => ({ version: 1, entries: value.entries.slice(-500) }),
    readErrorMessage: "Le journal local des actions Mail est illisible.",
  });

  async list(accountId: string): Promise<MailActivityEntry[]> {
    const stored = await this.storage.read();
    return structuredClone(stored.entries.filter((entry) => entry.accountId === accountId).reverse());
  }

  async get(id: string, accountId: string): Promise<MailActivityEntry | null> {
    const stored = await this.storage.read();
    return structuredClone(stored.entries.find((entry) => entry.id === id && entry.accountId === accountId) ?? null);
  }

  async add(entry: MailActivityEntry): Promise<void> {
    await this.storage.update((stored) => ({ value: { ...stored, entries: [...stored.entries, entry] }, result: undefined }));
  }

  async markUndone(id: string, accountId: string, undoneAt: string): Promise<MailActivityEntry> {
    return this.storage.update((stored) => {
      const index = stored.entries.findIndex((entry) => entry.id === id && entry.accountId === accountId);
      if (index < 0) throw new Error("L’action Mail à annuler est introuvable.");
      stored.entries[index] = { ...stored.entries[index], gmailResult: "undone", canUndo: false, undoneAt };
      return { value: stored, result: structuredClone(stored.entries[index]) };
    });
  }
}

function parseStoredActivity(value: unknown): StoredMailActivity | null {
  if (!isRecord(value) || value.version !== 1 || !Array.isArray(value.entries)) return null;
  return value.entries.every(isMailActivityEntry) ? value as unknown as StoredMailActivity : null;
}

function isMailActivityEntry(value: unknown): boolean {
  return isRecord(value)
    && typeof value.id === "string"
    && typeof value.accountId === "string"
    && Array.isArray(value.messageIds)
    && value.messageIds.every((id) => typeof id === "string")
    && Array.isArray(value.snapshotsBefore)
    && Array.isArray(value.snapshotsAfter)
    && typeof value.createdAt === "string"
    && typeof value.reason === "string";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export const mailActivityRepository = new MailActivityRepository();
