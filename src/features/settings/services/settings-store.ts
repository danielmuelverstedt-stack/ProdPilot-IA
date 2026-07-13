"use client";

import { defaultSettings } from "@/features/settings/config/default-settings";
import { settingsRepository } from "@/features/settings/services/settings-repository";
import type { AppSettings } from "@/features/settings/types/settings";

type Listener = () => void;

let settingsCache: AppSettings | null = null;
const listeners = new Set<Listener>();

export function getSettingsSnapshot(): AppSettings {
  if (typeof window === "undefined") return defaultSettings;
  settingsCache ??= settingsRepository.load();
  return settingsCache;
}

export function getServerSettingsSnapshot(): AppSettings {
  return defaultSettings;
}

export function subscribeToSettings(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function publish(settings: AppSettings) {
  settingsCache = settings;
  settingsRepository.save(settings);
  listeners.forEach((listener) => listener());
}

export function updateSettingsSnapshot(
  updater: (current: AppSettings) => AppSettings | void,
  description = "Réglages mis à jour",
) {
  const current = getSettingsSnapshot();
  const draft = structuredClone(current);
  const next = updater(draft) ?? draft;
  next.journal = [
    {
      id: `journal-${Date.now()}`,
      date: new Intl.DateTimeFormat("fr-BE", { dateStyle: "short", timeStyle: "short" }).format(new Date()),
      description,
    },
    ...next.journal,
  ].slice(0, 50);
  publish(next);
}

export function resetSettingsSnapshot() {
  settingsCache = settingsRepository.reset();
  listeners.forEach((listener) => listener());
}
