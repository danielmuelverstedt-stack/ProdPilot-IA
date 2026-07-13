"use client";

import { createContext, useContext, useEffect, useMemo, useSyncExternalStore } from "react";
import {
  getServerSettingsSnapshot,
  getSettingsSnapshot,
  resetSettingsSnapshot,
  subscribeToSettings,
  updateSettingsSnapshot,
} from "@/features/settings/services/settings-store";
import type { AppSettings } from "@/features/settings/types/settings";

interface SettingsContextValue {
  settings: AppSettings;
  updateSettings: (updater: (current: AppSettings) => AppSettings | void, description?: string) => void;
  resetSettings: () => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const settings = useSyncExternalStore(
    subscribeToSettings,
    getSettingsSnapshot,
    getServerSettingsSnapshot,
  );

  useEffect(() => {
    const root = document.documentElement;
    Object.entries(settings.theme).forEach(([key, value]) => {
      root.style.setProperty(`--app-${key}`, value);
    });
  }, [settings.theme]);

  const value = useMemo<SettingsContextValue>(
    () => ({
      settings,
      updateSettings: updateSettingsSnapshot,
      resetSettings: resetSettingsSnapshot,
    }),
    [settings],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) throw new Error("useSettings doit être utilisé dans SettingsProvider.");
  return context;
}
