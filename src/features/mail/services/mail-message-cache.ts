import "server-only";

import type { MailMessage, MailSynchronizationSummary } from "@/features/mail/types/mail";

interface MailMessageCacheEntry {
  accountId: string;
  key: string;
  messages: MailMessage[];
  synchronization: MailSynchronizationSummary;
  expiresAt: number;
}

interface MailCacheGlobal {
  __prodpilotMailMessageCache?: Map<string, MailMessageCacheEntry>;
  __prodpilotMailLastSynchronization?: Map<string, MailSynchronizationSummary>;
}

const shared = globalThis as typeof globalThis & MailCacheGlobal;
const cache = shared.__prodpilotMailMessageCache ??= new Map();
const lastSynchronizations = shared.__prodpilotMailLastSynchronization ??= new Map();

export function readMailMessageCache(accountId: string, key: string): MailMessageCacheEntry | null {
  const entry = cache.get(`${accountId}:${key}`);
  if (!entry || entry.expiresAt <= Date.now()) {
    if (entry) cache.delete(`${accountId}:${key}`);
    return null;
  }
  return structuredClone(entry);
}

export function writeMailMessageCache(input: Omit<MailMessageCacheEntry, "expiresAt">, ttlMs: number): void {
  const entry = { ...structuredClone(input), expiresAt: Date.now() + ttlMs };
  cache.set(`${input.accountId}:${input.key}`, entry);
  lastSynchronizations.set(input.accountId, structuredClone(input.synchronization));
}

export function getLastMailSynchronization(accountId: string): MailSynchronizationSummary | null {
  return structuredClone(lastSynchronizations.get(accountId) ?? null);
}

export function invalidateMailMessageCache(accountId: string): void {
  for (const [key, entry] of cache) {
    if (entry.accountId === accountId) cache.delete(key);
  }
}
