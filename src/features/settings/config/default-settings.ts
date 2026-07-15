import {
  SETTINGS_VERSION,
  type AppSettings,
  type CapacitySettings,
  type MachineSettings,
  type ModulePermission,
  type NavigationItemConfig,
  type OrderedStandardSettings,
  type PrioritySettings,
  type StatusSettings,
  type TaskTypeSettings,
} from "@/features/settings/types/settings";
import { DEFAULT_AI_BUDGET_POLICY } from "@/features/ai/config/ai-budget-policy";
import { MAIL_MEMORY_DEFAULTS } from "@/features/mail-memory/config/mail-memory-defaults";

function productionMachine(
  id: string,
  name: string,
  departmentId: string,
  department: string,
  machineType: string,
): Omit<MachineSettings, "order"> {
  return {
    id,
    active: true,
    name,
    displayName: name,
    department,
    departmentId,
    machineType,
    color: "",
    photoDataUrl: "",
    technicalInformation: "",
  };
}

function standard(
  id: string,
  value: string,
  label: string,
  color: string,
  textColor: string,
  order: number,
): OrderedStandardSettings {
  return { id, value, label, color, textColor, active: true, order };
}

function capacity(
  id: string,
  label: string,
  targetId: string,
  hoursPerDay: number,
  order: number,
): CapacitySettings {
  return { id, label, active: true, order, scope: "department", targetId, hoursPerDay, workingDays: [1, 2, 3, 4, 5], exceptions: [] };
}

export const defaultNavigation: NavigationItemConfig[] = [
  { id: "workspace", label: "Mon Espace", icon: "home", href: "/", visible: true, order: 1 },
  { id: "mails", label: "Mails", icon: "mail", href: "/mails", visible: true, order: 2 },
  { id: "actions", label: "Actions", icon: "check", href: "/actions", visible: true, order: 3 },
  { id: "planning", label: "Planning", icon: "calendar", href: "/planning", visible: true, order: 4 },
  { id: "work-orders", label: "OF", icon: "list", href: "/of", visible: true, order: 5 },
  { id: "meetings", label: "Réunions", icon: "meeting", href: "/reunions", visible: true, order: 6 },
  { id: "tracking", label: "Suivi", icon: "tracking", href: "/suivi", visible: true, order: 7 },
  { id: "machines", label: "Parc Machines", icon: "factory", href: "/machines", visible: true, order: 8 },
  { id: "erp-quality", label: "Qualité ERP", icon: "quality", href: "/qualite-erp", visible: true, order: 9 },
  { id: "analytics", label: "Analyses", icon: "chart", href: "/analyses", visible: true, order: 10 },
  { id: "settings", label: "Réglages", icon: "settings", href: "/reglages", visible: true, order: 11 },
];

const fullPermission: ModulePermission = {
  visible: true,
  view: true,
  create: true,
  edit: true,
  delete: true,
  print: true,
  export: true,
  administer: true,
};

const viewPermission: ModulePermission = {
  visible: true,
  view: true,
  create: false,
  edit: false,
  delete: false,
  print: true,
  export: false,
  administer: false,
};

const hiddenPermission: ModulePermission = {
  visible: false,
  view: false,
  create: false,
  edit: false,
  delete: false,
  print: false,
  export: false,
  administer: false,
};

function permissionsFor(mode: "admin" | "view" | "operator") {
  return Object.fromEntries(
    defaultNavigation.map((item) => {
      if (mode === "admin") return [item.id, { ...fullPermission }];
      if (item.id === "settings") return [item.id, { ...hiddenPermission }];
      if (mode === "operator" && ["analytics", "erp-quality"].includes(item.id)) {
        return [item.id, { ...hiddenPermission }];
      }
      return [item.id, { ...viewPermission, create: mode === "operator" && item.id === "actions" }];
    }),
  );
}

