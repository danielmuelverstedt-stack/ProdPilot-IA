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
  module: "meeting" | "workOrder" | "machine" | "request" | "erpQuality" | "mail";
  id: string;
  label: string;
  href: string;
}

export interface ProductionAction {
  id: string;
  dateEncodage: string;
  introduitPar: string;
  origine: string;
  contextLink: ActionContextLink | null;
  description: string;
  responsable: string;
  echeance: string;
  statut: ActionStatus;
  dateCloture: string | null;
  remarque: string | null;
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

export interface Meeting {
  id: string;
  type: "QRQC" | "Production";
  date: string;
  status: "Planifiée" | "En cours" | "Clôturée";
  participants: string[];
  notes: string[];
  decisions: string[];
  parkingLot: string[];
  actionIds: string[];
}

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
  meetings: Meeting[];
  requests: InternalRequest[];
  erpQuality: ErpQualityIssue[];
  notifications: DemoNotification[];
  savContacts: MachineSavContact[];
  consumables: MachineConsumable[];
  people: TeamMember[];
  contacts: Contact[];
}
