import { defaultSettings } from "@/features/settings/config/default-settings";
import { SETTINGS_VERSION, type AppSettings } from "@/features/settings/types/settings";

const STORAGE_KEY = "prodpilot.settings";

function cloneDefaults(): AppSettings {
  return structuredClone(defaultSettings);
}

function migrateSettings(value: unknown): AppSettings {
  if (!value || typeof value !== "object") return cloneDefaults();
  const saved = value as Partial<AppSettings>;
  const defaults = cloneDefaults();

  return {
    ...defaults,
    ...saved,
    version: SETTINGS_VERSION,
    company: { ...defaults.company, ...saved.company },
    theme: { ...defaults.theme, ...saved.theme },
    production: { ...defaults.production, ...saved.production },
    print: { ...defaults.print, ...saved.print },
    templates: { ...defaults.templates, ...saved.templates },
    navigation: Array.isArray(saved.navigation) ? saved.navigation : defaults.navigation,
    workspaceCards: Array.isArray(saved.workspaceCards) ? saved.workspaceCards : defaults.workspaceCards,
    roles: Array.isArray(saved.roles) ? saved.roles : defaults.roles,
    users: Array.isArray(saved.users) ? saved.users : defaults.users,
    journal: Array.isArray(saved.journal) ? saved.journal : defaults.journal,
  };
}

export const settingsRepository = {
  load(): AppSettings {
    if (typeof window === "undefined") return cloneDefaults();
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      return migrateSettings(raw ? JSON.parse(raw) : null);
    } catch {
      return cloneDefaults();
    }
  },

  save(settings: AppSettings): void {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...settings, version: SETTINGS_VERSION }));
  },

  reset(): AppSettings {
    const settings = cloneDefaults();
    if (typeof window !== "undefined") window.localStorage.removeItem(STORAGE_KEY);
    return settings;
  },
};
