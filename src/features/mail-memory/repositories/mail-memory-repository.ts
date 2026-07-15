import type { LocalDatabaseAdapter } from "@/features/mail-memory/repositories/local-database-adapter";
import type { MailMemoryContext, MailMemoryRecord, MailMemoryStoreName } from "@/features/mail-memory/types/mail-memory";

export interface MailMemoryRepository {
  list<T extends MailMemoryRecord>(store: MailMemoryStoreName, context: MailMemoryContext): Promise<T[]>;
  save<T extends MailMemoryRecord>(store: MailMemoryStoreName, record: T): Promise<void>;
  remove(store: MailMemoryStoreName, id: string, context: MailMemoryContext): Promise<void>;
  clear(store: MailMemoryStoreName, context: MailMemoryContext): Promise<void>;
  clearAll(context: MailMemoryContext): Promise<void>;
}

export class AdapterMailMemoryRepository implements MailMemoryRepository {
  private readonly adapter: LocalDatabaseAdapter;
  constructor(adapter: LocalDatabaseAdapter) { this.adapter = adapter; }

  async list<T extends MailMemoryRecord>(store: MailMemoryStoreName, context: MailMemoryContext): Promise<T[]> {
    const records = await this.adapter.getAll<T>(store);
    return records.filter((record) => hasContext(record, context));
  }

  async save<T extends MailMemoryRecord>(store: MailMemoryStoreName, record: T): Promise<void> {
    if (!record.accountId || !record.companyId || !record.userId || !record.provider) throw new Error("Le contexte de mémoire locale est incomplet.");
    await this.adapter.put(store, record);
  }

  async remove(store: MailMemoryStoreName, id: string, context: MailMemoryContext): Promise<void> {
    const record = (await this.adapter.getAll<MailMemoryRecord>(store)).find((item) => item.id === id);
    if (record && hasContext(record, context)) await this.adapter.delete(store, id);
  }

  async clear(store: MailMemoryStoreName, context: MailMemoryContext): Promise<void> {
    for (const record of await this.list(store, context)) await this.adapter.delete(store, record.id);
  }

  async clearAll(context: MailMemoryContext): Promise<void> {
    const stores: MailMemoryStoreName[] = ["mailMessages", "mailThreads", "mailAnalyses", "mailEntities", "mailDecisions", "commitments", "replyProposals", "draftReferences", "assistantSessions", "assistantCommands", "assistantAuditEvents", "internalActions", "followUps", "meetingRequests", "contactPreferences", "sourceLinks", "synchronizationState", "usageMetrics"];
    for (const store of stores) await this.clear(store, context);
  }
}

export function hasContext(record: MailMemoryContext, context: MailMemoryContext): boolean {
  return record.accountId === context.accountId
    && record.provider === context.provider
    && record.userId === context.userId
    && record.companyId === context.companyId
    && record.mode === context.mode;
}
