"use client";

import { MAIL_MEMORY_DATABASE_NAME, MAIL_MEMORY_DATABASE_VERSION, MAIL_MEMORY_STORE_NAMES } from "@/features/mail-memory/config/mail-memory-defaults";
import type { LocalDatabaseAdapter } from "@/features/mail-memory/repositories/local-database-adapter";
import type { MailMemoryRecord, MailMemoryStoreName } from "@/features/mail-memory/types/mail-memory";

export class IndexedDbMailMemoryAdapter implements LocalDatabaseAdapter {
  private databasePromise: Promise<IDBDatabase> | null = null;

  async getAll<T extends MailMemoryRecord>(store: MailMemoryStoreName): Promise<T[]> {
    return this.request<T[]>((database) => database.transaction(store, "readonly").objectStore(store).getAll());
  }

  async put<T extends MailMemoryRecord>(store: MailMemoryStoreName, record: T): Promise<void> {
    assertSafeRecord(record);
    await this.request<IDBValidKey>((database) => database.transaction(store, "readwrite").objectStore(store).put(record));
  }

  async delete(store: MailMemoryStoreName, id: string): Promise<void> {
    await this.request<undefined>((database) => database.transaction(store, "readwrite").objectStore(store).delete(id));
  }

  async clear(store: MailMemoryStoreName): Promise<void> {
    await this.request<undefined>((database) => database.transaction(store, "readwrite").objectStore(store).clear());
  }

  private open(): Promise<IDBDatabase> {
    if (this.databasePromise) return this.databasePromise;
    this.databasePromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(MAIL_MEMORY_DATABASE_NAME, MAIL_MEMORY_DATABASE_VERSION);
      request.onupgradeneeded = () => migrateDatabase(request.result, request.transaction);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error("La mémoire locale n’a pas pu être ouverte."));
      request.onblocked = () => reject(new Error("Fermez les autres onglets ProdPilot IA pour mettre à jour la mémoire locale."));
    });
    return this.databasePromise;
  }

  private async request<T>(create: (database: IDBDatabase) => IDBRequest<T>): Promise<T> {
    const database = await this.open();
    return new Promise((resolve, reject) => {
      const request = create(database);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error("L’opération de mémoire locale a échoué."));
    });
  }
}

export function migrateDatabase(database: IDBDatabase, transaction: IDBTransaction | null): void {
  for (const storeName of MAIL_MEMORY_STORE_NAMES) {
    const store = database.objectStoreNames.contains(storeName)
      ? transaction?.objectStore(storeName)
      : database.createObjectStore(storeName, { keyPath: "id" });
    if (!store) continue;
    if (!store.indexNames.contains("context")) store.createIndex("context", ["companyId", "userId", "accountId", "mode"], { unique: false });
    if (!store.indexNames.contains("updatedAt")) store.createIndex("updatedAt", "updatedAt", { unique: false });
    if (!store.indexNames.contains("sourceId")) store.createIndex("sourceId", "sourceId", { unique: false });
  }
}

export function assertSafeRecord(value: unknown): void {
  const seen = new Set<unknown>();
  const inspect = (candidate: unknown): void => {
    if (candidate === null || typeof candidate !== "object") return;
    if (candidate instanceof Blob || candidate instanceof ArrayBuffer || ArrayBuffer.isView(candidate)) throw new Error("Le contenu binaire n’est jamais enregistré dans la mémoire locale.");
    if (seen.has(candidate)) return;
    seen.add(candidate);
    for (const [key, nested] of Object.entries(candidate)) {
      if (/token|secret|password|apiKey|authorization|rawHtml|audio/i.test(key)) throw new Error(`Le champ sensible « ${key} » ne peut pas être enregistré.`);
      inspect(nested);
    }
  };
  inspect(value);
}
