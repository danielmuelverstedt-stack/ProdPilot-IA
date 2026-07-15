import type { MailMemoryRecord, MailMemoryStoreName } from "@/features/mail-memory/types/mail-memory";

export interface LocalDatabaseAdapter {
  getAll<T extends MailMemoryRecord>(store: MailMemoryStoreName): Promise<T[]>;
  put<T extends MailMemoryRecord>(store: MailMemoryStoreName, record: T): Promise<void>;
  delete(store: MailMemoryStoreName, id: string): Promise<void>;
  clear(store: MailMemoryStoreName): Promise<void>;
}

export class InMemoryLocalDatabaseAdapter implements LocalDatabaseAdapter {
  private readonly stores = new Map<MailMemoryStoreName, Map<string, MailMemoryRecord>>();

  async getAll<T extends MailMemoryRecord>(store: MailMemoryStoreName): Promise<T[]> {
    return structuredClone(Array.from(this.stores.get(store)?.values() ?? [])) as T[];
  }

  async put<T extends MailMemoryRecord>(store: MailMemoryStoreName, record: T): Promise<void> {
    const values = this.stores.get(store) ?? new Map<string, MailMemoryRecord>();
    values.set(record.id, structuredClone(record));
    this.stores.set(store, values);
  }

  async delete(store: MailMemoryStoreName, id: string): Promise<void> { this.stores.get(store)?.delete(id); }
  async clear(store: MailMemoryStoreName): Promise<void> { this.stores.delete(store); }
}
