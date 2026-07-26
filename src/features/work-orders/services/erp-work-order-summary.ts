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
}

/**
 * Dérive un résumé d'OF à partir de ses opérations ERP (OperationView), même source que
 * l'Atelier et le Cockpit ERP. Aucune donnée n'est recalculée deux fois : le statut, le
 * retard et la progression viennent uniquement des champs déjà présents sur chaque opération.
 */
export function summarizeErpWorkOrder(rows: OperationView[]): ErpWorkOrderSummary {
  const first = rows[0];
  const current = rows.find((row) => row.effectiveStatus === "blocked") ?? rows.find((row) => row.effectiveStatus === "in-progress") ?? rows[0];
  const completedCount = rows.filter((row) => row.effectiveStatus === "completed").length;
  return {
    id: first.workOrderId,
    customer: first.workOrder?.customerName || "Client inconnu",
    article: first.articleCode || "Article inconnu",
    description: first.description || "",
    dueDate: first.dueDate,
    status: deriveErpWorkOrderStatus(rows),
    machine: current?.machine ?? "Non définie",
    department: current?.department ?? null,
    progress: rows.length ? Math.round((completedCount / rows.length) * 100) : 0,
    isLate: rows.some((row) => (row.delayDays ?? 0) > 0),
    operationCount: rows.length,
  };
}

/** Bloquée si une seule opération l'est ; en cours si une seule l'est ; terminée seulement si toutes le sont ; sinon à faire. */
export function deriveErpWorkOrderStatus(rows: OperationView[]): ErpOperationStatus {
  if (rows.some((row) => row.effectiveStatus === "blocked")) return "blocked";
  if (rows.some((row) => row.effectiveStatus === "in-progress")) return "in-progress";
  if (rows.length && rows.every((row) => row.effectiveStatus === "completed")) return "completed";
  return "not-started";
}

export function matchesErpWorkOrderFilters(item: ErpWorkOrderSummary, filters: { search: string; statusLabel: string; machine: string; department: string; delay: string }, statusLabels: Record<ErpOperationStatus, string>): boolean {
  const text = `${item.id} ${item.customer} ${item.article} ${item.description}`.toLocaleLowerCase("fr");
  return text.includes(filters.search.trim().toLocaleLowerCase("fr")) &&
    (filters.statusLabel === "Tous" || statusLabels[item.status] === filters.statusLabel) &&
    (filters.machine === "Toutes" || item.machine === filters.machine) &&
    (filters.department === "Tous" || item.department === filters.department) &&
    (filters.delay === "Tous" || (filters.delay === "En retard") === item.isLate);
}