export const defaultSettings: AppSettings = {
  version: SETTINGS_VERSION,
  navigation: defaultNavigation,
  workspaceCards: [
    { id: "mails", label: "Mails", icon: "mail", color: "#2563eb", size: "medium", description: "Consultez les messages récents et préparez les prochaines actions.", status: "À traiter", counter: 6, priorityLevel: "Haute", href: "/mails", visible: true, order: 1 },
    { id: "open-actions", label: "Actions ouvertes", icon: "check", color: "#d97706", size: "medium", description: "Suivez les décisions, responsables et échéances en cours.", status: "Prioritaire", counter: 3, priorityLevel: "Urgente", href: "/actions", visible: true, order: 2 },
    { id: "planning", label: "Planning", icon: "calendar", color: "#7c3aed", size: "medium", description: "Repérez les conflits et les arbitrages machines à préparer.", status: "À vérifier", counter: 2, priorityLevel: "Haute", href: "/planning", visible: true, order: 3 },
    { id: "qrqc", label: "QRQC", icon: "meeting", color: "#059669", size: "small", description: "Préparez les points critiques du rituel quotidien.", status: "Prêt", counter: 1, priorityLevel: "Normale", href: "/reunions/qrqc", visible: true, order: 4 },
    { id: "production-meeting", label: "Réunion Production", icon: "dashboard", color: "#2563eb", size: "wide", description: "Rassemblez les décisions, les blocages et les actions à suivre.", status: "Demain à 09 h 30", counter: 0, priorityLevel: "Normale", href: "/reunions/production", visible: true, order: 5 },
    { id: "machines", label: "Parc Machines", icon: "factory", color: "#dc2626", size: "small", description: "Surveillez les indisponibilités et les maintenances planifiées.", status: "1 alerte", counter: 1, priorityLevel: "Urgente", href: "/machines", visible: true, order: 6 },
    { id: "requests", label: "Centre de demandes", icon: "inbox", color: "#0d9488", size: "medium", description: "Centralisez les demandes internes qui nécessitent une décision.", status: "En attente", counter: 4, priorityLevel: "Haute", href: "/suivi", visible: true, order: 7 },
    { id: "erp-quality", label: "Qualité ERP", icon: "quality", color: "#9333ea", size: "medium", description: "Traitez les incohérences qui fragilisent le planning.", status: "À corriger", counter: 4, priorityLevel: "Haute", href: "/qualite-erp", visible: true, order: 8 },
  ],
  company: {
    name: "ProdPilot IA",
    logoDataUrl: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    footerText: "Document généré par ProdPilot IA",
  },
  theme: {
    primary: "#1d4ed8",
    secondary: "#020617",
    success: "#059669",
    warning: "#d97706",
    danger: "#dc2626",
    information: "#2563eb",
    background: "#f8fafc",
    card: "#ffffff",
    border: "#e2e8f0",
    text: "#0f172a",
  },
  production: {
    machines: [
      productionMachine("TOU-01", "MAZAK INTEGREX 300", "turning", "Tournage", "Tournage / Fraisage"),
      productionMachine("TOU-02", "MAZAK NEXUS 200MSY", "turning", "Tournage", "Tournage / Fraisage"),
      productionMachine("TOU-03", "GRAZIANO GT300", "turning", "Tournage", "Tournage / Fraisage"),
      productionMachine("TOU-04", "MAZAK INTEGREX 150", "turning", "Tournage", "Tournage / Fraisage"),
      productionMachine("TOU-05", "OKUMA LB15 II-C", "turning", "Tournage", "Tournage"),
      productionMachine("TOU-06", "Tour CNC HYUNDAI-KIA SKT 250", "turning", "Tournage", "Tournage"),
      productionMachine("TOU-07", "OKUMA LB25 II-C", "turning", "Tournage", "Tournage"),
      productionMachine("TOU-08", "Mazak Quick Turn Smart 350", "turning", "Tournage", "Tournage"),
      productionMachine("TOU-09", "TOUR trad. Pinacho", "turning", "Tournage", "Tournage"),
      productionMachine("FRA-01", "MAZAK VTC-200C-II", "milling", "Fraisage", "Fraisage 3 axes"),
      productionMachine("FRA-02", "MAZAK NEXUS 410 A II", "milling", "Fraisage", "Fraisage 3 axes"),
      productionMachine("FRA-03", "HEDELIUS CB70", "milling", "Fraisage", "Fraisage 3 axes"),
      productionMachine("FRA-04", "AKIRA SEIKI V4.5", "milling", "Fraisage", "Fraisage 3 axes"),
      productionMachine("FRA-05", "Fraiseuse DMC 1035 (B)", "milling", "Fraisage", "Fraisage 3 axes"),
      productionMachine("FRA-06", "Mikron VCE 800 PRO", "milling", "Fraisage", "Fraisage 3 axes"),
      productionMachine("FRA-07", "DMG DMC 635", "milling", "Fraisage", "Fraisage 3 axes"),
      productionMachine("FRA-08", "DECKEL MAHO DMC 1035V", "milling", "Fraisage", "Fraisage 3 axes"),
      productionMachine("FRA-09", "DECKEL MAHO DMC 64V linear", "milling", "Fraisage", "Fraisage 3 axes"),
      productionMachine("FRA-10", "HEDELIUS ACURA 65 EL", "milling", "Fraisage", "Fraisage 5 axes"),
      productionMachine("FRA-11", "MAZAK CV5-500 + robot", "milling", "Fraisage", "Fraisage 5 axes"),
      productionMachine("FRA-12", "DMG MORI CMX50 U + PH150", "milling", "Fraisage", "Fraisage 5 axes"),
      productionMachine("FRA-13", "DMG MORI DMU50 + Robot", "milling", "Fraisage", "Fraisage 5 axes"),
      productionMachine("FRA-14", "DECKEL MAHO DMU 60 (1)", "milling", "Fraisage", "Fraisage 5 axes"),
      productionMachine("FRA-15", "DECKEL MAHO DMU 60 (2)", "milling", "Fraisage", "Fraisage 5 axes"),
      productionMachine("FRA-16", "DMG MORI SEIKI DMU50 (Ecoline)", "milling", "Fraisage", "Fraisage 5 axes"),
      productionMachine("FRA-17", "MAZAK VTC 800", "milling", "Fraisage", "Fraisage 5 axes"),
      productionMachine("FIL-01", "MITSUBISHI FA30S", "wire-cutting", "Découpe fil", "Découpe fil"),
      productionMachine("FIL-02", "MV 2400R connect", "wire-cutting", "Découpe fil", "Découpe fil"),
    ].map((machine, order) => ({ ...machine, order })),
    departments: [
      { ...standard("turning", "Tournage", "Tournage", "#2563eb", "#ffffff", 0) },
      { ...standard("milling", "Fraisage", "Fraisage", "#7c3aed", "#ffffff", 1) },
      { ...standard("wire-cutting", "Découpe fil", "Découpe fil", "#0d9488", "#ffffff", 2) },
      { ...standard("quality", "Qualité", "Qualité", "#0891b2", "#ffffff", 3) },
      { ...standard("maintenance", "Maintenance", "Maintenance", "#d97706", "#ffffff", 4) },
    ],
    capacities: [
      capacity("capacity-turning", "Capacité Tournage", "turning", 8, 0),
      capacity("capacity-milling", "Capacité Fraisage", "milling", 8, 1),
      capacity("capacity-wire-cutting", "Capacité Découpe fil", "wire-cutting", 16, 2),
    ],
    priorities: [
      { ...standard("priority-low", "Basse", "Basse", "#64748b", "#ffffff", 0), highlight: false },
      { ...standard("priority-normal", "Normale", "Normale", "#2563eb", "#ffffff", 1), highlight: false },
      { ...standard("priority-high", "Haute", "Haute", "#d97706", "#ffffff", 2), highlight: true },
      { ...standard("priority-urgent", "Urgente", "Urgente", "#dc2626", "#ffffff", 3), highlight: true },
      { ...standard("priority-blocking", "Bloquante", "Bloquante", "#991b1b", "#ffffff", 4), highlight: true },
    ] satisfies PrioritySettings[],
    statuses: [
      { ...standard("status-unplanned", "À planifier", "À planifier", "#f8fafc", "#475569", 0), behavior: "neutral" },
      { ...standard("status-planned", "Planifiée", "Planifiée", "#e2e8f0", "#334155", 1), behavior: "planned" },
      { ...standard("status-setup", "En réglage", "En réglage", "#fbbf24", "#451a03", 2), behavior: "in-progress" },
      { ...standard("status-progress", "En cours", "En cours", "#1d4ed8", "#ffffff", 3), behavior: "in-progress" },
      { ...standard("status-completed", "Terminée", "Terminée", "#059669", "#ffffff", 4), behavior: "completed" },
      { ...standard("status-blocked", "Bloquée", "Bloquée", "#fee2e2", "#991b1b", 5), behavior: "blocked" },
    ] satisfies StatusSettings[],
    maintenanceStatuses: [
      { ...standard("maintenance-planned", "Prévue", "Prévue", "#e2e8f0", "#334155", 0), behavior: "planned" },
      { ...standard("maintenance-progress", "En cours", "En cours", "#1d4ed8", "#ffffff", 1), behavior: "in-progress" },
      { ...standard("maintenance-completed", "Terminée", "Terminée", "#059669", "#ffffff", 2), behavior: "completed" },
      { ...standard("maintenance-postponed", "Reportée", "Reportée", "#fbbf24", "#451a03", 3), behavior: "neutral" },
    ] satisfies StatusSettings[],
    taskTypes: [
      { ...standard("task-maintenance", "Maintenance", "Maintenance", "#7c3aed", "#ffffff", 0), category: "maintenance" },
      { ...standard("task-other", "Divers", "Divers", "#0d9488", "#ffffff", 1), category: "other" },
    ] satisfies TaskTypeSettings[],
    maintenanceTypes: [
      standard("maintenance-preventive", "Préventive", "Préventive", "#7c3aed", "#ffffff", 0),
      standard("maintenance-cleaning", "Nettoyage", "Nettoyage", "#0d9488", "#ffffff", 1),
      standard("maintenance-lubrication", "Lubrification", "Lubrification", "#d97706", "#ffffff", 2),
      standard("maintenance-calibration", "Étalonnage", "Étalonnage", "#0891b2", "#ffffff", 3),
      standard("maintenance-inspection", "Inspection", "Inspection", "#2563eb", "#ffffff", 4),
      standard("maintenance-intervention", "Intervention", "Intervention", "#dc2626", "#ffffff", 5),
      standard("maintenance-other", "Autre", "Autre", "#64748b", "#ffffff", 6),
    ],
    planning: { allDepartmentsLabel: "Tous", defaultCapacityHours: 8, workingDays: [1, 2, 3, 4, 5], weekStartsOn: 1, visibleWeeks: 4, loadWarningPercent: 80, loadCriticalPercent: 95 },
    workOrderTypes: ["Production", "Retouche", "Prototype", "Urgence client", "Sous-traitance"],
  },
  roles: [
    { id: "administrator", name: "Administrateur", permissions: permissionsFor("admin") },
    { id: "production-manager", name: "Responsable de production", permissions: permissionsFor("admin") },
    { id: "planner", name: "Planificateur", permissions: permissionsFor("view") },
    { id: "supervisor", name: "Chef d’équipe", permissions: permissionsFor("view") },
    { id: "operator", name: "Opérateur", permissions: permissionsFor("operator") },
    { id: "quality", name: "Qualité", permissions: permissionsFor("view") },
    { id: "direction", name: "Direction", permissions: permissionsFor("view") },
    { id: "read-only", name: "Lecture seule", permissions: permissionsFor("view") },
  ],
  users: [
    { id: "user-daniel", active: true, firstName: "Daniel", lastName: "Mülverstedt", email: "daniel@exemple.fr", roleId: "administrator" },
    { id: "user-planning", active: true, firstName: "Sophie", lastName: "Planification", email: "planning@exemple.fr", roleId: "planner" },
    { id: "user-quality", active: true, firstName: "Julie", lastName: "Qualité", email: "qualite@exemple.fr", roleId: "quality" },
  ],
  activeRoleId: "administrator",
  print: {
    paperSize: "A4",
    orientation: "landscape",
    columns: [
      ["logo", "Logo"], ["company", "Nom société"], ["machine", "Machine"], ["datetime", "Date et heure"],
      ["work-order", "Numéro d’OF"], ["customer", "Client"], ["article", "Référence article"], ["description", "Description"],
      ["quantity", "Quantité"], ["operation", "Opération"], ["planned-time", "Temps planifié"], ["planned-date", "Date planifiée"], ["priority", "Priorité"],
      ["delivery-date", "Date de livraison"], ["comments", "Commentaires"], ["completed", "Case terminé"], ["problem", "Case problème"],
    ].map(([id, label], order) => ({ id, label, visible: true, order, placement: ["logo", "company", "datetime"].includes(id) ? "header" as const : "table" as const })),
  },
  ai: {
    enabled: true,
    provider: "openai",
    preferredResponseLanguage: "fr",
    defaultTone: "professional",
    defaultLength: "medium",
    includeSignature: true,
    maximumThreadMessages: 4,
    maximumInputContextTokens: 4_000,
    maximumAnalysisOutputTokens: 1_200,
    maximumReplyOutputTokens: 900,
    maximumRewriteOutputTokens: 500,
    includeAttachmentMetadata: true,
    displayConfidence: true,
    displayJustification: true,
    allowDraftCreation: true,
    allowSending: false,
    retainLocalAnalysisCache: true,
    analysisExpirationMinutes: 1_440,
    longThreadWarningThreshold: 3_000,
    allowStrongerModelEscalation: false,
    budgetPolicy: { ...DEFAULT_AI_BUDGET_POLICY },
    pricingRegistry: [],
    firstUseChecklist: { platformAccountCreated: false, billingConfigured: false, applicationRestarted: false },
    privacyAcknowledgedAt: null,
    categories: [
      standard("mail-category-reply", "reply_required", "Réponse nécessaire", "#d97706", "#ffffff", 0),
      standard("mail-category-action", "action_required", "Action à créer", "#7c3aed", "#ffffff", 1),
      standard("mail-category-urgent", "urgent", "Urgent", "#dc2626", "#ffffff", 2),
      standard("mail-category-information", "information", "Information", "#2563eb", "#ffffff", 3),
      standard("mail-category-delegate", "delegate", "À déléguer", "#0d9488", "#ffffff", 4),
      standard("mail-category-verify", "verify", "À vérifier", "#0891b2", "#ffffff", 5),
      standard("mail-category-archive", "archive", "À archiver", "#64748b", "#ffffff", 6),
    ],
    showCachedResultBadge: true,
    showTokenUsage: true,
    automaticAnalysis: false,
    automaticDraftCreation: false,
  },
  mailMemory: { ...MAIL_MEMORY_DEFAULTS },
  templates: {
    mail: "Bonjour {responsable},\n\nVoici le point à traiter : {sujet}.\n\nMerci,\nDaniel",
    qrqc: "QRQC du {date}\n\nBlocages : {blocages}\nActions : {actions}",
    meeting: "Réunion de production du {date}\n\nDécisions : {decisions}\nActions : {actions}",
    report: "Document généré par ProdPilot IA",
    ai: "Répondre en français, de manière directe et orientée action.",
  },
  journal: [],
};
