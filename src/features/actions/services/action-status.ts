import type { ActionStatus, ProductionAction } from "@/features/demo/types/demo";

/**
 * Une action "À planifier" (idée d'amélioration mise de côté) n'a pas encore d'échéance réelle —
 * elle ne doit jamais être comptée en retard tant qu'elle n'a pas été validée via `planAction`.
 * Source unique, reprise par ActionRow, action-grouping et l'assistant Actions (jusque-là trois
 * copies de la même règle, qui auraient divergé sans ce correctif).
 */
export function isActionOverdue(action: ProductionAction, today: string = new Date().toISOString().slice(0, 10)): boolean {
  return action.statut !== "Fait" && action.statut !== "À planifier" && action.echeance < today;
}

export function actionStatusTone(statut: ActionStatus): "neutral" | "success" | "warning" | "info" {
  if (statut === "Fait") return "success";
  if (statut === "Reporté") return "warning";
  if (statut === "À planifier") return "info";
  return "neutral";
}
