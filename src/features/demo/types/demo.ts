export type Priority = "Basse" | "Normale" | "Haute" | "Urgente" | "Bloquante";
/** "À planifier" : idée/action d'amélioration mise de côté pour ne pas l'oublier, sans responsable ni échéance réels tant qu'elle n'a pas été validée (`planAction`) — elle rejoint alors "À faire" comme une action normale. */
export type ActionStatus = "À faire" | "Fait" | "Reporté" | "À planifier";

export interface HistoryEntry {
  id: string;
  date: string;
  author: string;
  description: string;
}

export interface ActionContextLink {
  /** "maintenance" pointe vers la même machine qu'un lien "machine" (même `id`) — il n'existe pas de fiche maintenance dédiée, volontairement (voir feuille de route). */
  module: "meeting" | "workOrder" | "machine" | "maintenance" | "maintenanceProblem" | "request" | "erpQuality" | "mail";
  id: string;
  label: string;
  href: string;
}

/** Commentaire libre, horodaté et attribué sur une action — distinct de `remarque` (un seul texte, existant) et de `HistoryEntry` (traçabilité des changements de champs, pas un fil de discussion). */
export interface ActionComment {
  id: string;
  author: string;
  date: string;
  text: string;
}

export interface ProductionAction {
  id: string;
  dateEncodage: string;
  introduitPar: string;
  origine: string;
  /** Une action peut être rattachée à plusieurs éléments à la fois (ex. une machine + sa maintenance + la réunion où elle a été créée) — jamais un lien unique, jamais de copie de l'action elle-même. */
  contextLinks: ActionContextLink[];
  description: string;
  responsable: string;
  /** Contact (module Contacts) résolu pour `responsable` quand connu — photo/nom toujours lus en direct depuis Contacts, jamais dupliqués ici. `null` = responsable resté en texte libre uniquement (comme aujourd'hui). */
  responsableContactId: string | null;
  echeance: string;
  statut: ActionStatus;
  dateCloture: string | null;
  remarque: string | null;
  /** Fil de commentaires (auteur + date + texte), affiché dans la fiche action et le panneau rapide de réunion. */
  comments: ActionComment[];
  /** Traçabilité des changements importants (responsable, échéance, statut, clôture, commentaire) — même type que `WorkOrder`/`InternalRequest`, source unique déjà établie dans ce codebase. */
  history: HistoryEntry[];
  /** Type de besoin (Qualité, Planning, Matière…) quand l'action vient d'un bouton de besoin de l'étape « Cinq projets critiques » d'une réunion Production ; `null` pour toute autre action (y compris une action libre créée depuis la même étape). */
  besoinType: string | null;
  /** Priorité affichée sur les cartes de la planification équipe ; `null` = non définie. */
  priority: Priority | null;
  /**
   * Champs de la planification équipe (module Actions → onglet Planification équipe), séparés de
   * `responsable` (texte libre, inchangé, alimente tout le reste de l'app) pour que le glisser-
   * déposer référence toujours une personne par id, jamais par nom. `responsableId` pointe vers
   * `DemoData.people`, y compris vers un id supprimé (`responsableId` n'est jamais effacé par une
   * suppression de personne — seule la planification l'est, voir `deleteTeamMember`) pour ne
   * jamais perdre la charge/l'historique d'une action.
   */
  responsableId: string | null;
  estimatedHours: number | null;
  /** Semaine ISO 8601 planifiée, format "AAAA-Www" (ex. "2026-W31") ; `null` = case « Non planifiées ». */
  plannedWeek: string | null;
  /** Ordre au sein de la case personne+semaine, croissant. `null` tant que jamais planifiée. */
  planningOrder: number | null;
  /**
   * Action parente, si celle-ci est une sous-action créée depuis la fiche d'une autre action.
   * Une sous-action est une `ProductionAction` normale (mêmes statuts, mêmes mutations) — elle
   * n'apparaît simplement pas dans les listes de premier niveau (registre Actions, Planification
   * équipe, revue de réunion), uniquement dans la fiche de son action parente. `null` pour une
   * action de premier niveau (l'immense majorité).
   */
  parentActionId: string | null;
}

export interface WorkOperation {
  id: string;
  number: number;
  description: string;
  department: string;
  machineId: string | null;
  plannedDurationHours: number;
  plannedDate: string | null;
  status: string;
  completedQuantity: number;
  blockingIssue: string | null;
}

