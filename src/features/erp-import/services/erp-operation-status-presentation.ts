import type { ErpOperationStatus } from "../types/erp-import.ts";

/**
 * Libellés et tons partagés pour ErpOperationStatus (5 valeurs fixes, indépendantes des
 * StatusSettings configurables des Réglages) : source unique pour l'Atelier et pour Planning
 * capacité quand il affiche des opérations ERP, afin de ne jamais dupliquer cette table.
 */
export const ERP_OPERATION_STATUS_LABELS: Record<ErpOperationStatus, string> = {
  "not-started": "À faire",
  "in-progress": "En cours",
  completed: "Terminée",
  blocked: "Bloquée",
  unknown: "À qualifier",
  waiting: "En attente",
};

export type ErpOperationStatusTone = "neutral" | "success" | "warning" | "danger" | "info";

export function erpOperationStatusTone(status: ErpOperationStatus): ErpOperationStatusTone {
  if (status === "completed") return "success";
  if (status === "blocked") return "danger";
  if (status === "in-progress") return "info";
  if (status === "waiting") return "warning";
  if (status === "unknown") return "neutral";
  return "neutral";
}

/** Mêmes seuils partout où un retard ERP est affiché (Cockpit ERP, Atelier, OF) : source unique. */
export function erpOperationDelayTone(delayDays: number | null): ErpOperationStatusTone {
  if (delayDays === null) return "neutral";
  if (delayDays > 15) return "danger";
  if (delayDays > 0) return "warning";
  return "success";
}

export function erpOperationDelayLabel(delayDays: number | null): string {
  if (delayDays === null) return "Sans date";
  if (delayDays > 0) return `${delayDays} j retard`;
  if (delayDays < 0) return `${Math.abs(delayDays)} j avance`;
  return "Aujourd’hui";
}
