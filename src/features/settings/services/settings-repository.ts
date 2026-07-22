import { defaultSettings } from "@/features/settings/config/default-settings";
import { parseAiBudgetPolicy, parseAiPricingRegistry } from "@/features/ai/validation/ai-budget-input";
import {
  SETTINGS_VERSION,
  type ActionColumnSettings,
  type ActionsSettings,
  type AppSettings,
  type CapacitySettings,
  type DepartmentSettings,
  type MachineSettings,
  type MailTemplateSettings,
  type OrderedStandardSettings,
  type ProductionSettings,
} from "@/features/settings/types/settings";

const STORAGE_KEY = "prodpilot.settings";
const PREVIOUS_DEFAULT_MACHINE_IDS = ["TOU-01", "FRA-01", "FRA-10", "FIL-01"];

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
  return isRecord(value) && hasStrings(value, stringKeys) && hasBooleans(value, booleanKeys) &&
    typeof value.order === "number" && Number.isFinite(value.order);
}

function isStandard(value: unknown): value is OrderedStandardSettings {
  return isOrderedItem(value, ["id", "value", "label", "color", "textColor"], ["active"]);
}

function isSettings(value: unknown): value is AppSettings {
  if (!isRecord(value)) return false;
  const navigationValid = Array.isArray(value.navigation) && value.navigation.every((item) => isOrderedItem(item, ["id", "label", "icon", "href"], ["visible"]));
  const cardsValid = Array.isArray(value.workspaceCards) && value.workspaceCards.every((item) => isOrderedItem(item, ["id", "label", "icon", "color", "size", "description", "status", "href", "priorityLevel"], ["visible"]) && isRecord(item) && ["small", "medium", "wide"].includes(String(item.size)) && typeof item.counter === "number" && Number.isFinite(item.counter));
  const companyValid = isRecord(value.company) && hasStrings(value.company, ["name", "logoDataUrl", "address", "phone", "email", "website", "footerText"]);
  const themeValid = isRecord(value.theme) && hasStrings(value.theme, ["primary", "secondary", "success", "warning", "danger", "information", "background", "card", "border", "text"]);
  const production = isRecord(value.production) ? value.production : null;
  const productionValid = production !== null &&
    Array.isArray(production.machines) && production.machines.every((machine) => isRecord(machine) && hasStrings(machine, ["id", "name", "displayName", "department", "departmentId", "machineType", "color", "photoDataUrl", "technicalInformation"]) && typeof machine.active === "boolean" && typeof machine.order === "number" && (machine.erpCode === undefined || typeof machine.erpCode === "string") && (machine.deleted === undefined || typeof machine.deleted === "boolean") && (machine.favorite === undefined || typeof machine.favorite === "boolean") && (machine.futureCapacityHours === undefined || machine.futureCapacityHours === null || typeof machine.futureCapacityHours === "number") && (machine.comments === undefined || typeof machine.comments === "string")) &&
    Array.isArray(production.departments) && production.departments.every(isStandard) &&
    Array.isArray(production.priorities) && production.priorities.every((item) => isStandard(item) && isRecord(item) && typeof item.highlight === "boolean") &&
    [production.statuses, production.maintenanceStatuses].every((items) => Array.isArray(items) && items.every((item) => isStandard(item) && isRecord(item) && ["planned", "in-progress", "blocked", "completed", "neutral"].includes(String(item.behavior)))) &&
    Array.isArray(production.taskTypes) && production.taskTypes.every((item) => isStandard(item) && isRecord(item) && ["maintenance", "other"].includes(String(item.category))) &&
    Array.isArray(production.maintenanceTypes) && production.maintenanceTypes.every(isStandard) &&
    Array.isArray(production.capacities) && production.capacities.every((item) => isRecord(item) && hasStrings(item, ["id", "label", "scope", "targetId"]) && ["department", "machine"].includes(String(item.scope)) && typeof item.active === "boolean" && typeof item.order === "number" && Number.isFinite(item.order) && typeof item.hoursPerDay === "number" && Number.isFinite(item.hoursPerDay) && Array.isArray(item.workingDays) && item.workingDays.every((day) => typeof day === "number" && Number.isInteger(day) && day >= 0 && day <= 6) && Array.isArray(item.exceptions) && item.exceptions.every((exception) => isRecord(exception) && typeof exception.date === "string" && typeof exception.hours === "number" && Number.isFinite(exception.hours))) &&
    isRecord(production.planning) && hasStrings(production.planning, ["allDepartmentsLabel"]) && ["defaultCapacityHours", "weekStartsOn", "visibleWeeks", "loadWarningPercent", "loadCriticalPercent"].every((key) => isRecord(production.planning) && typeof production.planning[key] === "number" && Number.isFinite(production.planning[key])) && Array.isArray(production.planning.workingDays) && production.planning.workingDays.every((day) => typeof day === "number" && Number.isInteger(day) && day >= 0 && day <= 6) &&
    Array.isArray(production.workOrderTypes) && production.workOrderTypes.every((item) => typeof item === "string");
  const actionsValid = isRecord(value.actions)
    && Array.isArray(value.actions.origins) && value.actions.origins.every(isStandard)
    && Array.isArray(value.actions.columns) && value.actions.columns.every((column) => isOrderedItem(column, ["id", "label"], ["visible"]));
  const mailTemplatesValid = Array.isArray(value.mailTemplates) && value.mailTemplates.every((item) => isRecord(item) && hasStrings(item, ["id", "name", "subject", "body"]) && typeof item.active === "boolean" && typeof item.order === "number" && Number.isFinite(item.order));
  const rolesValid = Array.isArray(value.roles) && value.roles.every((role) => isRecord(role) && hasStrings(role, ["id", "name"]) && isRecord(role.permissions) && Object.values(role.permissions).every((permission) => isRecord(permission) && hasBooleans(permission, ["visible", "view", "create", "edit", "delete", "print", "export", "administer"])));
  const usersValid = Array.isArray(value.users) && value.users.every((user) => isRecord(user) && hasStrings(user, ["id", "firstName", "lastName", "email", "roleId"]) && typeof user.active === "boolean");
  const printValid = isRecord(value.print) && ["A4", "A3"].includes(String(value.print.paperSize)) && ["portrait", "landscape"].includes(String(value.print.orientation)) && Array.isArray(value.print.columns) && value.print.columns.every((column) => isOrderedItem(column, ["id", "label", "placement"], ["visible"]) && isRecord(column) && ["header", "table"].includes(String(column.placement)));
  const aiValid = isRecord(value.ai)
    && hasBooleans(value.ai, ["enabled", "includeSignature", "includeAttachmentMetadata", "displayConfidence", "displayJustification", "allowDraftCreation", "retainLocalAnalysisCache", "showCachedResultBadge", "showTokenUsage", "allowStrongerModelEscalation"])
    && value.ai.allowSending === false && value.ai.automaticAnalysis === false && value.ai.automaticDraftCreation === false
    && ["openai", "mock"].includes(String(value.ai.provider))
    && ["fr", "nl", "en", "de"].includes(String(value.ai.preferredResponseLanguage))
    && ["professional", "concise", "diplomatic", "direct", "technical", "internal", "customer", "supplier"].includes(String(value.ai.defaultTone))
    && ["short", "medium", "long"].includes(String(value.ai.defaultLength))
    && typeof value.ai.maximumThreadMessages === "number" && Number.isInteger(value.ai.maximumThreadMessages)
    && ["maximumInputContextTokens", "maximumAnalysisOutputTokens", "maximumReplyOutputTokens", "maximumRewriteOutputTokens", "longThreadWarningThreshold"].every((key) => isRecord(value.ai) && typeof value.ai[key] === "number" && Number.isInteger(value.ai[key]))
    && typeof value.ai.analysisExpirationMinutes === "number" && Number.isInteger(value.ai.analysisExpirationMinutes)
    && (value.ai.privacyAcknowledgedAt === null || typeof value.ai.privacyAcknowledgedAt === "string")
    && Array.isArray(value.ai.categories) && value.ai.categories.every(isStandard)
    && parseAiBudgetPolicy(value.ai.budgetPolicy) !== null
    && parseAiPricingRegistry(value.ai.pricingRegistry) !== null
    && isRecord(value.ai.firstUseChecklist) && hasBooleans(value.ai.firstUseChecklist, ["platformAccountCreated", "billingConfigured", "applicationRestarted"]);
  const memoryValid = isRecord(value.mailMemory)
    && hasBooleans(value.mailMemory, ["enabled", "indexSynchronizedMails", "storeCleanedMessageText", "keepSourceLinks", "storeAnalyses", "storeSessionHistory", "storeContactPreferences", "storeDecisions", "automaticCleanup", "offlineAccess", "showSourceLinks", "preferLocalResults", "askBeforeExpensiveAiCall"])
    && ["mailRetentionDays", "analysisRetentionDays", "sessionRetentionDays", "auditRetentionDays", "maximumLocalSizeMb"].every((key) => isRecord(value.mailMemory) && typeof value.mailMemory[key] === "number" && Number.isFinite(value.mailMemory[key]))
    && ["local_first", "balanced"].includes(String(value.mailMemory.aiEscalationMode))
    && (value.mailMemory.lastBackupAt === null || typeof value.mailMemory.lastBackupAt === "string");
  const assistantValid = isRecord(value.mailAssistant)
    && hasBooleans(value.mailAssistant, ["speakOpeningBrief", "askFollowUpQuestion", "autoListenAfterBrief", "includePendingDrafts", "includeMessagesWithoutStatus", "includeOverdueFollowUps", "includeInformationalMessages", "replayButtonVisible", "voiceEnabled", "voiceInteractionEnabled", "continuousConversation", "disableContinuousOnBlur", "transcriptPreview", "submitAutomatically", "voiceOutputEnabled", "writtenResponseEnabled", "speakConfirmations", "speakExecutionSummaries", "interruptAssistantBySpeaking"])
    && ["maximumItemsSpoken", "speechRate", "speechVolume", "silenceTimeoutSeconds", "pauseAfterSpeechMs", "speechPitch", "microphoneTestDurationSeconds"].every((key) => isRecord(value.mailAssistant) && typeof value.mailAssistant[key] === "number")
    && hasStrings(value.mailAssistant, ["briefDetail", "preferredLanguage", "preferredVoiceName", "listeningBehavior", "inputMode", "pushToTalkShortcut", "customShortcut", "recognitionLanguage", "assistantVoicePreset", "longAnswerSpeech", "ttsProvider", "selectedMicrophoneDeviceId", "preferredVoiceId", "preferredVoiceLocale", "voiceFallbackStrategy"]) && Array.isArray(value.mailAssistant.workflowStatuses);
  const templatesValid = isRecord(value.templates) && Object.values(value.templates).every((template) => typeof template === "string");
  const journalValid = Array.isArray(value.journal) && value.journal.every((entry) => isRecord(entry) && hasStrings(entry, ["id", "date", "description"]));
  return typeof value.version === "number" && typeof value.activeRoleId === "string" && navigationValid && cardsValid && companyValid && themeValid && productionValid && actionsValid && mailTemplatesValid && rolesValid && usersValid && printValid && aiValid && memoryValid && assistantValid && templatesValid && journalValid;
}