export interface WorkOrder {
  id: string;
  customer: string;
  article: string;
  description: string;
  quantity: number;
  priority: Priority;
  dueDate: string;
  status: "À lancer" | "En production" | "Bloqué" | "Terminé";
  progress: number;
  project: string;
  dataProblems: string[];
  comments: string[];
  history: HistoryEntry[];
  operations: WorkOperation[];
}

export interface PlannedOperation {
  id: string;
  workOrderId: string;
  operationId: string;
  machineId: string;
  startAt: string;
  endAt: string;
  status: WorkOperation["status"];
  comments: string;
}

export type MachineStatus = "Disponible" | "En production" | "Maintenance prévue" | "En panne" | "Inactive";

export type MachiningType = "3 axes" | "4 axes" | "5 axes" | "Tournage-fraisage" | "";

export interface Machine {
  id: string;
  name: string;
  displayName: string;
  department: string;
  type: string;
  status: MachineStatus;
  manufacturer: string;
  model: string;
  year: number;
  serialNumber: string;
  robot: string | null;
  comments: string;
  // Identification (fiche technique)
  workshopLocation?: string;
  commissioningDate?: string | null;
  warrantyEndDate?: string | null;
  // Caractéristiques techniques (fiche technique)
  machiningType?: MachiningType;
  cncControl?: string;
  spindleSpeedRpm?: number | null;
  spindlePowerKw?: number | null;
  toolSpindleOrCone?: string;
  travelXMm?: number | null;
  travelYMm?: number | null;
  travelZMm?: number | null;
  toolMagazineCapacity?: number | null;
  barCapacityDiameterMm?: number | null;
  throughSpindleCoolant?: boolean;
  // Raccordements (fiche technique)
  electricalVoltage?: string;
  electricalKva?: number | null;
  electricalCableSection?: string;
  compressedAirBar?: number | null;
  compressedAirFlowNlMin?: number | null;
  /** Clés des champs ci-dessus pré-remplis automatiquement et pas encore confirmés/modifiés par un utilisateur. */
  unverifiedFields?: string[];
}

export interface MachineSavContact {
  id: string;
  machineId: string;
  company: string;
  contactName: string;
  phone: string;
  email: string;
  contractReference: string;
  contractExpiry: string | null;
  notes: string;
}

export type ConsumableCategory = "Filtre" | "Huile" | "Graisse" | "Liquide de coupe" | "Autre";

export interface MachineConsumable {
  id: string;
  machineId: string;
  category: ConsumableCategory;
  designation: string;
  manufacturerReference: string;
  supplier: string;
  replacementFrequency: string;
  storageLocation: string;
  notes: string;
  isExample?: boolean;
}

export interface MaintenanceEvent {
  id: string;
  machineId: string;
  type: string;
  date: string;
  durationHours: number;
  responsible: string;
  status: string;
  comment: string;
  planningKind?: string;
  planningTypeId?: string;
  maintenanceTypeId?: string;
}

/** Une note ou décision rattachée à l'étape de la réunion pendant laquelle elle a été saisie — permet de reconstituer le déroulé « étape par étape » dans le compte rendu. */
export interface MeetingStepEntry {
  step: string;
  text: string;
}

/**
 * Participation d'un contact (module Contacts) à une réunion : uniquement une référence et un
 * statut de présence, jamais de copie des informations personnelles (nom, photo, fonction,
 * service…), qui restent lues en direct depuis `DemoData.contacts` à l'affichage.
 */
export interface MeetingParticipant {
  contactId: string;
  present: boolean;
}

/**
 * Cycle de vie complet d'une réunion, commun à toutes les catégories (présentes et futures) :
 * Brouillon (visible uniquement par son créateur, aucune notification) → Préparation (mêmes
 * capacités que Brouillon, partagée avec l'équipe) → Envoyée (document de préparation envoyé) →
 * En cours (réunion live) → Terminée (compte rendu généré) → Archivée (consultable, tous les liens
 * vers les autres modules restent actifs).
 */
export type MeetingLifecycleStatus = "Brouillon" | "Préparation" | "Envoyée" | "En cours" | "Terminée" | "Archivée";

/** Canal utilisé pour envoyer le document de préparation ou le compte rendu d'une réunion. */
export type MeetingSendChannelType = "email" | "print" | "teams";

export type MeetingPriorityDossierStatus = "À discuter" | "En cours de discussion" | "Décision prise" | "Reporté";
export type MeetingPriorityDossierReferenceKind = "workOrder" | "project" | "client" | "machine" | "free";

