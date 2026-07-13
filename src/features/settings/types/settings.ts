export const SETTINGS_VERSION = 1;

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
  machineType: string;
  photoDataUrl: string;
  technicalInformation: string;
}

export interface ProductionSettings {
  machines: MachineSettings[];
  departments: string[];
  capacities: string[];
  priorities: string[];
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
  templates: Record<string, string>;
  journal: SettingsJournalEntry[];
}