export function parseSettingsBackup(value: unknown): AppSettings | null {
  if (!isRecord(value) || typeof value.version !== "number" || !Array.isArray(value.navigation) || !isRecord(value.production) || !Array.isArray(value.production.machines)) return null;
  const migrated = migrateSettings(value);
  return isSettings(migrated) ? migrated : null;
}

function migrateSettings(value: unknown): AppSettings {
  if (!isRecord(value)) return cloneDefaults();
  const saved = value as Partial<AppSettings> & { production?: Record<string, unknown> };
  const defaults = cloneDefaults();
  const savedNavigation = Array.isArray(saved.navigation) ? saved.navigation : [];
  const savedCards = Array.isArray(saved.workspaceCards) ? saved.workspaceCards : [];
  return {
    ...defaults,
    ...saved,
    version: SETTINGS_VERSION,
    company: { ...defaults.company, ...(isRecord(saved.company) ? saved.company : {}) },
    theme: { ...defaults.theme, ...(isRecord(saved.theme) ? saved.theme : {}) },
    ai: {
      ...defaults.ai,
      ...(isRecord(saved.ai) ? saved.ai : {}),
      allowSending: false,
      automaticAnalysis: false,
      automaticDraftCreation: false,
      budgetPolicy: parseAiBudgetPolicy(isRecord(saved.ai) ? saved.ai.budgetPolicy : undefined) ?? defaults.ai.budgetPolicy,
      pricingRegistry: parseAiPricingRegistry(isRecord(saved.ai) ? saved.ai.pricingRegistry : undefined) ?? defaults.ai.pricingRegistry,
      firstUseChecklist: {
        ...defaults.ai.firstUseChecklist,
        ...(isRecord(saved.ai) && isRecord(saved.ai.firstUseChecklist) ? saved.ai.firstUseChecklist : {}),
      },
      categories: migrateStandards(isRecord(saved.ai) ? saved.ai.categories : undefined, defaults.ai.categories),
    },
    mailMemory: { ...defaults.mailMemory, ...(isRecord(saved.mailMemory) ? saved.mailMemory : {}) },
    mailAssistant: migrateMailAssistantSettings(saved.version, saved.mailAssistant, defaults.mailAssistant),
    production: migrateProductionSettings(saved.version, saved.production, defaults.production),
    actions: migrateActionsSettings(saved.actions, defaults.actions),
    mailTemplates: migrateMailTemplates(saved.mailTemplates, defaults.mailTemplates),
    print: {
      ...defaults.print,
      ...(isRecord(saved.print) ? saved.print : {}),
      columns: migratePrintColumns(isRecord(saved.print) ? saved.print.columns : undefined, defaults.print.columns),
    },
    templates: { ...defaults.templates, ...(isRecord(saved.templates) ? saved.templates : {}) },
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

function migrateMailAssistantSettings(savedVersion: number | undefined, value: unknown, defaults: AppSettings["mailAssistant"]): AppSettings["mailAssistant"] {
  const saved = isRecord(value) ? value : {};
  const migrated = { ...defaults, ...saved, workflowStatuses: Array.isArray(saved.workflowStatuses) ? saved.workflowStatuses as AppSettings["mailAssistant"]["workflowStatuses"] : defaults.workflowStatuses };
  if ((savedVersion ?? 0) < 14) {
    if (saved.inputMode === "push_to_talk" && saved.listeningBehavior === "push_to_talk") { migrated.inputMode = "click_to_talk"; migrated.listeningBehavior = "manual"; }
    if (saved.pushToTalkShortcut === "ctrl_space") migrated.pushToTalkShortcut = "f8";
    if (saved.assistantVoicePreset === "british_assistant" && saved.speechPitch === 0.9) { migrated.assistantVoicePreset = "system"; migrated.speechPitch = 1; }
  }
  return migrated;
}

function migrateProductionSettings(savedVersion: number | undefined, value: unknown, defaults: ProductionSettings): ProductionSettings {
  const saved = isRecord(value) ? value : {};
  const departments = migrateStandards(saved.departments, defaults.departments);
  return {
    ...defaults,
    machines: migrateProductionMachines(savedVersion, saved.machines, defaults.machines, departments),
    departments,
    capacities: migrateCapacities(saved.capacities, defaults.capacities, departments),
    priorities: migrateStandards(saved.priorities, defaults.priorities),
    statuses: migrateStandards(saved.statuses, defaults.statuses),
    maintenanceStatuses: migrateStandards(saved.maintenanceStatuses, defaults.maintenanceStatuses),
    taskTypes: migrateStandards(saved.taskTypes, defaults.taskTypes),
    maintenanceTypes: migrateStandards(saved.maintenanceTypes, defaults.maintenanceTypes),
    planning: isRecord(saved.planning) ? { ...defaults.planning, ...saved.planning } : defaults.planning,
    workOrderTypes: Array.isArray(saved.workOrderTypes) && saved.workOrderTypes.every((item) => typeof item === "string") ? saved.workOrderTypes : defaults.workOrderTypes,
  };
}

function migrateProductionMachines(savedVersion: number | undefined, value: unknown, defaults: MachineSettings[], departments: DepartmentSettings[]): MachineSettings[] {
  let machines = Array.isArray(value) ? value.filter(isRecord) : [];
  const isPreviousDefaultList = machines.length === PREVIOUS_DEFAULT_MACHINE_IDS.length && machines.every((machine, index) => machine.id === PREVIOUS_DEFAULT_MACHINE_IDS[index]);
  if ((savedVersion ?? 0) < 3 && isPreviousDefaultList) {
    const savedById = new Map(machines.map((machine) => [String(machine.id), machine]));
    machines = defaults.map((machine) => ({ ...machine, ...savedById.get(machine.id) }));
  }
  if (!machines.length) return defaults;
  const defaultById = new Map(defaults.map((machine) => [machine.id, machine]));
  return machines.map((machine, index) => {
    const id = typeof machine.id === "string" ? machine.id : `machine-${index + 1}`;
    const fallback = defaultById.get(id);
    const legacyDepartment = typeof machine.department === "string" ? machine.department : fallback?.department ?? "";
    const departmentId = typeof machine.departmentId === "string" ? machine.departmentId : departments.find((department) => department.value === legacyDepartment || department.label === legacyDepartment)?.id ?? "";
    const department = departments.find((item) => item.id === departmentId)?.label ?? legacyDepartment;
    return {
      ...fallback,
      id,
      active: typeof machine.active === "boolean" ? machine.active : fallback?.active ?? true,
      name: typeof machine.name === "string" ? machine.name : fallback?.name ?? id,
      displayName: typeof machine.displayName === "string" ? machine.displayName : fallback?.displayName ?? id,
      department,
      departmentId,
      machineType: typeof machine.machineType === "string" ? machine.machineType : fallback?.machineType ?? "",
      color: typeof machine.color === "string" ? machine.color : fallback?.color ?? "",
      order: typeof machine.order === "number" ? machine.order : index,
      photoDataUrl: typeof machine.photoDataUrl === "string" ? machine.photoDataUrl : fallback?.photoDataUrl ?? "",
      technicalInformation: typeof machine.technicalInformation === "string" ? machine.technicalInformation : fallback?.technicalInformation ?? "",
      erpCode: typeof machine.erpCode === "string" ? machine.erpCode : fallback?.erpCode ?? "",
      deleted: typeof machine.deleted === "boolean" ? machine.deleted : fallback?.deleted ?? false,
      favorite: typeof machine.favorite === "boolean" ? machine.favorite : fallback?.favorite ?? false,
      futureCapacityHours: machine.futureCapacityHours === null || typeof machine.futureCapacityHours === "number" ? machine.futureCapacityHours : fallback?.futureCapacityHours ?? null,
      comments: typeof machine.comments === "string" ? machine.comments : fallback?.comments ?? "",
    };
  });
}

function migrateStandards<T extends OrderedStandardSettings>(value: unknown, defaults: T[]): T[] {
  if (!Array.isArray(value) || !value.length) return defaults;
  return value.map((entry, index) => {
    if (typeof entry === "string") {
      const exact = defaults.find((item) => item.value === entry || item.label === entry);
      const fallback = exact ?? defaults[0];
      return { ...fallback, id: exact?.id ?? `standard-${slug(entry)}-${index}`, value: entry, label: entry, order: index } as T;
    }
    if (!isRecord(entry)) return { ...defaults[index % defaults.length], order: index };
    const fallback = defaults.find((item) => item.id === entry.id || item.value === entry.value) ?? defaults[0];
    return { ...fallback, ...entry, order: typeof entry.order === "number" ? entry.order : index } as T;
  });
}

function migrateCapacities(value: unknown, defaults: CapacitySettings[], departments: DepartmentSettings[]): CapacitySettings[] {
  if (!Array.isArray(value) || !value.length) return defaults;
  return value.map((entry, index) => {
    if (typeof entry === "string") {
      const department = departments.find((item) => entry.toLocaleLowerCase("fr").startsWith(item.value.toLocaleLowerCase("fr")) || entry.toLocaleLowerCase("fr").startsWith(item.label.toLocaleLowerCase("fr")));
      const parsedHours = Number(entry.match(/(\d+(?:[,.]\d+)?)\s*h/i)?.[1]?.replace(",", "."));
      const exact = defaults.find((item) => item.targetId === department?.id);
      const fallback = exact ?? defaults[0];
      return { ...fallback, id: exact?.id ?? `capacity-${slug(entry)}-${index}`, label: entry, targetId: department?.id ?? fallback?.targetId ?? "", hoursPerDay: Number.isFinite(parsedHours) ? parsedHours : fallback?.hoursPerDay ?? 0, order: index };
    }
    if (!isRecord(entry)) return { ...defaults[index % defaults.length], order: index };
    const fallback = defaults.find((item) => item.id === entry.id) ?? defaults[0];
    return {
      ...fallback,
      ...entry,
      order: typeof entry.order === "number" ? entry.order : index,
      workingDays: Array.isArray(entry.workingDays) ? entry.workingDays.filter((day): day is number => typeof day === "number") : fallback?.workingDays ?? [],
      exceptions: Array.isArray(entry.exceptions) ? entry.exceptions.filter((exception): exception is { date: string; hours: number } => isRecord(exception) && typeof exception.date === "string" && typeof exception.hours === "number") : fallback?.exceptions ?? [],
    } as CapacitySettings;
  });
}

function migrateMailTemplates(value: unknown, defaults: MailTemplateSettings[]): MailTemplateSettings[] {
  if (!Array.isArray(value)) return defaults;
  return value.filter(isRecord).map((template, index) => {
    const fallback = defaults.find((item) => item.id === template.id) ?? defaults[index % defaults.length];
    return { ...fallback, ...template, order: typeof template.order === "number" ? template.order : index } as MailTemplateSettings;
  });
}

function migrateActionsSettings(value: unknown, defaults: ActionsSettings): ActionsSettings {
  const saved = isRecord(value) ? value : {};
  return {
    origins: migrateStandards(saved.origins, defaults.origins),
    columns: migrateActionColumns(saved.columns, defaults.columns),
  };
}

function migrateActionColumns(value: unknown, defaults: ActionColumnSettings[]): ActionColumnSettings[] {
  if (!Array.isArray(value) || !value.length) return defaults;
  return value.filter(isRecord).map((column, index) => {
    const fallback = defaults.find((item) => item.id === column.id) ?? defaults[index % defaults.length];
    return { ...fallback, ...column, order: typeof column.order === "number" ? column.order : index } as ActionColumnSettings;
  });
}

function migratePrintColumns(value: unknown, defaults: AppSettings["print"]["columns"]): AppSettings["print"]["columns"] {
  if (!Array.isArray(value)) return defaults;
  return value.filter(isRecord).map((column, index) => {
    const fallback = defaults.find((item) => item.id === column.id) ?? defaults[0];
    return { ...fallback, ...column, order: typeof column.order === "number" ? column.order : index, placement: column.placement === "header" || column.placement === "table" ? column.placement : fallback?.placement ?? "table" };
  });
}

function slug(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("fr").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
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
    if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...settings, version: SETTINGS_VERSION }));
  },
  reset(): AppSettings {
    const settings = cloneDefaults();
    if (typeof window !== "undefined") window.localStorage.removeItem(STORAGE_KEY);
    return settings;
  },
};