/**
 * Sujet de discussion propre à une réunion. Les données métier ne sont jamais recopiées :
 * `referenceId` pointe vers l'OF/la machine, ou contient la valeur canonique d'un projet/client
 * issue du référentiel des OF. Seuls les textes produits pendant la réunion vivent ici.
 */
export interface MeetingPriorityDossier {
  id: string;
  title: string;
  description: string;
  preparationComment: string;
  meetingComment: string;
  decision: string;
  status: MeetingPriorityDossierStatus;
  referenceKind: MeetingPriorityDossierReferenceKind;
  referenceId: string | null;
  actionIds: string[];
}

/** Point exprimé pendant le tour de table. Les objets liés restent dans leurs référentiels propriétaires. */
export interface MeetingFieldPoint {
  id: string;
  participantContactId: string;
  authorContactId: string | null;
  createdAt: string;
  updatedAt: string;
  text: string;
  comments: string;
  actionIds: string[];
  machineIds: string[];
  workOrderIds: string[];
  priorityDossierIds: string[];
}

export type MeetingRecapDocumentStatus = "À relire" | "Prêt" | "Envoyé";
export interface MeetingRecapSentVersion {
  id: string;
  sentAt: string;
  recipientContactIds: string[];
  recipientEmails: string[];
  subject: string;
  mailBody: string;
  documentBody: string;
  attachmentNames: string[];
}
export interface MeetingRecapDocument {
  status: MeetingRecapDocumentStatus;
  generatedAt: string;
  updatedAt: string;
  subject: string;
  mailBody: string;
  documentBody: string;
  recipientContactIds: string[];
  includePdf: boolean;
  includeActions: boolean;
  includePreparation: boolean;
  sentVersions: MeetingRecapSentVersion[];
}

export type MaintenanceProblemStatus = "Ouvert" | "En cours" | "En attente" | "Résolu";

export interface MaintenanceProblemComment {
  id: string;
  author: string;
  createdAt: string;
  text: string;
}

export interface MaintenanceProblemHistoryEntry {
  id: string;
  author: string;
  createdAt: string;
  text: string;
}

/** Problème technique durable. La machine et les actions restent dans leurs référentiels respectifs. */
export interface MaintenanceProblem {
  id: string;
  machineId: string;
  title: string;
  description: string;
  occurredOn: string;
  status: MaintenanceProblemStatus;
  problemType: string | null;
  machineStopped: boolean;
  productionImpact: string;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  sourceMeetingId: string | null;
  actionIds: string[];
  comments: MaintenanceProblemComment[];
  history: MaintenanceProblemHistoryEntry[];
}

export interface Meeting {
  id: string;
  type: "QRQC" | "Production";
  date: string;
  status: MeetingLifecycleStatus;
  /** `UserSettings.id` de la personne ayant créé la réunion — sert uniquement au filtrage cosmétique du Brouillon dans les listes (l'application n'a pas d'authentification réelle), jamais à une restriction d'accès effective. */
  createdByUserId: string | null;
  /** Horodatage de chaque transition du cycle de vie ; `null` tant qu'elle n'a pas eu lieu (jamais déduit rétroactivement lors d'une migration de donnée déjà enregistrée). */
  sharedAt: string | null;
  preparationSentAt: string | null;
  preparationSentVia: MeetingSendChannelType | null;
  startedAt: string | null;
  closedAt: string | null;
  archivedAt: string | null;
  /** Contact interne qui mène la réunion ; `null` tant qu'il n'a pas été choisi. */
  responsableContactId: string | null;
  participants: MeetingParticipant[];
  notes: MeetingStepEntry[];
  decisions: MeetingStepEntry[];
  parkingLot: string[];
  actionIds: string[];
  /** Jusqu'à cinq sujets ordonnés, contenant uniquement les données propres au déroulement de la réunion et des références vers les modules propriétaires. */
  priorityDossiers: MeetingPriorityDossier[];
  /** Références vers les problèmes maintenance retenus pour cette occurrence, dans leur ordre d'affichage. */
  maintenanceProblemIds: string[];
  /** Remontées du tour de table et progression des participants, uniquement utilisées pendant la réunion. */
  fieldPoints: MeetingFieldPoint[];
  fieldRoundCompletedContactIds: string[];
  fieldRoundNoIssueContactIds: string[];
  /** Couche éditoriale du compte rendu ; les données métier restent lues dans leurs modules. */
  recapDocument: MeetingRecapDocument | null;
  /** OF suivis à l'étape « Cinq projets critiques » (réunion Production) : préremplis automatiquement à la création de la réunion, ajustables ensuite (ajout/retrait). */
  criticalWorkOrderIds: string[];
}

