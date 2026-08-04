"use client";

import { useSyncExternalStore } from "react";
import { contactPhotoIndexedDbAdapter } from "@/features/contacts/repositories/contact-photo-indexeddb-adapter";

type PhotoMap = Record<string, string>;

const listeners = new Set<() => void>();
let snapshot: PhotoMap = {};
let hydrated = false;
let hydrating: Promise<void> | null = null;

function notify(): void {
  listeners.forEach((listener) => listener());
}

function hydrate(): void {
  if (hydrated || hydrating || typeof window === "undefined") return;
  hydrating = contactPhotoIndexedDbAdapter
    .getAll()
    .then((records) => {
      snapshot = Object.fromEntries(records.map((record) => [record.contactId, record.dataUrl]));
      hydrated = true;
      notify();
    })
    .catch(() => {
      hydrated = true;
    });
}

function subscribe(listener: () => void): () => void {
  hydrate();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): PhotoMap {
  hydrate();
  return snapshot;
}

function getServerSnapshot(): PhotoMap {
  return {};
}

export function useContactPhotos(): PhotoMap {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export async function setContactPhoto(contactId: string, dataUrl: string): Promise<void> {
  await contactPhotoIndexedDbAdapter.put(contactId, dataUrl);
  snapshot = { ...snapshot, [contactId]: dataUrl };
  notify();
}
