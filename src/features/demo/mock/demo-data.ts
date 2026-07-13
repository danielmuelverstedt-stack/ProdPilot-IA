import type { DemoData, HistoryEntry, WorkOrder } from "@/features/demo/types/demo";

const history = (id: string, description: string, date = "2026-07-11T08:00:00.000Z"): HistoryEntry[] => [
  { id: `${id}-history-1`, date, author: "Daniel Mülverstedt", description },
];

export const initialDemoData: DemoData = {
  version: 1,
  machines: [
    { id: "TOU-01", name: "MAZAK INTEGREX 300", displayName: "Integrex 300", department: "Tournage", type: "Tournage / Fraisage", status: "En production", manufacturer: "Mazak", model: "Integrex 300", year: 2018, serialNumber: "MZ-I300-1842", robot: null, comments: "Machine polyvalente pour pièces complexes.", photoUrl: "" },
    { id: "FRA-01", name: "MAZAK VTC-200C-II", displayName: "VTC-200C-II", department: "Fraisage", type: "Fraisage 3 axes", status: "Disponible", manufacturer: "Mazak", model: "VTC-200C-II", year: 2015, serialNumber: "MZ-VTC-992", robot: null, comments: "Centre vertical grande course.", photoUrl: "" },
    { id: "FRA-10", name: "HEDELIUS ACURA 65 EL", displayName: "Acura 65", department: "Fraisage", type: "Fraisage 5 axes", status: "Maintenance prévue", manufacturer: "Hedelius", model: "Acura 65 EL", year: 2022, serialNumber: "HD-A65-2217", robot: "BMO Platinum", comments: "Cellule automatisée de nuit.", photoUrl: "" },
    { id: "FIL-01", name: "MITSUBISHI FA30S", displayName: "FA30S", department: "Découpe fil", type: "Électroérosion à fil", status: "En panne", manufacturer: "Mitsubishi", model: "FA30S", year: 2012, serialNumber: "MI-FA30-771", robot: null, comments: "Diagnostic générateur en cours.", photoUrl: "" },
  ],
  workOrders: [
    createWorkOrder("OF-240184", "Safran Aero Boosters", "AXE-TI-884", "Axe de commande en titane", 24, "Urgente", "2026-07-15", "En production", 55, "Projet LEAP", [
      [10, "Débit matière", "Tournage", "TOU-01", 3, "2026-07-13", "Terminée", 24, null],
      [20, "Tournage ébauche", "Tournage", "TOU-01", 12, "2026-07-13", "En cours", 12, null],
      [30, "Fraisage 5 axes", "Fraisage", "FRA-10", 16, "2026-07-14", "Planifiée", 0, "Maintenance à confirmer"],
    ]),
    createWorkOrder("OF-240191", "John Cockerill", "BRIDE-316L-42", "Bride haute pression inox", 18, "Haute", "2026-07-17", "Bloqué", 25, "Ligne H2", [
      [10, "Tournage ébauche", "Tournage", "TOU-01", 8, "2026-07-14", "Bloquée", 4, "Matière complémentaire attendue"],
      [20, "Fraisage perçages", "Fraisage", "FRA-01", 6, "2026-07-15", "Planifiée", 0, null],
    ]),
    createWorkOrder("OF-240203", "Sonaca", "OUT-7712", "Outillage de formage aile", 2, "Normale", "2026-07-22", "À lancer", 0, "Aile A320", [
      [10, "Fraisage ébauche", "Fraisage", "FRA-01", 20, "2026-07-16", "Planifiée", 0, null],
      [20, "Découpe fil inserts", "Découpe fil", "FIL-01", 10, null, "À planifier", 0, "Machine indisponible"],
    ]),
    createWorkOrder("OF-240211", "Atlas Copco", "CART-990", "Carter compresseur prototype", 6, "Haute", "2026-07-18", "En production", 70, "Prototype ZR", [
      [10, "Fraisage 5 axes", "Fraisage", "FRA-10", 14, "2026-07-13", "En cours", 4, null],
      [20, "Contrôle tridimensionnel", "Qualité", null, 3, "2026-07-15", "Planifiée", 0, null],
    ]),
    createWorkOrder("OF-240167", "FN Herstal", "SUP-155", "Support mécanisme", 40, "Normale", "2026-07-10", "En production", 85, "Série S4", [
      [10, "Fraisage série", "Fraisage", "FRA-01", 18, "2026-07-12", "En cours", 34, null],
      [20, "Découpe fil", "Découpe fil", "FIL-01", 8, "2026-07-14", "Planifiée", 0, "Risque lié à la panne machine"],
    ]),
  ],
  planning: [
    { id: "plan-1", workOrderId: "OF-240184", operationId: "OF-240184-20", machineId: "TOU-01", startAt: "2026-07-13T06:00:00.000Z", endAt: "2026-07-13T18:00:00.000Z", status: "En cours", comments: "Priorité client" },
    { id: "plan-2", workOrderId: "OF-240191", operationId: "OF-240191-10", machineId: "TOU-01", startAt: "2026-07-14T06:00:00.000Z", endAt: "2026-07-14T14:00:00.000Z", status: "Bloquée", comments: "Attente matière" },
    { id: "plan-3", workOrderId: "OF-240211", operationId: "OF-240211-10", machineId: "FRA-10", startAt: "2026-07-13T05:00:00.000Z", endAt: "2026-07-13T19:00:00.000Z", status: "En cours", comments: "Cycle automatisé" },
    { id: "plan-4", workOrderId: "OF-240203", operationId: "OF-240203-10", machineId: "FRA-01", startAt: "2026-07-16T06:00:00.000Z", endAt: "2026-07-17T02:00:00.000Z", status: "Planifiée", comments: "Préparer bridage" },
    { id: "plan-5", workOrderId: "OF-240167", operationId: "OF-240167-20", machineId: "FIL-01", startAt: "2026-07-14T06:00:00.000Z", endAt: "2026-07-14T14:00:00.000Z", status: "Planifiée", comments: "À déplacer si panne confirmée" },
  ],
  actions: [
    { id: "ACT-001", title: "Confirmer la fenêtre de maintenance FRA-10", description: "Valider avec la maintenance que l’OF-240184 peut démarrer mardi.", responsible: "Marc Lambert", department: "Maintenance", priority: "Urgente", status: "Ouverte", dueDate: "2026-07-13", createdAt: "2026-07-11", sourceType: "QRQC", sourceId: "MEET-QRQC-12", workOrderId: "OF-240184", machineId: "FRA-10", project: "Projet LEAP", comments: ["Créneau proposé à 05 h 00."], history: history("ACT-001", "Action créée pendant le QRQC") },
    { id: "ACT-002", title: "Relancer le fournisseur matière", description: "Obtenir une date ferme pour le complément 316L.", responsible: "Sophie Martin", department: "Achats", priority: "Haute", status: "En cours", dueDate: "2026-07-14", createdAt: "2026-07-10", sourceType: "work_order", sourceId: "OF-240191", workOrderId: "OF-240191", machineId: null, project: "Ligne H2", comments: [], history: history("ACT-002", "Action créée depuis l’OF-240191") },
    { id: "ACT-003", title: "Replanifier la découpe fil", description: "Identifier une alternative compatible pendant la panne FIL-01.", responsible: "Sophie Planification", department: "Planning", priority: "Bloquante", status: "Ouverte", dueDate: "2026-07-13", createdAt: "2026-07-13", sourceType: "machine", sourceId: "FIL-01", workOrderId: "OF-240167", machineId: "FIL-01", project: "Série S4", comments: [], history: history("ACT-003", "Action créée depuis l’alerte machine", "2026-07-13T07:10:00.000Z") },
    { id: "ACT-004", title: "Corriger la machine de l’opération 20", description: "Compléter le routage ERP de l’OF-240203.", responsible: "Julie Qualité", department: "Qualité", priority: "Normale", status: "Reportée", dueDate: "2026-07-16", createdAt: "2026-07-09", sourceType: "erp_quality", sourceId: "ERP-003", workOrderId: "OF-240203", machineId: null, project: "Aile A320", comments: ["Validation méthode nécessaire."], history: history("ACT-004", "Échéance reportée au 16/07/2026") },
    { id: "ACT-005", title: "Valider le contrôle première pièce", description: "Contrôler le carter prototype avant poursuite de série.", responsible: "Julie Qualité", department: "Qualité", priority: "Haute", status: "Terminée", dueDate: "2026-07-12", createdAt: "2026-07-11", sourceType: "production_meeting", sourceId: "MEET-PROD-07", workOrderId: "OF-240211", machineId: "FRA-10", project: "Prototype ZR", comments: ["PV ajouté au dossier atelier."], history: history("ACT-005", "Action terminée", "2026-07-12T14:30:00.000Z") },
  ],
  maintenance: [
    { id: "MAINT-01", machineId: "FRA-10", type: "Préventive", date: "2026-07-14T04:00:00.000Z", durationHours: 2, responsible: "Marc Lambert", status: "Prévue", comment: "Contrôle broche et graissage axes." },
    { id: "MAINT-02", machineId: "FIL-01", type: "Intervention", date: "2026-07-13T08:00:00.000Z", durationHours: 4, responsible: "Marc Lambert", status: "En cours", comment: "Diagnostic générateur." },
    { id: "MAINT-03", machineId: "TOU-01", type: "Nettoyage", date: "2026-07-18T14:00:00.000Z", durationHours: 1, responsible: "Équipe Tournage", status: "Prévue", comment: "Nettoyage hebdomadaire." },
  ],
  meetings: [
    { id: "MEET-QRQC-12", type: "QRQC", date: "2026-07-13T07:30:00.000Z", status: "Planifiée", participants: ["Daniel Mülverstedt", "Sophie Planification", "Julie Qualité"], notes: [], decisions: [], parkingLot: [], actionIds: ["ACT-001"] },
    { id: "MEET-PROD-07", type: "Production", date: "2026-07-14T09:30:00.000Z", status: "Planifiée", participants: ["Daniel Mülverstedt", "Sophie Planification", "Marc Lambert"], notes: ["Préparer l’arbitrage découpe fil."], decisions: [], parkingLot: [], actionIds: ["ACT-005"] },
  ],
  requests: [
    { id: "DEM-001", type: "Demande d’avance OF", title: "Avancer l’OF-240184", description: "Le client demande une expédition partielle de 12 pièces.", requester: "Commercial", responsible: "Sophie Planification", status: "En analyse", priority: "Urgente", createdAt: "2026-07-12", dueDate: "2026-07-13", workOrderId: "OF-240184", machineId: "TOU-01", comments: ["Capacité tournage à confirmer."], history: history("DEM-001", "Demande reçue du service commercial") },
    { id: "DEM-002", type: "Demande maintenance", title: "Diagnostic FIL-01", description: "Arrêt générateur pendant l’ébauche.", requester: "Découpe fil", responsible: "Marc Lambert", status: "En cours", priority: "Bloquante", createdAt: "2026-07-13", dueDate: "2026-07-13", workOrderId: "OF-240167", machineId: "FIL-01", comments: [], history: history("DEM-002", "Intervention démarrée", "2026-07-13T08:00:00.000Z") },
    { id: "DEM-003", type: "Demande qualité", title: "Dérogation matière OF-240191", description: "Analyser la matière disponible avant relance fournisseur.", requester: "Production", responsible: "Julie Qualité", status: "Reçue", priority: "Haute", createdAt: "2026-07-13", dueDate: "2026-07-14", workOrderId: "OF-240191", machineId: null, comments: [], history: history("DEM-003", "Demande créée") },
  ],
  erpQuality: [
    { id: "ERP-001", workOrderId: "OF-240203", problemType: "Machine manquante", severity: "Élevée", responsible: "Méthodes", score: 68, status: "Détectée", detectedAt: "2026-07-13", details: "L’opération 20 ne contient aucune machine compatible." },
    { id: "ERP-002", workOrderId: "OF-240167", problemType: "Échéance dépassée", severity: "Bloquante", responsible: "Planning", score: 54, status: "Envoyée", detectedAt: "2026-07-13", details: "La date client est dépassée depuis le 10/07/2026." },
    { id: "ERP-003", workOrderId: "OF-240191", problemType: "Statut incohérent", severity: "Moyenne", responsible: "Production", score: 76, status: "Détectée", detectedAt: "2026-07-12", details: "OF bloqué alors qu’une opération est encore marquée planifiée." },
    { id: "ERP-004", workOrderId: "OF-240184", problemType: "Opération après échéance client", severity: "Élevée", responsible: "Planning", score: 72, status: "Détectée", detectedAt: "2026-07-13", details: "Le fraisage se termine trop près de la date d’expédition." },
  ],
  notifications: [
    { id: "NOT-01", title: "Panne FIL-01", description: "Deux OF doivent être replanifiés.", href: "/machines/FIL-01", level: "danger", read: false },
    { id: "NOT-02", title: "Échéance OF-240184", description: "Arbitrage requis aujourd’hui.", href: "/of/OF-240184", level: "warning", read: false },
    { id: "NOT-03", title: "QRQC à 07 h 30", description: "La préparation est disponible.", href: "/reunions/qrqc", level: "information", read: true },
  ],
};

function createWorkOrder(
  id: string,
  customer: string,
  article: string,
  description: string,
  quantity: number,
  priority: WorkOrder["priority"],
  dueDate: string,
  status: WorkOrder["status"],
  progress: number,
  project: string,
  operations: [number, string, string, string | null, number, string | null, WorkOrder["operations"][number]["status"], number, string | null][],
): WorkOrder {
  return {
    id, customer, article, description, quantity, priority, dueDate, status, progress, project,
    dataProblems: operations.some((item) => !item[3]) ? ["Machine manquante dans le routage"] : [],
    comments: [],
    history: history(id, "OF importé dans les données de démonstration"),
    operations: operations.map(([number, operationDescription, department, machineId, plannedDurationHours, plannedDate, operationStatus, completedQuantity, blockingIssue]) => ({
      id: `${id}-${number}`,
      number,
      description: operationDescription,
      department,
      machineId,
      plannedDurationHours,
      plannedDate,
      status: operationStatus,
      completedQuantity,
      blockingIssue,
    })),
  };
}