/** Un point daté (statut + remarque) posé sur un OF suivi à l'étape « Cinq projets critiques », lors d'une réunion Production précise — permet de voir son évolution réunion après réunion. */
export interface ProjetSuiviEntry {
  date: string;
  meetingId: string;
  /** Valeur stable d'un statut configuré (`ProductionSettings.projetSuiviStatuses[].value`), pas son libellé — un renommage de libellé ne doit pas invalider l'historique déjà enregistré. */
  statut: string;
  remarque: string;
}

/** Historique par OF (clé = `WorkOrder.id`, même id que `Meeting.criticalWorkOrderIds`), indépendant du fait que l'OF soit encore suivi ou non sur la réunion en cours. */
export type ProjetSuiviLog = Record<string, ProjetSuiviEntry[]>;

export type RequestStatus = "Reçue" | "En analyse" | "Acceptée" | "Refusée" | "Planifiée" | "En cours" | "Terminée";

export interface InternalRequest {
  id: string;
  type: "Demande de planification" | "Demande d’avance OF" | "Demande qualité" | "Demande maintenance" | "Demande de sous-traitance" | "Suggestion" | "Autre";
  title: string;
  description: string;
  requester: string;
  responsible: string;
  status: RequestStatus;
  priority: Priority;
  createdAt: string;
  dueDate: string;
  workOrderId: string | null;
  machineId: string | null;
  comments: string[];
  history: HistoryEntry[];
}

export interface ErpQualityIssue {
  id: string;
  workOrderId: string;
  problemType: string;
  severity: "Faible" | "Moyenne" | "Élevée" | "Bloquante";
  responsible: string;
  score: number;
  status: "Détectée" | "Envoyée" | "Résolue";
  detectedAt: string;
  details: string;
}

export interface DemoNotification {
  id: string;
  title: string;
  description: string;
  href: string;
  level: "information" | "warning" | "danger";
  read: boolean;
}

/** Membre de l'équipe bureaux (planification équipe du module Actions) — distinct de `UserSettings` (compte/rôle), volontairement minimal. */
export interface TeamMember {
  id: string;
  name: string;
  weeklyCapacityHours: number;
  order: number;
}

export type ContactType = "Interne" | "Externe";

/**
 * Annuaire d'entreprise centralisé (module Contacts) : toute personne avec qui l'entreprise
 * travaille, interne ou externe. Distinct de `TeamMember` (équipe bureaux, planification de
 * charge uniquement) et de `MachineSavContact` (contact SAV rattaché à une seule machine, avec
 * ses propres références de contrat) — ces deux modèles existaient déjà avant Contacts et n'ont
 * pas été unifiés avec lui dans ce chantier, volontairement, pour rester dans le périmètre
 * demandé (voir Todo).
 */
export interface Contact {
  id: string;
  type: ContactType;
  firstName: string;
  lastName: string;
  /** Pertinent surtout pour un contact externe ; laissé libre pour un contact interne (ex. filiale). */
  company: string | null;
  role: string | null;
  /** Références vers `settings.contacts.categories` ; une fiche peut appartenir à plusieurs catégories. */
  categoryIds: string[];
  phone: string | null;
  mobile: string | null;
  /** Numéro de poste interne (standard téléphonique de l'entreprise), distinct du téléphone/mobile externe. */
  internalNumber: string | null;
  /** Numéro privé/personnel de la personne, distinct de ses numéros professionnels (téléphone/mobile). */
  privateNumber: string | null;
  email: string | null;
  address: string | null;
  website: string | null;
  notes: string | null;
}

export interface DemoData {
  version: 2;
  actions: ProductionAction[];
  workOrders: WorkOrder[];
  planning: PlannedOperation[];
  machines: Machine[];
  maintenance: MaintenanceEvent[];
  maintenanceProblems: MaintenanceProblem[];
  meetings: Meeting[];
  requests: InternalRequest[];
  erpQuality: ErpQualityIssue[];
  notifications: DemoNotification[];
  savContacts: MachineSavContact[];
  consumables: MachineConsumable[];
  people: TeamMember[];
  contacts: Contact[];
  projetSuivi: ProjetSuiviLog;
}
