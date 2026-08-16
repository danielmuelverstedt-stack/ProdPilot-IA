import { TKMI_DIRECTORY_CONTACTS } from "../mock/tkmi-directory-seed.ts";
import type { ActionContextLink, ActionStatus, Contact, DemoData, Meeting, MeetingFieldPoint, MeetingLifecycleStatus, MeetingParticipant, MeetingPriorityDossier, MeetingStepEntry, ProductionAction, ProjetSuiviLog } from "@/features/demo/types/demo";

/**
 * Complète une action déjà stockée (avant la planification équipe, puis avant les liens multiples/
 * commentaires/historique/responsable Contact) avec les nouveaux champs, tous `null`/vides par
 * défaut — jamais `undefined`, pour rester conforme au type même sur des données anciennes.
 * `contextLink` (ancien champ singulier) est converti en tableau `contextLinks` s'il existe encore.
 */
function withActionPlanningDefaults(value: unknown): ProductionAction {
  const action = value as ProductionAction & { contextLink?: ActionContextLink | null };
  return {
    ...action,
    contextLinks: Array.isArray(action.contextLinks) ? action.contextLinks : (action.contextLink ? [action.contextLink] : []),
    responsableContactId: action.responsableContactId ?? null,
    comments: Array.isArray(action.comments) ? action.comments : [],
    history: Array.isArray(action.history) ? action.history : [],
    priority: action.priority ?? null,
    responsableId: action.responsableId ?? null,
    estimatedHours: action.estimatedHours ?? null,
    plannedWeek: action.plannedWeek ?? null,
    planningOrder: action.planningOrder ?? null,
    parentActionId: action.parentActionId ?? null,
    besoinType: action.besoinType ?? null,
  };
}

/** Complète un contact déjà stocké avec les champs ajoutés depuis (N° interne, N° privé), `null` par défaut. */
function withContactDefaults(value: unknown): Contact {
  const contact = value as Contact;
  return { ...contact, internalNumber: contact.internalNumber ?? null, privateNumber: contact.privateNumber ?? null };
}

/** Convertit une note/décision de réunion enregistrée avant le rattachement par étape (simple texte) en entrée `{ step, text }`, sous une étape générique — les entrées déjà migrées passent inchangées. */
function withMeetingStepEntries(items: unknown): MeetingStepEntry[] {
  if (!Array.isArray(items)) return [];
  return items.map((item) => (typeof item === "string" ? { step: "Réunion", text: item } : item as MeetingStepEntry));
}

function normalizeContactName(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("fr");
}

/**
 * Convertit les participants enregistrés avant le rattachement au module Contacts (simples noms
 * en texte libre) en références `{ contactId, present }`, en retrouvant chaque nom dans l'annuaire
 * par correspondance exacte (même normalisation que `resolveParticipantEmails`) — un nom sans
 * contact correspondant (personne jamais créée dans Contacts) est perdu, faute de pouvoir le
 * rattacher à une fiche réelle ; les entrées déjà migrées passent inchangées.
 */
function withMeetingParticipants(items: unknown, contacts: Contact[]): MeetingParticipant[] {
  if (!Array.isArray(items)) return [];
  const contactIdByName = new Map(contacts.map((contact) => [normalizeContactName(`${contact.firstName} ${contact.lastName}`), contact.id]));
  return items
    .map((item) => {
      if (typeof item === "string") {
        const contactId = contactIdByName.get(normalizeContactName(item));
        return contactId ? { contactId, present: true } : null;
      }
      if (item && typeof item === "object" && typeof (item as MeetingParticipant).contactId === "string") return item as MeetingParticipant;
      return null;
    })
    .filter((item): item is MeetingParticipant => item !== null);
}

function withPriorityDossiers(meeting: Meeting): MeetingPriorityDossier[] {
  if (Array.isArray(meeting.priorityDossiers)) return meeting.priorityDossiers.slice(0, 5).map((item, index) => ({
    ...item,
    id: item.id || `DOS-${index + 1}`,
    title: item.title ?? "Dossier prioritaire",
    description: item.description ?? "",
    preparationComment: item.preparationComment ?? "",
    meetingComment: item.meetingComment ?? "",
    decision: item.decision ?? "",
    status: item.status ?? "À discuter",
    referenceKind: item.referenceKind ?? "free",
    referenceId: item.referenceId ?? null,
    actionIds: Array.isArray(item.actionIds) ? item.actionIds : [],
  }));
  const legacyIds = Array.isArray(meeting.criticalWorkOrderIds) ? meeting.criticalWorkOrderIds.slice(0, 5) : [];
  return legacyIds.map((workOrderId, index) => ({ id: `DOS-${index + 1}`, title: workOrderId, description: "", preparationComment: "", meetingComment: "", decision: "", status: "À discuter", referenceKind: "workOrder", referenceId: workOrderId, actionIds: [] }));
}

function withMeetingFieldPoints(items: unknown): MeetingFieldPoint[] {
  if (!Array.isArray(items)) return [];
  return items.filter((item): item is MeetingFieldPoint => Boolean(item && typeof item === "object" && typeof (item as MeetingFieldPoint).id === "string")).map((item) => ({
    ...item,
    authorContactId: item.authorContactId ?? null,
    updatedAt: item.updatedAt ?? item.createdAt,
    comments: item.comments ?? "",
    actionIds: Array.isArray(item.actionIds) ? item.actionIds : [],
    machineIds: Array.isArray(item.machineIds) ? item.machineIds : [],
    workOrderIds: Array.isArray(item.workOrderIds) ? item.workOrderIds : [],
    priorityDossierIds: Array.isArray(item.priorityDossierIds) ? item.priorityDossierIds : [],
  }));
}

