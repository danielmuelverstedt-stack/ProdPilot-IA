"use client";

const DATABASE_NAME = "prodpilot-contact-photos";
const DATABASE_VERSION = 1;
const STORE_NAME = "photos";

export interface ContactPhotoRecord {
  contactId: string;
  dataUrl: string;
  updatedAt: string;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function open(): Promise<IDBDatabase> {
  dbPromise ??= new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME, { keyPath: "contactId" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Impossible d’ouvrir le stockage local des photos de contact."));
  });
  return dbPromise;
}

function runRequest<T>(factory: (store: IDBObjectStore) => IDBRequest<T>, mode: IDBTransactionMode): Promise<T> {
  return open().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, mode);
        const request = factory(transaction.objectStore(STORE_NAME));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error ?? new Error("Cette photo n’a pas pu être enregistrée dans le stockage local."));
      }),
  );
}

export const contactPhotoIndexedDbAdapter = {
  getAll(): Promise<ContactPhotoRecord[]> {
    return runRequest((store) => store.getAll(), "readonly");
  },
  put(contactId: string, dataUrl: string): Promise<void> {
    const record: ContactPhotoRecord = { contactId, dataUrl, updatedAt: new Date().toISOString() };
    return runRequest((store) => store.put(record), "readwrite").then(() => undefined);
  },
};
