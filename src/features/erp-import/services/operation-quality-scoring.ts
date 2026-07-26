import type { ErpOperationStatus, ErpQualityIssue } from "../types/erp-import.ts";

/**
 * Règles de score de priorité et d'anomalies qualité, partagées entre l'enrichissement serveur
 * (`erp-planning-service.ts`) et la mise à jour locale optimiste du client (`operation-view-local-patch.ts`).
 * Extrait ici (fichier sans `server-only`) pour que les deux ne puissent jamais diverger — une
 * seule définition, importée des deux côtés plutôt que recopiée.
 */
export const ISSUE_LABELS: Record<ErpQualityIssue["category"], string> = {
  "missing-machine": "Machine non définie", "missing-date": "Délai manquant", "missing-priority": "Priorité à zéro",
  "missing-task": "Code tâche manquant", "unknown-macro-range": "Macro gamme inconnue", "missing-customer": "Client inconnu",
  "missing-article": "Article inconnu", "missing-reference": "Référence manquante", "missing-work-order": "Opération orpheline",
  "work-order-without-operation": "OF sans opération", "duplicate-operation": "Opération en doublon", "invalid-date": "Date incohérente",
  "invalid-quantity": "Quantité à zéro", "suspect-quantity": "Quantité 9999", "inconsistent-article": "Article incohérent",
  "unknown-status": "Statut non reconnu",
};

export function issueLabel(category: ErpQualityIssue["category"]): string {
  return ISSUE_LABELS[category];
}

export function issueIsPerWorkOrder(category: ErpQualityIssue["category"]): boolean {
  return ["missing-customer", "missing-reference", "invalid-quantity", "suspect-quantity", "inconsistent-article", "invalid-date"].includes(category);
}

export function priorityScore(delayDays: number | null, priority: number, status: ErpOperationStatus, subcontracted: boolean, issueCount: number): number {
  const latePoints = delayDays && delayDays > 0 ? Math.min(50, delayDays * 2) : 0;
  const erpPoints = Math.min(25, Math.max(0, priority));
  return Math.round(latePoints + erpPoints + (status === "in-progress" ? 10 : 0) + (subcontracted ? 5 : 0) + Math.min(10, issueCount * 2));
}

export function collectIssueCategories(operation: { id: string; workOrderId: string; sourceMachineCode: string | null; dueDate: string | null; sourcePriority: number; taskCode: string; sourceMacroRangeCode: string; articleCode: string; sourceStatus: ErpOperationStatus; duplicateOf: string | null; actualStartAt: string | null; actualEndAt: string | null }, order: { articleCode: string; customerName: string; customerReference: string | null; requestedDueDate: string | null; confirmedDueDate: string | null; quantity: number } | null, machineId: string | null): ErpQualityIssue["category"][] {
  const issues: ErpQualityIssue["category"][] = [];
  if (!machineId) issues.push("missing-machine");
  if (!operation.dueDate && !order?.confirmedDueDate && !order?.requestedDueDate) issues.push("missing-date");
  if (operation.sourcePriority === 0) issues.push("missing-priority");
  if (!operation.taskCode || operation.taskCode === "0") issues.push("missing-task");
  if (!operation.sourceMacroRangeCode || operation.sourceMacroRangeCode === "0") issues.push("unknown-macro-range");
  if (!order) issues.push("missing-work-order");
  if (order && !order.customerName) issues.push("missing-customer");
  if (!operation.articleCode) issues.push("missing-article");
  if (order && !order.customerReference) issues.push("missing-reference");
  if (order && operation.articleCode !== order.articleCode) issues.push("inconsistent-article");
  if (order?.quantity === 0) issues.push("invalid-quantity");
  if (order?.quantity === 9999) issues.push("suspect-quantity");
  if (operation.sourceStatus === "unknown") issues.push("unknown-status");
  if (operation.duplicateOf) issues.push("duplicate-operation");
  if ((operation.actualStartAt && operation.actualEndAt && operation.actualEndAt < operation.actualStartAt) || isImplausibleDate(operation.dueDate) || isImplausibleDate(order?.requestedDueDate ?? null) || isImplausibleDate(order?.confirmedDueDate ?? null)) issues.push("invalid-date");
  return issues;
}

export function rowIssueLabels(operation: Parameters<typeof collectIssueCategories>[0], order: Parameters<typeof collectIssueCategories>[1], machineId: string | null, plannedDate: string | null, priority: number, status: ErpOperationStatus): string[] {
  const categories = collectIssueCategories(operation, order, machineId);
  if (!plannedDate && !categories.includes("missing-date")) categories.push("missing-date");
  if (priority === 0 && !categories.includes("missing-priority")) categories.push("missing-priority");
  if (status === "unknown" && !categories.includes("unknown-status")) categories.push("unknown-status");
  return categories.map(issueLabel);
}

function today(): string { return new Date().toISOString().slice(0, 10); }
function calendarDaysBetween(from: string, to: string): number { return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000); }
function isImplausibleDate(value: string | null): boolean { return Boolean(value && Math.abs(calendarDaysBetween(value, today())) > 3_650); }
