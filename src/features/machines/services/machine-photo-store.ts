"use client";

import { useSyncExternalStore } from "react";
import { machinePhotoIndexedDbAdapter } from "@/features/machines/repositories/machine-photo-indexeddb-adapter";

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
  hydrating = machinePhotoIndexedDbAdapter
    .getAll()
    .then((records) => {
      snapshot = Object.fromEntries(records.map((record) => [record.machineId, record.dataUrl]));
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

export function useMachinePhotos(): PhotoMap {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export async function setMachinePhoto(machineId: string, dataUrl: string): Promise<void> {
  await machinePhotoIndexedDbAdapter.put(machineId, dataUrl);
  snapshot = { ...snapshot, [machineId]: dataUrl };
  notify();
}

/**
 * Reprend les photos historiquement stockées dans Réglages (`MachineSettings.photoDataUrl`,
 * localStorage) vers le stockage dédié IndexedDB, qui n'a pas la limite de quelques mégaoctets
 * de localStorage. N'écrase jamais une photo déjà migrée.
 */
export async function migrateLegacyMachinePhotos(legacyPhotos: { machineId: string; dataUrl: string }[]): Promise<number> {
  if (typeof window === "undefined" || !legacyPhotos.length) return 0;
  await hydrateOnce();
  const toMigrate = legacyPhotos.filter((entry) => entry.dataUrl && !snapshot[entry.machineId]);
  for (const entry of toMigrate) {
    await setMachinePhoto(entry.machineId, entry.dataUrl);
  }
  return toMigrate.length;
}

function hydrateOnce(): Promise<void> {
  hydrate();
  return hydrating ?? Promise.resolve();
}
