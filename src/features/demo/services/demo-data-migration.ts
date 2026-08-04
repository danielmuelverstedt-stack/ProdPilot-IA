import { TKMI_DIRECTORY_CONTACTS } from "../mock/tkmi-directory-seed.ts";
import type { ActionContextLink, ActionStatus, Contact, DemoData, ProductionAction } from "@/features/demo/types/demo";

/** Complète une action déjà stockée (avant la planification équipe) avec les nouveaux champs, tous `null` par défaut — jamais `undefined`, pour rester conforme au type même sur des données anciennes. */
function withActionPlanningDefaults(value: unknown): ProductionAction {
  const action = value as ProductionAction;
  return {
    ...action,
    priority: action.priority ?? null,
    responsableId: action.responsableId ?? null,
    estimatedHours: action.estimatedHours ?? null,
    plannedWeek: action.plannedWeek ?? null,
    planningOrder: action.planningOrder ?? null,
    parentActionId: action.parentActionId ?? null,
  };
}

/** Complète un contact déjà stocké avec les champs ajoutés depuis (N° interne), `null` par défaut. */
function withContactDefaults(value: unknown): Contact {
  const contact = value as Contact;
  return { ...contact, internalNumber: contact.internalNumber ?? null };
}

/**
 * Ajoute une seule fois l'annuaire interne TKMI (fourni par l'utilisateur le 04/08/2026) aux
 * installations existantes, sans jamais toucher aux contacts déjà créés par l'utilisateur. Le
 * seed (`initialDemoData.contacts`) ne sert qu'à une toute nouvelle installation ; sans ce
 * complément, une installation déjà en cours d'utilisation ne verrait jamais ces contacts.
 * Marqueur d'exécution unique : la présence du premier contact de la liste (`CT-003`, quel que
 * soit son id après une éventuelle modification manuelle par l'utilisateur — la recherche se fait
 * par id fixe, donc par la présence de CET id précis dans le tableau, jamais réinjecté une fois
 * supprimé volontairement).
 */
function withTkmiDirectorySeed(contacts: Contact[]): Contact[] {
  const alreadySeeded = contacts.some((item) => item.id === TKMI_DIRECTORY_CONTACTS[0].id);
  if (alreadySeeded) return contacts;
  return [...contacts, ...TKMI_DIRECTORY_CONTACTS];
}

interface LegacyAction {
  id: string;
  title?: string;
  description: string;
  responsible: string;
  status: string;
  dueDate: string;
  createdAt: string;
  sourceType: string;
  sourceId: string | null;
  workOrderId: string | null;
  machineId: string | null;
  comments?: string[];
  history?: { date: string; author: string }[];
}

const ORIGIN_BY_SOURCE_TYPE: Record<string, string> = {
  email: "Mail",
  QRQC: "QRQC",
  production_meeting: "Réunion de production",
  work_order: "Planning",
  erp_quality: "Qualité ERP",
  machine: "Parc machines",
  request: "Centre de demandes",
  manual: "Manuel",
};

const STATUS_MAP: Record<string, ActionStatus> = {
  "Ouverte": "À faire",
  "En cours": "À faire",
  "Reportée": "Reporté",
  "Terminée": "Fait",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function buildContextLink(legacy: LegacyAction): ActionContextLink | null {
  if ((legacy.sourceType === "QRQC" || legacy.sourceType === "production_meeting") && legacy.sourceId) {
    return { module: "meeting", id: legacy.sourceId, label: legacy.sourceId, href: legacy.sourceType === "QRQC" ? "/reunions/qrqc" : "/reunions/production" };
  }
  if (legacy.sourceType === "request" && legacy.sourceId) return { module: "request", id: legacy.sourceId, label: legacy.sourceId, href: `/suivi/${legacy.sourceId}` };
  if (legacy.sourceType === "erp_quality" && legacy.sourceId) return { module: "erpQuality", id: legacy.sourceId, label: legacy.sourceId, href: `/qualite-erp/${legacy.sourceId}` };
  if (legacy.workOrderId) return { module: "workOrder", id: legacy.workOrderId, label: legacy.workOrderId, href: `/of/${legacy.workOrderId}` };
  if (legacy.machineId) return { module: "machine", id: legacy.machineId, label: legacy.machineId, href: `/machines/${legacy.machineId}` };
  return null;
}

function migrateAction(value: unknown): ProductionAction | null {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.description !== "string") return null;
  const legacy = value as unknown as LegacyAction;
  const history = Array.isArray(legacy.history) ? legacy.history : [];
  const lastHistoryEntry = history[history.length - 1];
  const statut = STATUS_MAP[legacy.status] ?? "À faire";
  const comments = Array.isArray(legacy.comments) ? legacy.comments.filter((item): item is string => typeof item === "string") : [];
  return {
    id: legacy.id,
    dateEncodage: legacy.createdAt ?? new Date().toISOString().slice(0, 10),
    introduitPar: lastHistoryEntry?.author ?? "Utilisateur inconnu",
    origine: ORIGIN_BY_SOURCE_TYPE[legacy.sourceType] ?? "Manuel",
    contextLink: buildContextLink(legacy),
    description: legacy.title && legacy.title !== legacy.description ? `${legacy.title} — ${legacy.description}` : legacy.description,
    responsable: legacy.responsible ?? "À assigner",
    echeance: legacy.dueDate ?? legacy.createdAt ?? new Date().toISOString().slice(0, 10),
    statut,
    dateCloture: statut === "Fait" ? (lastHistoryEntry?.date ?? legacy.createdAt ?? null) : null,
    remarque: comments.length ? comments.join(" | ") : null,
    priority: null,
    responsableId: null,
    estimatedHours: null,
    plannedWeek: null,
    planningOrder: null,
    parentActionId: null,
  };
}

/**
 * Complète un DemoData v2 déjà stocké localement avec les champs ajoutés depuis (fiche machine :
 * contacts SAV, consommables ; planification équipe : personnes, champs de planification par
 * action ; annuaire : contacts) — sans backfill, ces payloads plus anciens échoueraient
 * `isDemoData()` et seraient réinitialisés au premier chargement, perdant les données locales de
 * l'utilisateur.
 */
function withMachineSheetDefaults(value: Record<string, unknown>): Record<string, unknown> {
  return {
    ...value,
    savContacts: Array.isArray(value.savContacts) ? value.savContacts : [],
    consumables: Array.isArray(value.consumables) ? value.consumables : [],
    people: Array.isArray(value.people) ? value.people : [],
    contacts: withTkmiDirectorySeed(Array.isArray(value.contacts) ? value.contacts.map(withContactDefaults) : []),
    actions: Array.isArray(value.actions) ? value.actions.map(withActionPlanningDefaults) : [],
  };
}

/** Convertit un DemoData v1 (ancien modèle d'action) vers le modèle v2 sans perdre les données locales existantes. */
export function migrateDemoData(value: unknown): DemoData | null {
  if (!isRecord(value)) return null;
  const requiredArrays = [value.workOrders, value.planning, value.machines, value.maintenance, value.meetings, value.requests, value.erpQuality, value.notifications];
  if (!requiredArrays.every(Array.isArray) || !Array.isArray(value.actions)) return null;
  if (value.version === 2) return withMachineSheetDefaults(value) as unknown as DemoData;
  if (value.version !== 1) return null;
  const actions = value.actions.map(migrateAction).filter((item): item is ProductionAction => item !== null);
  return withMachineSheetDefaults({ ...value, version: 2, actions }) as unknown as DemoData;
}
