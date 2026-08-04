import type { DemoData, HistoryEntry, WorkOrder } from "@/features/demo/types/demo";
import { TKMI_DIRECTORY_CONTACTS } from "@/features/demo/mock/tkmi-directory-seed";

const history = (id: string, description: string, date = "2026-07-11T08:00:00.000Z"): HistoryEntry[] => [
  { id: `${id}-history-1`, date, author: "Daniel Mülverstedt", description },
];

export const initialDemoData: DemoData = {
  version: 2,
  machines: [
    {
      id: "TOU-01", name: "MAZAK INTEGREX 300", displayName: "Integrex 300", department: "Tournage", type: "Tournage / Fraisage", status: "En production", manufacturer: "Mazak", model: "Integrex 300", year: 2018, serialNumber: "MZ-I300-1842", robot: null, comments: "Machine polyvalente pour pièces complexes.",
      machiningType: "Tournage-fraisage", cncControl: "Mazatrol",
      unverifiedFields: ["machiningType", "cncControl"],
    },
    {
      id: "FRA-01", name: "MAZAK VTC-200C-II", displayName: "VTC-200C-II", department: "Fraisage", type: "Fraisage 3 axes", status: "Disponible", manufacturer: "Mazak", model: "VTC-200C-II", year: 2015, serialNumber: "MZ-VTC-992", robot: null, comments: "Centre vertical grande course.",
      machiningType: "3 axes", toolSpindleOrCone: "BT40",
      unverifiedFields: ["machiningType", "toolSpindleOrCone"],
    },
    {
      id: "FRA-10", name: "HEDELIUS ACURA 65 EL", displayName: "Acura 65", department: "Fraisage", type: "Fraisage 5 axes", status: "Maintenance prévue", manufacturer: "Hedelius", model: "Acura 65 EL", year: 2022, serialNumber: "HD-A65-2217", robot: "BMO Platinum", comments: "Cellule automatisée de nuit.",
      machiningType: "5 axes", cncControl: "Heidenhain TNC",
      unverifiedFields: ["machiningType", "cncControl"],
    },
    { id: "FIL-01", name: "MITSUBISHI FA30S", displayName: "FA30S", department: "Découpe fil", type: "Électroérosion à fil", status: "En panne", manufacturer: "Mitsubishi", model: "FA30S", year: 2012, serialNumber: "MI-FA30-771", robot: null, comments: "Diagnostic générateur en cours." },
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
    { id: "ACT-001", dateEncodage: "2026-07-11", introduitPar: "Daniel Mülverstedt", origine: "QRQC", contextLink: { module: "meeting", id: "MEET-QRQC-12", label: "MEET-QRQC-12", href: "/reunions/qrqc" }, description: "Confirmer la fenêtre de maintenance FRA-10 — Valider avec la maintenance que l’OF-240184 peut démarrer mardi.", responsable: "Marc Lambert", echeance: "2026-07-13", statut: "À faire", dateCloture: null, remarque: "Créneau proposé à 05 h 00.", priority: "Haute", responsableId: "person-marc-lambert", estimatedHours: 2, plannedWeek: "2026-W28", planningOrder: 0, parentActionId: null },
    { id: "ACT-002", dateEncodage: "2026-07-10", introduitPar: "Daniel Mülverstedt", origine: "Planning", contextLink: { module: "workOrder", id: "OF-240191", label: "OF-240191", href: "/of/OF-240191" }, description: "Relancer le fournisseur matière — Obtenir une date ferme pour le complément 316L.", responsable: "Sophie Martin", echeance: "2026-07-14", statut: "À faire", dateCloture: null, remarque: null, priority: "Normale", responsableId: null, estimatedHours: 3, plannedWeek: null, planningOrder: null, parentActionId: null },
    { id: "ACT-003", dateEncodage: "2026-07-13", introduitPar: "Daniel Mülverstedt", origine: "Parc machines", contextLink: { module: "machine", id: "FIL-01", label: "FIL-01", href: "/machines/FIL-01" }, description: "Replanifier la découpe fil — Identifier une alternative compatible pendant la panne FIL-01.", responsable: "Sophie Planification", echeance: "2026-07-13", statut: "À faire", dateCloture: null, remarque: null, priority: "Urgente", responsableId: "person-sophie-planification", estimatedHours: 4, plannedWeek: null, planningOrder: null, parentActionId: null },
    { id: "ACT-004", dateEncodage: "2026-07-09", introduitPar: "Daniel Mülverstedt", origine: "Qualité ERP", contextLink: { module: "erpQuality", id: "ERP-003", label: "ERP-003", href: "/qualite-erp/ERP-003" }, description: "Corriger la machine de l’opération 20 — Compléter le routage ERP de l’OF-240203.", responsable: "Julie Qualité", echeance: "2026-07-16", statut: "Reporté", dateCloture: null, remarque: "Validation méthode nécessaire.", priority: "Basse", responsableId: "person-julie-qualite", estimatedHours: 1.5, plannedWeek: "2026-W28", planningOrder: 0, parentActionId: null },
    { id: "ACT-005", dateEncodage: "2026-07-11", introduitPar: "Daniel Mülverstedt", origine: "Réunion de production", contextLink: { module: "meeting", id: "MEET-PROD-07", label: "MEET-PROD-07", href: "/reunions/production" }, description: "Valider le contrôle première pièce — Contrôler le carter prototype avant poursuite de série.", responsable: "Julie Qualité", echeance: "2026-07-12", statut: "Fait", dateCloture: "2026-07-12T14:30:00.000Z", remarque: "PV ajouté au dossier atelier.", priority: "Normale", responsableId: "person-julie-qualite", estimatedHours: 2, plannedWeek: "2026-W27", planningOrder: 0, parentActionId: null },
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
  savContacts: [],
  consumables: [
    { id: "CONS-01", machineId: "TOU-01", category: "Filtre", designation: "Filtre à huile hydraulique", manufacturerReference: "MZ-HYD-F120", supplier: "Mazak Europe", replacementFrequency: "Tous les 6 mois", storageLocation: "Armoire consommables A", notes: "Exemple de démonstration.", isExample: true },
    { id: "CONS-02", machineId: "TOU-01", category: "Huile", designation: "Huile hydraulique ISO VG46", manufacturerReference: "SHELL-TELLUS-46", supplier: "Shell", replacementFrequency: "Annuelle", storageLocation: "Local produits atelier", notes: "Exemple de démonstration.", isExample: true },
    { id: "CONS-03", machineId: "TOU-01", category: "Liquide de coupe", designation: "Émulsion soluble", manufacturerReference: "BLASOCUT-2000", supplier: "Blaser Swisslube", replacementFrequency: "Tous les 3 mois", storageLocation: "Cuve centrale", notes: "Exemple de démonstration.", isExample: true },
    { id: "CONS-04", machineId: "TOU-01", category: "Filtre", designation: "Filtre à air armoire électrique", manufacturerReference: "RITTAL-3238100", supplier: "Rittal", replacementFrequency: "Tous les 3 mois", storageLocation: "Armoire consommables A", notes: "Exemple de démonstration.", isExample: true },
    { id: "CONS-05", machineId: "TOU-01", category: "Graisse", designation: "Graisse broche et axes", manufacturerReference: "KLUBER-NBU15", supplier: "Klüber Lubrication", replacementFrequency: "Tous les 6 mois", storageLocation: "Armoire consommables A", notes: "Exemple de démonstration.", isExample: true },
  ],
  people: [
    { id: "person-marc-lambert", name: "Marc Lambert", weeklyCapacityHours: 38, order: 0 },
    { id: "person-sophie-planification", name: "Sophie Planification", weeklyCapacityHours: 38, order: 1 },
    { id: "person-julie-qualite", name: "Julie Qualité", weeklyCapacityHours: 32, order: 2 },
  ],
  contacts: [
    { id: "CT-001", type: "Externe", firstName: "Anke", lastName: "Verhoeven", company: "Mazak Europe", role: "Support technique", categoryIds: ["contact-category-fournisseur", "contact-category-maintenance"], phone: "+49 2151 5058 0", mobile: null, internalNumber: null, email: "support@mazak-europe.example", address: "Mazak-Allee 1, 41069 Mönchengladbach, Allemagne", website: "https://www.mazakeu.example", notes: "Contact pièces détachées et interventions Tournage." },
    { id: "CT-002", type: "Externe", firstName: "Bruno", lastName: "Fontaine", company: "Thermitech SA", role: "Responsable clientèle", categoryIds: ["contact-category-sous-traitance-traitement-thermique"], phone: "+32 71 98 76 54", mobile: "+32 478 98 76 54", internalNumber: null, email: "b.fontaine@thermitech.example", address: "Rue de l’Industrie 12, 6000 Charleroi, Belgique", website: null, notes: "Traitement thermique — délai habituel 5 jours ouvrés." },
    ...TKMI_DIRECTORY_CONTACTS,
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
