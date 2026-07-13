export type Priority = "Basse" | "Normale" | "Haute" | "Urgente" | "Bloquante";
export type ActionStatus = "Ouverte" | "En cours" | "Reportée" | "Terminée";

export interface HistoryEntry {
  id: string;
  date: string;
  author: string;
  description: string;
}

export interface ProductionAction {
  id: string;
  title: string;
  description: string;
  responsible: string;
  department: string;
  priority: Priority;
  status: ActionStatus;
  dueDate: string;
  createdAt: string;
  sourceType: "email" | "QRQC" | "production_meeting" | "work_order" | "erp_quality" | "machine" | "request" | "manual";
  sourceId: string | null;
  workOrderId: string | null;
  machineId: string | null;
  project: string | null;
  comments: string[];
  history: HistoryEntry[];
}

export interface WorkOperation {
  id: string;
  number: number;
  description: string;
  department: string;
  machineId: string | null;
  plannedDurationHours: number;
  plannedDate: string | null;
  status: "À planifier" | "Planifiée" | "En cours" | "Terminée" | "Bloquée";
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
  photoUrl: string;
}

export interface MaintenanceEvent {
  id: string;
  machineId: string;
  type: "Préventive" | "Nettoyage" | "Lubrification" | "Étalonnage" | "Inspection" | "Intervention" | "Autre";
  date: string;
  durationHours: number;
  responsible: string;
  status: "Prévue" | "En cours" | "Terminée" | "Reportée";
  comment: string;
  planningKind?: "Maintenance" | "Divers";
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

export interface DemoData {
  version: 1;
  actions: ProductionAction[];
  workOrders: WorkOrder[];
  planning: PlannedOperation[];
  machines: Machine[];
  maintenance: MaintenanceEvent[];
  meetings: Meeting[];
  requests: InternalRequest[];
  erpQuality: ErpQualityIssue[];
  notifications: DemoNotification[];
}
