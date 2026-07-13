"use client";

import { useSyncExternalStore } from "react";
import { initialDemoData } from "@/features/demo/mock/demo-data";
import type { DemoData } from "@/features/demo/types/demo";

const STORAGE_KEY = "prodpilot.demo-data.v1";
const listeners = new Set<() => void>();
const serverSnapshot = initialDemoData;
let snapshot: DemoData = initialDemoData;
let hydrated = false;

function hydrate(): void {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (isDemoData(parsed)) snapshot = parsed;
    }
  } catch {
    snapshot = structuredClone(initialDemoData);
  }
}

function subscribe(listener: () => void): () => void {
  hydrate();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): DemoData {
  hydrate();
  return snapshot;
}

export function useDemoData(): DemoData {
  return useSyncExternalStore(subscribe, getSnapshot, () => serverSnapshot);
}

export function updateDemoData(updater: (draft: DemoData) => void): void {
  hydrate();
  const draft = structuredClone(snapshot);
  updater(draft);
  snapshot = draft;
  if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  listeners.forEach((listener) => listener());
}

export function resetDemoData(): void {
  snapshot = structuredClone(initialDemoData);
  hydrated = true;
  if (typeof window !== "undefined") window.localStorage.removeItem(STORAGE_KEY);
  listeners.forEach((listener) => listener());
}

function isDemoData(value: unknown): value is DemoData {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Partial<DemoData>;
  return item.version === 1
    && [item.actions, item.workOrders, item.planning, item.machines, item.maintenance,
      item.meetings, item.requests, item.erpQuality, item.notifications]
      .every(Array.isArray);
}
