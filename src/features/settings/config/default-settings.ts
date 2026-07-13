import {
  SETTINGS_VERSION,
  type AppSettings,
  type MachineSettings,
  type ModulePermission,
  type NavigationItemConfig,
} from "@/features/settings/types/settings";

function productionMachine(
  id: string,
  name: string,
  department: "Tournage" | "Fraisage" | "Découpe fil",
  machineType: string,
  capacityHours = 8,
): MachineSettings {
  return {
    id,
    active: true,
    name,
    displayName: name,
    department,
    machineType,
    photoDataUrl: "",
    technicalInformation: `Capacité standard : ${capacityHours} h/jour`,
  };
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
      productionMachine("TOU-01", "MAZAK INTEGREX 300", "Tournage", "Tournage / Fraisage"),
      productionMachine("TOU-02", "MAZAK NEXUS 200MSY", "Tournage", "Tournage / Fraisage"),
      productionMachine("TOU-03", "GRAZIANO GT300", "Tournage", "Tournage / Fraisage"),
      productionMachine("TOU-04", "MAZAK INTEGREX 150", "Tournage", "Tournage / Fraisage"),
      productionMachine("TOU-05", "OKUMA LB15 II-C", "Tournage", "Tournage"),
      productionMachine("TOU-06", "Tour CNC HYUNDAI-KIA SKT 250", "Tournage", "Tournage"),
      productionMachine("TOU-07", "OKUMA LB25 II-C", "Tournage", "Tournage"),
      productionMachine("TOU-08", "Mazak Quick Turn Smart 350", "Tournage", "Tournage"),
      productionMachine("TOU-09", "TOUR trad. Pinacho", "Tournage", "Tournage"),
      productionMachine("FRA-01", "MAZAK VTC-200C-II", "Fraisage", "Fraisage 3 axes"),
      productionMachine("FRA-02", "MAZAK NEXUS 410 A II", "Fraisage", "Fraisage 3 axes"),
      productionMachine("FRA-03", "HEDELIUS CB70", "Fraisage", "Fraisage 3 axes"),
      productionMachine("FRA-04", "AKIRA SEIKI V4.5", "Fraisage", "Fraisage 3 axes"),
      productionMachine("FRA-05", "Fraiseuse DMC 1035 (B)", "Fraisage", "Fraisage 3 axes"),
      productionMachine("FRA-06", "Mikron VCE 800 PRO", "Fraisage", "Fraisage 3 axes"),
      productionMachine("FRA-07", "DMG DMC 635", "Fraisage", "Fraisage 3 axes"),
      productionMachine("FRA-08", "DECKEL MAHO DMC 1035V", "Fraisage", "Fraisage 3 axes"),
      productionMachine("FRA-09", "DECKEL MAHO DMC 64V linear", "Fraisage", "Fraisage 3 axes"),
      productionMachine("FRA-10", "HEDELIUS ACURA 65 EL", "Fraisage", "Fraisage 5 axes"),
      productionMachine("FRA-11", "MAZAK CV5-500 + robot", "Fraisage", "Fraisage 5 axes"),
      productionMachine("FRA-12", "DMG MORI CMX50 U + PH150", "Fraisage", "Fraisage 5 axes"),
      productionMachine("FRA-13", "DMG MORI DMU50 + Robot", "Fraisage", "Fraisage 5 axes"),
      productionMachine("FRA-14", "DECKEL MAHO DMU 60 (1)", "Fraisage", "Fraisage 5 axes"),
      productionMachine("FRA-15", "DECKEL MAHO DMU 60 (2)", "Fraisage", "Fraisage 5 axes"),
      productionMachine("FRA-16", "DMG MORI SEIKI DMU50 (Ecoline)", "Fraisage", "Fraisage 5 axes"),
      productionMachine("FRA-17", "MAZAK VTC 800", "Fraisage", "Fraisage 5 axes"),
      productionMachine("FIL-01", "MITSUBISHI FA30S", "Découpe fil", "Découpe fil", 16),
      productionMachine("FIL-02", "MV 2400R connect", "Découpe fil", "Découpe fil", 16),
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
