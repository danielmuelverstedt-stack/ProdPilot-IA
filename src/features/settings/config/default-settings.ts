import {
  SETTINGS_VERSION,
  type AppSettings,
  type ModulePermission,
  type NavigationItemConfig,
} from "@/features/settings/types/settings";

export const defaultNavigation: NavigationItemConfig[] = [
  { id: "workspace", label: "Mon Espace", icon: "home", href: "/", visible: true, order: 1 },
  { id: "dashboard", label: "Tableau de bord", icon: "dashboard", href: "/modules/tableau-de-bord", visible: true, order: 2 },
  { id: "planning", label: "Planning", icon: "calendar", href: "/modules/planning", visible: true, order: 3 },
  { id: "work-orders", label: "OF", icon: "list", href: "/modules/of", visible: true, order: 4 },
  { id: "meetings", label: "Réunions", icon: "meeting", href: "/modules/reunions", visible: true, order: 5 },
  { id: "actions", label: "Actions", icon: "check", href: "/modules/actions", visible: true, order: 6 },
  { id: "erp-quality", label: "Qualité ERP", icon: "quality", href: "/modules/qualite-erp", visible: true, order: 7 },
  { id: "machines", label: "Parc Machines", icon: "factory", href: "/modules/parc-machines", visible: true, order: 8 },
  { id: "tracking", label: "Suivi", icon: "tracking", href: "/modules/suivi", visible: true, order: 9 },
  { id: "analytics", label: "Analyses", icon: "chart", href: "/modules/analyses", visible: true, order: 10 },
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
      if (mode === "operator" && ["dashboard", "analytics", "erp-quality"].includes(item.id)) {
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
    { id: "mails", label: "Mails", icon: "mail", color: "#2563eb", size: "medium", description: "Consultez les messages récents et préparez les prochaines actions.", status: "À traiter", counter: 6, href: "/mails", visible: true, order: 1 },
    { id: "open-actions", label: "Actions ouvertes", icon: "check", color: "#d97706", size: "medium", description: "Suivez les décisions, responsables et échéances en cours.", status: "Prioritaire", counter: 3, href: "/modules/actions", visible: true, order: 2 },
    { id: "planning", label: "Planning", icon: "calendar", color: "#7c3aed", size: "medium", description: "Repérez les conflits et les arbitrages machines à préparer.", status: "À vérifier", counter: 2, href: "/modules/planning", visible: true, order: 3 },
    { id: "qrqc", label: "QRQC", icon: "meeting", color: "#059669", size: "small", description: "Préparez les points critiques du rituel quotidien.", status: "Prêt", counter: 1, href: "/modules/reunions", visible: true, order: 4 },
    { id: "production-meeting", label: "Réunion Production", icon: "dashboard", color: "#2563eb", size: "wide", description: "Rassemblez les décisions, les blocages et les actions à suivre.", status: "Demain à 09 h 30", counter: 0, href: "/modules/reunions", visible: true, order: 5 },
    { id: "machines", label: "Parc Machines", icon: "factory", color: "#dc2626", size: "small", description: "Surveillez les indisponibilités et les maintenances planifiées.", status: "1 alerte", counter: 1, href: "/modules/parc-machines", visible: true, order: 6 },
    { id: "requests", label: "Centre de demandes", icon: "inbox", color: "#0d9488", size: "medium", description: "Centralisez les demandes internes qui nécessitent une décision.", status: "En attente", counter: 4, href: "/modules/suivi", visible: true, order: 7 },
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
      { id: "TOU-01", active: true, name: "MAZAK INTEGREX 300", displayName: "Integrex 300", department: "Tournage", machineType: "Tournage / Fraisage", photoDataUrl: "", technicalInformation: "Capacité standard : 8 h/jour" },
      { id: "FRA-01", active: true, name: "MAZAK VTC-200C-II", displayName: "VTC-200C-II", department: "Fraisage", machineType: "Fraisage 3 axes", photoDataUrl: "", technicalInformation: "Capacité standard : 8 h/jour" },
      { id: "FRA-10", active: true, name: "HEDELIUS ACURA 65 EL", displayName: "Acura 65", department: "Fraisage", machineType: "Fraisage 5 axes", photoDataUrl: "", technicalInformation: "Chargement automatisable" },
      { id: "FIL-01", active: true, name: "MITSUBISHI FA30S", displayName: "FA30S", department: "Découpe fil", machineType: "Découpe fil", photoDataUrl: "", technicalInformation: "Capacité standard : 16 h/jour" },
    ],
    departments: ["Tournage", "Fraisage", "Découpe fil", "Qualité", "Maintenance"],
    capacities: ["Tournage · 8 h/jour", "Fraisage · 8 h/jour", "Découpe fil · 16 h/jour"],
    priorities: ["Normale", "Haute", "Urgente", "Bloquante"],
    workOrderTypes: ["Production", "Retouche", "Prototype", "Urgence client", "Sous-traitance"],
  },
  roles: [
    { id: "administrator", name: "Administrateur", permissions: permissionsFor("admin") },
    { id: "production-manager", name: "Responsable de production", permissions: permissionsFor("admin") },
    { id: "planner", name: "Planificateur", permissions: permissionsFor("view") },
    { id: "supervisor", name: "Superviseur", permissions: permissionsFor("view") },
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
      ["quantity", "Quantité"], ["operation", "Opération"], ["planned-time", "Temps planifié"], ["priority", "Priorité"],
      ["delivery-date", "Date de livraison"], ["comments", "Commentaires"], ["completed", "Case terminé"], ["problem", "Case problème"],
    ].map(([id, label], order) => ({ id, label, visible: true, order })),
  },
  templates: {
    mail: "Bonjour {responsable},\n\nVoici le point à traiter : {sujet}.\n\nMerci,\nDaniel",
    qrqc: "QRQC du {date}\n\nBlocages : {blocages}\nActions : {actions}",
    meeting: "Réunion de production du {date}\n\nDécisions : {decisions}\nActions : {actions}",
    report: "Document généré par ProdPilot IA",
    ai: "Répondre en français, de manière directe et orientée action.",
  },
  journal: [],
};
