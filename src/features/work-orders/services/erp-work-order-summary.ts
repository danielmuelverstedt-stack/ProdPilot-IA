import type { ErpOperationStatus, OperationView } from "@/features/erp-import/types/erp-import";

export interface ErpWorkOrderSummary {
  id: string;
  customer: string;
  article: string;
  description: string;
  dueDate: string | null;
  status: ErpOperationStatus;
  machine: string;
  department: string | null;
  progress: number;
  isLate: boolean;
  operationCount: number;
  /** Date de clôture (la plus récente `actualEndAt` de ses opérations), uniquement quand l'OF est entièrement terminé ; `null` sinon. */
  closedAt: string | null;
  /** Id du tout premier import où cet OF est apparu ; voir `ErpWorkOrder.firstSeenImportId`. `null` si absent (avant le prochain import après ce changement). */
  firstSeenImportId: string | null;
  /** Vrai si au moins une opération est « En attente », indépendamment du statut global affiché (ex. un OF avec une opération bloquée ET une en attente affiche « Bloquée » mais reste repéré ici). */
  hasWaitingOperation: boolean;
}

/**
 * Dérive un résumé d'OF à partir de ses opérations ERP (OperationView), même source que
 * l'Atelier et le Cockpit ERP. Aucune donnée n'est recalculée deux fois : le statut, le
 * retard et la progression viennent uniquement des champs déjà présents sur chaque opération.
 */
export function summarizeErpWorkOrder(rows: OperationView[]): ErpWorkOrderSummary {
  const first = rows[0];
  const current = rows.find((row) => row.effectiveStatus === "blocked") ?? rows.find((row) => row.effectiveStatus === "waiting") ?? rows.find((row) => row.effectiveStatus === "in-progress") ?? rows[0];
  const completedCount = rows.filter((row) => row.effectiveStatus === "completed").length;
  const status = deriveErpWorkOrderStatus(rows);
  return {
    id: first.workOrderId,
    customer: first.workOrder?.customerName || "Client inconnu",
    article: first.articleCode || "Article inconnu",
    description: first.description || "",
    dueDate: first.dueDate,
    status,
    machine: current?.machine ?? "Non définie",
    department: current?.department ?? null,
    progress: rows.length ? Math.round((completedCount / rows.length) * 100) : 0,
    isLate: rows.some((row) => (row.delayDays ?? 0) > 0),
    operationCount: rows.length,
    closedAt: status === "completed" ? maxDate(rows.map((row) => row.actualEndAt)) : null,
    firstSeenImportId: first.workOrder?.firstSeenImportId ?? null,
    hasWaitingOperation: rows.some((row) => row.effectiveStatus === "waiting"),
  };
}

/** Comparaison lexicale valide sur des dates ISO (JJJJ-MM-JJ ou horodatage complet), comme ailleurs dans le module Planning. */
function maxDate(values: Array<string | null>): string | null {
  const known = values.filter((value): value is string => Boolean(value));
  return known.length ? known.reduce((max, value) => (value > max ? value : max)) : null;
}

/** Bloquée si une seule opération l'est ; sinon en attente si une seule l'est ; sinon en cours si une seule l'est ; terminée seulement si toutes le sont ; sinon à faire. */
export function deriveErpWorkOrderStatus(rows: OperationView[]): ErpOperationStatus {
  if (rows.some((row) => row.effectiveStatus === "blocked")) return "blocked";
  if (rows.some((row) => row.effectiveStatus === "waiting")) return "waiting";
  if (rows.some((row) => row.effectiveStatus === "in-progress")) return "in-progress";
  if (rows.length && rows.every((row) => row.effectiveStatus === "completed")) return "completed";
  return "not-started";
}

export function matchesErpWorkOrderFilters(item: ErpWorkOrderSummary, filters: { search: string; statusLabel: string; machine: string; department: string; delay: string; closedAfter?: string | null; newOnly?: boolean; activeImportId?: string | null; waitingOnly?: boolean }, statusLabels: Record<ErpOperationStatus, string>): boolean {
  const text = `${item.id} ${item.customer} ${item.article} ${item.description}`.toLocaleLowerCase("fr");
  return text.includes(filters.search.trim().toLocaleLowerCase("fr")) &&
    (filters.statusLabel === "Tous" || statusLabels[item.status] === filters.statusLabel) &&
    (filters.machine === "Toutes" || item.machine === filters.machine) &&
    (filters.department === "Tous" || item.department === filters.department) &&
    (filters.delay === "Tous" || (filters.delay === "En retard") === item.isLate) &&
    (!filters.closedAfter || (item.closedAt !== null && item.closedAt >= filters.closedAfter)) &&
    (!filters.newOnly || (item.firstSeenImportId !== null && item.firstSeenImportId === filters.activeImportId)) &&
    (!filters.waitingOnly || item.hasWaitingOperation);
}