const LEGACY_MEETING_STATUS_MAP: Record<string, MeetingLifecycleStatus> = {
  "Planifiée": "Préparation",
  "En cours": "En cours",
  "Clôturée": "Terminée",
};

const MEETING_LIFECYCLE_STATUS_VALUES = new Set<MeetingLifecycleStatus>(["Brouillon", "Préparation", "Envoyée", "En cours", "Terminée", "Archivée"]);

/** Convertit l'ancien statut à 3 valeurs vers le cycle de vie à 6 valeurs — une réunion déjà « Planifiée »/« En cours » avait forcément commencé sa préparation, donc jamais repliée sur « Brouillon » (privé) lors d'une migration. */
function withMeetingStatus(status: unknown): MeetingLifecycleStatus {
  if (typeof status === "string" && MEETING_LIFECYCLE_STATUS_VALUES.has(status as MeetingLifecycleStatus)) return status as MeetingLifecycleStatus;
  if (typeof status === "string" && LEGACY_MEETING_STATUS_MAP[status]) return LEGACY_MEETING_STATUS_MAP[status];
  return "Préparation";
}

/**
 * Complète une réunion déjà stockée avec les OF suivis à l'étape « Cinq projets critiques »
 * (tableau vide par défaut), un responsable (`null` par défaut), des participants convertis en
 * références Contacts, son statut converti vers le cycle de vie à 6 valeurs (créateur et
 * horodatages de transition à `null`, aucune date ne pouvant être devinée pour une donnée déjà
 * enregistrée) et rattache ses notes/décisions à une étape (générique pour les anciennes, déjà
 * présentes pour les nouvelles).
 */
function withMeetingDefaults(value: unknown, contacts: Contact[]): Meeting {
  const meeting = value as Meeting;
  return {
    ...meeting,
    status: withMeetingStatus(meeting.status),
    createdByUserId: meeting.createdByUserId ?? null,
    sharedAt: meeting.sharedAt ?? null,
    preparationSentAt: meeting.preparationSentAt ?? null,
    preparationSentVia: meeting.preparationSentVia ?? null,
    startedAt: meeting.startedAt ?? null,
    closedAt: meeting.closedAt ?? null,
    archivedAt: meeting.archivedAt ?? null,
    responsableContactId: meeting.responsableContactId ?? null,
    participants: withMeetingParticipants(meeting.participants, contacts),
    priorityDossiers: withPriorityDossiers(meeting),
    maintenanceProblemIds: Array.isArray(meeting.maintenanceProblemIds) ? meeting.maintenanceProblemIds.filter((id): id is string => typeof id === "string") : [],
    fieldPoints: withMeetingFieldPoints(meeting.fieldPoints),
    fieldRoundCompletedContactIds: Array.isArray(meeting.fieldRoundCompletedContactIds) ? meeting.fieldRoundCompletedContactIds.filter((id): id is string => typeof id === "string") : [],
    fieldRoundNoIssueContactIds: Array.isArray(meeting.fieldRoundNoIssueContactIds) ? meeting.fieldRoundNoIssueContactIds.filter((id): id is string => typeof id === "string") : [],
    recapDocument: meeting.recapDocument ?? null,
    criticalWorkOrderIds: Array.isArray(meeting.criticalWorkOrderIds) ? meeting.criticalWorkOrderIds : [],
    notes: withMeetingStepEntries(meeting.notes),
    decisions: withMeetingStepEntries(meeting.decisions),
  };
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
    contextLinks: buildContextLink(legacy) ? [buildContextLink(legacy)!] : [],
    description: legacy.title && legacy.title !== legacy.description ? `${legacy.title} — ${legacy.description}` : legacy.description,
    responsable: legacy.responsible ?? "À assigner",
    responsableContactId: null,
    echeance: legacy.dueDate ?? legacy.createdAt ?? new Date().toISOString().slice(0, 10),
    statut,
    dateCloture: statut === "Fait" ? (lastHistoryEntry?.date ?? legacy.createdAt ?? null) : null,
    remarque: comments.length ? comments.join(" | ") : null,
    comments: [],
    history: [],
    priority: null,
    responsableId: null,
    estimatedHours: null,
    plannedWeek: null,
    planningOrder: null,
    parentActionId: null,
    besoinType: null,
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
  const contacts = withTkmiDirectorySeed(Array.isArray(value.contacts) ? value.contacts.map(withContactDefaults) : []);
  return {
    ...value,
    savContacts: Array.isArray(value.savContacts) ? value.savContacts : [],
    consumables: Array.isArray(value.consumables) ? value.consumables : [],
    people: Array.isArray(value.people) ? value.people : [],
    contacts: withTkmiDirectorySeed(Array.isArray(value.contacts) ? value.contacts.map(withContactDefaults) : []),
    actions: Array.isArray(value.actions) ? value.actions.map(withActionPlanningDefaults) : [],
    meetings: Array.isArray(value.meetings) ? value.meetings.map((meeting) => withMeetingDefaults(meeting, contacts)) : [],
    maintenanceProblems: Array.isArray(value.maintenanceProblems) ? value.maintenanceProblems : [],
    projetSuivi: isRecord(value.projetSuivi) ? (value.projetSuivi as ProjetSuiviLog) : {},
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
