"use client";

const DATABASE_NAME = "prodpilot-machine-photos";
const DATABASE_VERSION = 1;
const STORE_NAME = "photos";

export interface MachinePhotoRecord {
  machineId: string;
  dataUrl: string;
  updatedAt: string;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function open(): Promise<IDBDatabase> {
  dbPromise ??= new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME, { keyPath: "machineId" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Impossible d’ouvrir le stockage local des photos machine."));
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

export const machinePhotoIndexedDbAdapter = {
  getAll(): Promise<MachinePhotoRecord[]> {
    return runRequest((store) => store.getAll(), "readonly");
  },
  put(machineId: string, dataUrl: string): Promise<void> {
    const record: MachinePhotoRecord = { machineId, dataUrl, updatedAt: new Date().toISOString() };
    return runRequest((store) => store.put(record), "readwrite").then(() => undefined);
  },
};
