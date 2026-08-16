import type { Contact, Meeting, MeetingLifecycleStatus, MeetingParticipant, MeetingPriorityDossier } from "@/features/demo/types/demo";

/** Même union que `StatusPill` (`src/components/ui/ModuleUi.tsx`), redéfinie ici pour que ce service reste exécutable directement par le test runner Node (sans alias `@/` en import de valeur). */
type StatusTone = "neutral" | "success" | "warning" | "danger" | "info";

/** Ordre d'affichage du cycle de vie d'une réunion, utilisé par la barre de statut. */
export const MEETING_LIFECYCLE_STATUSES: MeetingLifecycleStatus[] = ["Brouillon", "Préparation", "Envoyée", "En cours", "Terminée", "Archivée"];
export const MAX_MEETING_PRIORITY_DOSSIERS = 5;

/**
 * Vendredi appartenant à la même semaine civile (lundi → dimanche) que `referenceDate`.
 * Samedi et dimanche reviennent donc au vendredi qui les précède ; lundi à jeudi avancent vers
 * le vendredi à venir. Une heure stable évite tout changement de jour à l'affichage européen.
 */
export function meetingFridayDate(referenceDate: Date = new Date()): string {
  const friday = new Date(referenceDate);
  const day = friday.getUTCDay();
  const daysFromMonday = day === 0 ? 6 : day - 1;
  friday.setUTCDate(friday.getUTCDate() + (4 - daysFromMonday));
  friday.setUTCHours(9, 0, 0, 0);
  return friday.toISOString();
}

function suggestedPriorityDossiers(workOrderIds: string[]): MeetingPriorityDossier[] {
  return workOrderIds.slice(0, MAX_MEETING_PRIORITY_DOSSIERS).map((workOrderId, index) => ({
    id: `DOS-${index + 1}`,
    title: workOrderId,
    description: "",
    preparationComment: "",
    meetingComment: "",
    decision: "",
    status: "À discuter",
    referenceKind: "workOrder",
    referenceId: workOrderId,
    actionIds: [],
  }));
}

const MEETING_STATUS_TONES: Record<MeetingLifecycleStatus, StatusTone> = {
  "Brouillon": "neutral",
  "Préparation": "info",
  "Envoyée": "info",
  "En cours": "warning",
  "Terminée": "success",
  "Archivée": "neutral",
};

/** Couleur de pastille (`StatusPill`) associée à un statut du cycle de vie de la réunion. */
export function meetingStatusTone(status: MeetingLifecycleStatus): StatusTone {
  return MEETING_STATUS_TONES[status];
}

function contactFullName(contact: Contact): string {
  return `${contact.firstName} ${contact.lastName}`.trim();
}

function meetingIdPrefix(type: "QRQC" | "Production"): string {
  return type === "QRQC" ? "MEET-QRQC" : "MEET-PROD";
}

function nextMeetingId(existing: Meeting[], type: "QRQC" | "Production"): string {
  const prefix = meetingIdPrefix(type);
  const pattern = new RegExp(`^${prefix}-(\\d+)$`);
  const highest = existing.reduce((max, item) => {
    const match = pattern.exec(item.id);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);
  return `${prefix}-${String(highest + 1).padStart(2, "0")}`;
}

function lastMeetingOfType(meetings: Meeting[], type: "QRQC" | "Production"): Meeting | null {
  const sameType = [...meetings].filter((item) => item.type === type).sort((a, b) => b.date.localeCompare(a.date));
  return sameType[0] ?? null;
}

/** Participants de la réunion la plus récente du même type (clôturée ou non) : évite de ressaisir tout le monde à chaque nouvelle réunion. */
export function previousMeetingParticipants(meetings: Meeting[], type: "QRQC" | "Production"): MeetingParticipant[] {
  return lastMeetingOfType(meetings, type)?.participants ?? [];
}

/** Responsable de la réunion la plus récente du même type : repris par défaut sur la nouvelle occurrence, modifiable ensuite. */
export function previousMeetingResponsable(meetings: Meeting[], type: "QRQC" | "Production"): string | null {
  return lastMeetingOfType(meetings, type)?.responsableContactId ?? null;
}

/** Noms affichables des participants (module Contacts) — un participant dont le contact a été supprimé depuis n'apparaît plus, sans faire planter l'affichage. */
export function meetingParticipantNames(participants: MeetingParticipant[], contacts: Contact[]): string[] {
  const byId = new Map(contacts.map((contact) => [contact.id, contact]));
  return participants.map((participant) => byId.get(participant.contactId)).filter((contact): contact is Contact => contact !== undefined).map(contactFullName);
}

/**
 * Nouvelle occurrence d'une réunion, en Brouillon (visible uniquement par `createdByUserId`), avec
 * le responsable et les participants de la précédente déjà repris (modifiables ensuite) — tous
 * remis « Présent » au démarrage, indépendamment de leur statut à la réunion précédente — et, pour
 * une réunion Production, les projets critiques suggérés au départ (`criticalWorkOrderIds`,
 * modifiables ensuite eux aussi).
 */
export function buildNewMeeting(existing: Meeting[], type: "QRQC" | "Production", createdByUserId: string | null, suggestedCriticalWorkOrderIds: string[] = [], referenceDate: Date = new Date()): Meeting {
  return {
    id: nextMeetingId(existing, type),
    type,
    date: meetingFridayDate(referenceDate),
    status: "Brouillon",
    createdByUserId,
    sharedAt: null,
    preparationSentAt: null,
    preparationSentVia: null,
    startedAt: null,
    closedAt: null,
    archivedAt: null,
    responsableContactId: previousMeetingResponsable(existing, type),
    participants: previousMeetingParticipants(existing, type).map((participant) => ({ contactId: participant.contactId, present: true })),
    notes: [],
    decisions: [],
    parkingLot: [],
    actionIds: [],
    priorityDossiers: type === "Production" ? suggestedPriorityDossiers(suggestedCriticalWorkOrderIds) : [],
    maintenanceProblemIds: [],
    fieldPoints: [],
    fieldRoundCompletedContactIds: [],
    fieldRoundNoIssueContactIds: [],
    recapDocument: null,
    criticalWorkOrderIds: [...suggestedCriticalWorkOrderIds],
  };
}

/** Filtrage cosmétique du Brouillon (visible uniquement par son créateur) — jamais une restriction de sécurité, l'application n'ayant pas d'authentification réelle ; une réunion sans créateur connu (donnée migrée) reste visible par tous. */
export function isMeetingVisibleToUser(meeting: Meeting, currentUserId: string | null): boolean {
  if (meeting.status !== "Brouillon") return true;
  if (!meeting.createdByUserId) return true;
  return meeting.createdByUserId === currentUserId;
}
