import { MAIL_MEMORY_BACKUP_VERSION, MAIL_MEMORY_STORE_NAMES } from "@/features/mail-memory/config/mail-memory-defaults";
import type { MailMemoryRepository } from "@/features/mail-memory/repositories/mail-memory-repository";
import type { MailMemoryBackup, MailMemoryContext, MailMemoryRecord, MailMemorySettings, MailMemoryStoreName } from "@/features/mail-memory/types/mail-memory";

const FORBIDDEN_BACKUP_KEYS = /token|secret|password|apiKey|authorization|binary|blob|rawHtml|audio|payment/i;

export async function exportMailMemory(repository: MailMemoryRepository, context: MailMemoryContext): Promise<MailMemoryBackup> {
  const stores: MailMemoryBackup["stores"] = {};
  for (const store of MAIL_MEMORY_STORE_NAMES) stores[store] = (await repository.list(store, context)).map(sanitizeBackupRecord);
  return { format: "prodpilot-mail-memory", version: MAIL_MEMORY_BACKUP_VERSION, exportedAt: new Date().toISOString(), context, stores };
}

export async function importMailMemory(repository: MailMemoryRepository, context: MailMemoryContext, value: unknown): Promise<void> {
  const backup = validateBackup(value, context);
  for (const [store, records] of Object.entries(backup.stores) as Array<[MailMemoryStoreName, MailMemoryRecord[] | undefined]>) {
    if (!MAIL_MEMORY_STORE_NAMES.includes(store)) continue;
    for (const record of records ?? []) await repository.save(store, { ...sanitizeBackupRecord(record), ...context });
  }
}

export async function applyMailMemoryRetention(repository: MailMemoryRepository, context: MailMemoryContext, settings: MailMemorySettings, now = new Date()): Promise<number> {
  const policies: Partial<Record<MailMemoryStoreName, number>> = { mailMessages: settings.mailRetentionDays, mailThreads: settings.mailRetentionDays, mailAnalyses: settings.analysisRetentionDays, assistantSessions: settings.sessionRetentionDays, assistantCommands: settings.sessionRetentionDays, assistantAuditEvents: settings.auditRetentionDays };
  let removed = 0;
  for (const [store, days] of Object.entries(policies) as Array<[MailMemoryStoreName, number]>) {
    const threshold = now.getTime() - days * 86_400_000;
    for (const record of await repository.list(store, context)) {
      if (new Date(record.updatedAt).getTime() < threshold) { await repository.remove(store, record.id, context); removed += 1; }
    }
  }
  return removed;
}

export async function estimateMailMemorySize(repository: MailMemoryRepository, context: MailMemoryContext): Promise<number> {
  const backup = await exportMailMemory(repository, context);
  return new Blob([JSON.stringify(backup)]).size;
}

function sanitizeBackupRecord<T extends MailMemoryRecord>(record: T): T {
  const sanitize = (value: unknown): unknown => {
    if (value === null || typeof value !== "object") return value;
    if (value instanceof Blob || value instanceof ArrayBuffer || ArrayBuffer.isView(value)) return undefined;
    return Object.fromEntries(Object.entries(value).filter(([key]) => !FORBIDDEN_BACKUP_KEYS.test(key)).map(([key, nested]) => [key, sanitize(nested)]));
  };
  return sanitize(record) as T;
}

function validateBackup(value: unknown, context: MailMemoryContext): MailMemoryBackup {
  if (!value || typeof value !== "object") throw new Error("Sauvegarde locale invalide.");
  const candidate = value as Partial<MailMemoryBackup>;
  if (candidate.format !== "prodpilot-mail-memory" || candidate.version !== MAIL_MEMORY_BACKUP_VERSION || !candidate.stores) throw new Error("Version de sauvegarde locale incompatible.");
  if (!candidate.context || candidate.context.companyId !== context.companyId || candidate.context.userId !== context.userId || candidate.context.accountId !== context.accountId || candidate.context.mode !== context.mode) throw new Error("Cette sauvegarde appartient à un autre contexte.");
  return candidate as MailMemoryBackup;
}
