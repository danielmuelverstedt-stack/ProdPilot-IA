import type { AiBudgetPolicy, AiPricingEntry } from "@/features/ai/types/ai";
import type { MailMemorySettings } from "@/features/mail-memory/types/mail-memory";
import type { MailAssistantStartSettings } from "@/features/mail-assistant/types/mail-assistant";

export const SETTINGS_VERSION = 19;

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

// La photo n'est plus stockée ici : voir useMachinePhotos() (IndexedDB, src/features/machines/services/machine-photo-store.ts),
// pour ne pas soumettre les Réglages au quota localStorage.
export interface MachineSettings {
  id: string;
  active: boolean;
  visible: boolean;
  name: string;
  displayName: string;
  department: string;
  departmentId: string;
  machineType: string;
  color: string;
  order: number;
  /** Hall d'implantation dans le Planning Atelier ; `null`/absent = machine non affectée. */
  hallId?: string | null;
  /** Position verticale de la machine à l'intérieur de son hall. */
  hallOrder?: number;
  technicalInformation: string;
  deleted?: boolean;
  favorite?: boolean;
  futureCapacityHours?: number | null;
  comments?: string;
  /** Code de catégorie de tâche ERP (voir task-category-dictionary.ts), assigné manuellement à la machine ; `null`/absent = non catégorisée. */
  taskCategoryCode?: string | null;
  /** `"poste"` = poste de travail sans machine physique (ex. Ébavurage), planifiable comme une machine mais sans fiche technique pertinente ; absent/`"machine"` = machine physique. */
  kind?: "machine" | "poste";
  // TODO : futurs champs métier centralisés : maintenanceStatus, maintenanceDueDate,
  // capacityProfile, calendarId, robotId, kpiConfiguration, toolMagazine, skillsRequired.
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
  /** Hall d'affichage dans le Planning Atelier ; `null`/absent = catégorie encore non affectée. */
  hallId?: string | null;
  /** Position verticale de la catégorie à l'intérieur de son hall. */
  hallOrder?: number;
  /**
   * `"physical"` : le contenu de l'onglet Atelier vient uniquement des machines dont la fiche
   * indique ce département (`MachineSettings.departmentId`), sans lien par catégorie — le cas des
   * départements de production (Tournage, Fraisage, Découpe fil), où une machine ne doit jamais
   * apparaître ailleurs que dans son propre département sous prétexte qu'elle porte ponctuellement
   * une opération d'une autre catégorie (ex. une machine tourno-fraiseuse). `"linked"` (ou absent,
   * comportement par défaut) : le contenu vient de `linkedCategoryCodes`/`linkedMachineIds`,
   * indépendamment du département physique — nécessaire pour Qualité/Maintenance, qui n'ont
   * structurellement aucune machine physiquement rattachée.
   */
  membershipMode?: "physical" | "linked";
  /** Codes de catégorie de tâche (task-category-dictionary.ts) rattachés à ce département dans l'Atelier ; absent/vide = aucune. Ignoré si `membershipMode` vaut `"physical"`. */
  linkedCategoryCodes?: string[];
  /** Machines rattachées individuellement à ce département dans l'Atelier, en plus de celles couvertes par `linkedCategoryCodes`. Ignoré si `membershipMode` vaut `"physical"`. */
  linkedMachineIds?: string[];
}

export type HallSettings = OrderedStandardSettings;

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
  halls: HallSettings[];
  capacities: CapacitySettings[];
  priorities: PrioritySettings[];
  statuses: StatusSettings[];
  maintenanceStatuses: StatusSettings[];
  taskTypes: TaskTypeSettings[];
  maintenanceTypes: OrderedStandardSettings[];
  /** Statuts proposés pour le suivi daté d'un OF à l'étape « Cinq projets critiques » de la réunion Production (`ProjetSuiviEntry.statut` référence la `value` d'un de ces statuts). */
  projetSuiviStatuses: OrderedStandardSettings[];
  planning: PlanningSettings;
  workOrderTypes: string[];
  /**
   * @deprecated Plus lu/écrit par l'UI (Cockpit ERP/Planning capacité/Atelier lisent désormais
   * `useVisibleTaskCategoryCodes()`, `src/lib/visible-task-categories-store.ts` — un store dédié,
   * séparé des Réglages pour ne pas cloner/réécrire tout l'arbre `AppSettings` à chaque changement
   * de catégorie, un réglage qui change très fréquemment). Champ conservé ici uniquement pour la
   * compatibilité de lecture des anciennes sauvegardes/exports (`settings-repository.ts` migre sa
   * valeur vers le nouveau store à la première hydratation) ; ne plus l'utiliser dans du nouveau code.
   */
  visibleTaskCategoryCodes: string[];
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
export type ActionOriginSettings = OrderedStandardSettings;
export type ContactCategorySettings = OrderedStandardSettings;

export interface ActionColumnSettings {
  id: string;
  label: string;
  visible: boolean;
  order: number;
}

export interface ActionsSettings {
  origins: ActionOriginSettings[];
  columns: ActionColumnSettings[];
}

export interface ContactsSettings {
  categories: ContactCategorySettings[];
}

export interface MailTemplateSettings {
  id: string;
  name: string;
  subject: string;
  body: string;
  active: boolean;
  order: number;
}

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
  actions: ActionsSettings;
  contacts: ContactsSettings;
  mailTemplates: MailTemplateSettings[];
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
