import type { AiBudgetPolicy, AiPricingEntry } from "@/features/ai/types/ai";
import type { MailMemorySettings } from "@/features/mail-memory/types/mail-memory";
import type { MailAssistantStartSettings } from "@/features/mail-assistant/types/mail-assistant";

export const SETTINGS_VERSION = 12;

export type CardSize = "small" | "medium" | "wide";

export interface NavigationItemConfig {
  id: string;
  label: string;
  icon: string;
  href: string;
  visible: boolean;
  order: number;
}

export interface WorkspaceCardConfig {
  id: string;
  label: string;
  icon: string;
  color: string;
  size: CardSize;
  description: string;
  status: string;
  counter: number;
  priorityLevel: "Basse" | "Normale" | "Haute" | "Urgente";
  href: string;
  visible: boolean;
  order: number;
}

export interface CompanyIdentity {
  name: string;
  logoDataUrl: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  footerText: string;
}

export interface ThemeSettings {
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  danger: string;
  information: string;
  background: string;
  card: string;
  border: string;
  text: string;
}

export interface MachineSettings {
  id: string;
  active: boolean;
  name: string;
  displayName: string;
  department: string;
  departmentId: string;
  machineType: string;
  color: string;
  order: number;
  photoDataUrl: string;
  technicalInformation: string;
  erpCode?: string;
  deleted?: boolean;
  favorite?: boolean;
  futureCapacityHours?: number | null;
  comments?: string;
}

export interface OrderedStandardSettings {
  id: string;
  value: string;
  label: string;
  color: string;
  textColor: string;
  active: boolean;
  order: number;
}

export interface DepartmentSettings extends OrderedStandardSettings {
  value: string;
}

export interface PrioritySettings extends OrderedStandardSettings {
  highlight: boolean;
}

export interface StatusSettings extends OrderedStandardSettings {
  behavior: "planned" | "in-progress" | "blocked" | "completed" | "neutral";
}

export interface TaskTypeSettings extends OrderedStandardSettings {
  category: "maintenance" | "other";
}

export interface CapacityExceptionSettings {
  date: string;
  hours: number;
}

export interface CapacitySettings {
  id: string;
  label: string;
  active: boolean;
  order: number;
  scope: "department" | "machine";
  targetId: string;
  hoursPerDay: number;
  workingDays: number[];
  exceptions: CapacityExceptionSettings[];
}

export interface PlanningSettings {
  allDepartmentsLabel: string;
  defaultCapacityHours: number;
  workingDays: number[];
  weekStartsOn: number;
  visibleWeeks: number;
  loadWarningPercent: number;
  loadCriticalPercent: number;
}

export interface ProductionSettings {
  machines: MachineSettings[];
  departments: DepartmentSettings[];
  capacities: CapacitySettings[];
  priorities: PrioritySettings[];
  statuses: StatusSettings[];
  maintenanceStatuses: StatusSettings[];
  taskTypes: TaskTypeSettings[];
  maintenanceTypes: OrderedStandardSettings[];
  planning: PlanningSettings;
  workOrderTypes: string[];
}

export interface ModulePermission {
  visible: boolean;
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  print: boolean;
  export: boolean;
  administer: boolean;
}

export interface RoleSettings {
  id: string;
  name: string;
  permissions: Record<string, ModulePermission>;
}

export interface UserSettings {
  id: string;
  active: boolean;
  firstName: string;
  lastName: string;
  email: string;
  roleId: string;
}

export interface PrintColumnSettings {
  id: string;
  label: string;
  visible: boolean;
  order: number;
  placement: "header" | "table";
}

export interface PrintSettings {
  paperSize: "A4" | "A3";
  orientation: "portrait" | "landscape";
  columns: PrintColumnSettings[];
}

export interface SettingsJournalEntry {
  id: string;
  date: string;
  description: string;
}

export type AiCategorySettings = OrderedStandardSettings;

export interface AiSettings {
  enabled: boolean;
  provider: "openai" | "mock";
  preferredResponseLanguage: "fr" | "nl" | "en" | "de";
  defaultTone: "professional" | "concise" | "diplomatic" | "direct" | "technical" | "internal" | "customer" | "supplier";
  defaultLength: "short" | "medium" | "long";
  includeSignature: boolean;
  maximumThreadMessages: number;
  maximumInputContextTokens: number;
  maximumAnalysisOutputTokens: number;
  maximumReplyOutputTokens: number;
  maximumRewriteOutputTokens: number;
  includeAttachmentMetadata: boolean;
  displayConfidence: boolean;
  displayJustification: boolean;
  allowDraftCreation: boolean;
  allowSending: false;
  retainLocalAnalysisCache: boolean;
  analysisExpirationMinutes: number;
  longThreadWarningThreshold: number;
  allowStrongerModelEscalation: boolean;
  budgetPolicy: AiBudgetPolicy;
  pricingRegistry: AiPricingEntry[];
  firstUseChecklist: {
    platformAccountCreated: boolean;
    billingConfigured: boolean;
    applicationRestarted: boolean;
  };
  privacyAcknowledgedAt: string | null;
  categories: AiCategorySettings[];
  showCachedResultBadge: boolean;
  showTokenUsage: boolean;
  automaticAnalysis: false;
  automaticDraftCreation: false;
}

export interface AppSettings {
  version: number;
  navigation: NavigationItemConfig[];
  workspaceCards: WorkspaceCardConfig[];
  company: CompanyIdentity;
  theme: ThemeSettings;
  production: ProductionSettings;
  roles: RoleSettings[];
  users: UserSettings[];
  activeRoleId: string;
  print: PrintSettings;
  ai: AiSettings;
  mailMemory: MailMemorySettings;
  mailAssistant: MailAssistantStartSettings;
  templates: Record<string, string>;
  journal: SettingsJournalEntry[];
}
