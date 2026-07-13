import { defaultSettings } from "@/features/settings/config/default-settings";
import { SETTINGS_VERSION, type AppSettings, type MachineSettings } from "@/features/settings/types/settings";

const STORAGE_KEY = "prodpilot.settings";

function cloneDefaults(): AppSettings {
  return structuredClone(defaultSettings);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasStrings(value: Record<string, unknown>, keys: string[]) {
  return keys.every((key) => typeof value[key] === "string");
}

function hasBooleans(value: Record<string, unknown>, keys: string[]) {
  return keys.every((key) => typeof value[key] === "boolean");
}

function isOrderedItem(value: unknown, stringKeys: string[], booleanKeys: string[] = []) {
  return (
    isRecord(value) &&
    hasStrings(value, stringKeys) &&
    hasBooleans(value, booleanKeys) &&
    typeof value.order === "number" &&
    Number.isFinite(value.order)
  );
}

function isSettings(value: unknown): value is AppSettings {
  if (!isRecord(value)) return false;

  const navigationValid = Array.isArray(value.navigation) && value.navigation.every((item) =>
    isOrderedItem(item, ["id", "label", "icon", "href"], ["visible"]),
  );
  const cardsValid = Array.isArray(value.workspaceCards) && value.workspaceCards.every((item) =>
    isOrderedItem(
      item,
      ["id", "label", "icon", "color", "size", "description", "status", "href", "priorityLevel"],
      ["visible"],
    ) && isRecord(item) && ["small", "medium", "wide"].includes(String(item.size)) &&
      typeof item.counter === "number" && Number.isFinite(item.counter),
  );
  const companyValid = isRecord(value.company) && hasStrings(value.company, [
    "name", "logoDataUrl", "address", "phone", "email", "website", "footerText",
  ]);
  const themeValid = isRecord(value.theme) && hasStrings(value.theme, [
    "primary", "secondary", "success", "warning", "danger", "information",
    "background", "card", "border", "text",
  ]);
  const production = isRecord(value.production) ? value.production : null;
  const productionValid = production !== null &&
    Array.isArray(production.machines) && production.machines.every((machine) =>
      isRecord(machine) &&
      hasStrings(machine, [
        "id", "name", "displayName", "department", "machineType", "photoDataUrl",
        "technicalInformation",
      ]) && typeof machine.active === "boolean",
    ) && ["departments", "capacities", "priorities", "workOrderTypes"].every((key) => {
      const entries = production[key];
      return Array.isArray(entries) && entries.every((item) => typeof item === "string");
    });
  const rolesValid = Array.isArray(value.roles) && value.roles.every((role) =>
    isRecord(role) && hasStrings(role, ["id", "name"]) && isRecord(role.permissions) &&
      Object.values(role.permissions).every((permission) =>
        isRecord(permission) && hasBooleans(permission, [
          "visible", "view", "create", "edit", "delete", "print", "export", "administer",
        ]),
      ),
  );
  const usersValid = Array.isArray(value.users) && value.users.every((user) =>
    isRecord(user) && hasStrings(user, ["id", "firstName", "lastName", "email", "roleId"]) &&
      typeof user.active === "boolean",
  );
  const printValid = isRecord(value.print) && ["A4", "A3"].includes(String(value.print.paperSize)) &&
    ["portrait", "landscape"].includes(String(value.print.orientation)) &&
    Array.isArray(value.print.columns) && value.print.columns.every((column) =>
      isOrderedItem(column, ["id", "label"], ["visible"]),
    );
  const templatesValid = isRecord(value.templates) &&
    Object.values(value.templates).every((template) => typeof template === "string");
  const journalValid = Array.isArray(value.journal) && value.journal.every((entry) =>
    isRecord(entry) && hasStrings(entry, ["id", "date", "description"]),
  );

  return (
    typeof value.version === "number" && Number.isFinite(value.version) &&
    typeof value.activeRoleId === "string" && navigationValid && cardsValid && companyValid &&
    themeValid && productionValid && rolesValid && usersValid && printValid &&
    templatesValid && journalValid
  );
}

export function parseSettingsBackup(value: unknown): AppSettings | null {
  if (!isSettings(value)) return null;
  return migrateSettings(value);
}

function migrateSettings(value: unknown): AppSettings {
  if (!value || typeof value !== "object") return cloneDefaults();
  const saved = value as Partial<AppSettings>;
  const defaults = cloneDefaults();

  const savedNavigation = Array.isArray(saved.navigation) ? saved.navigation : [];
  const savedCards = Array.isArray(saved.workspaceCards) ? saved.workspaceCards : [];
  const savedMachines = Array.isArray(saved.production?.machines) ? saved.production.machines : [];
  return {
    ...defaults,
    ...saved,
    version: SETTINGS_VERSION,
    company: { ...defaults.company, ...saved.company },
    theme: { ...defaults.theme, ...saved.theme },
    production: {
      ...defaults.production,
      ...saved.production,
      machines: migrateProductionMachines(saved.version, savedMachines, defaults.production.machines),
    },
    print: { ...defaults.print, ...saved.print },
    templates: { ...defaults.templates, ...saved.templates },
    navigation: defaults.navigation.map((item) => {
      const previous = savedNavigation.find((entry) => entry.id === item.id);
      return previous ? { ...item, ...previous, href: item.href } : item;
    }),
    workspaceCards: defaults.workspaceCards.map((item) => {
      const previous = savedCards.find((entry) => entry.id === item.id);
      return previous ? { ...item, ...previous, href: item.href, priorityLevel: item.priorityLevel } : item;
    }),
    roles: defaults.roles.map((role) => {
      const previous = Array.isArray(saved.roles) ? saved.roles.find((entry) => entry.id === role.id) : undefined;
      return previous ? { ...role, ...previous, permissions: { ...role.permissions, ...previous.permissions } } : role;
    }),
    users: Array.isArray(saved.users) ? saved.users : defaults.users,
    journal: Array.isArray(saved.journal) ? saved.journal : defaults.journal,
  };
}

const PREVIOUS_DEFAULT_MACHINE_IDS = ["TOU-01", "FRA-01", "FRA-10", "FIL-01"];

function migrateProductionMachines(
  savedVersion: number | undefined,
  savedMachines: MachineSettings[],
  defaultMachines: MachineSettings[],
): MachineSettings[] {
  if (!savedMachines.length) return defaultMachines;
  if ((savedVersion ?? 0) >= 3) return savedMachines;

  const isPreviousDefaultList = savedMachines.length === PREVIOUS_DEFAULT_MACHINE_IDS.length &&
    savedMachines.every((machine, index) => machine.id === PREVIOUS_DEFAULT_MACHINE_IDS[index]);
  if (!isPreviousDefaultList) return savedMachines;

  const savedById = new Map(savedMachines.map((machine) => [machine.id, machine]));
  return defaultMachines.map((machine) => ({ ...machine, ...savedById.get(machine.id) }));
}

export const settingsRepository = {
  load(): AppSettings {
    if (typeof window === "undefined") return cloneDefaults();
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const settings = migrateSettings(raw ? JSON.parse(raw) : null);
      return isSettings(settings) ? settings : cloneDefaults();
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
