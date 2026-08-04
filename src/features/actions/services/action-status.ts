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

/**
 * Une sous-action (créée depuis la fiche d'une autre action) n'apparaît que dans la fiche de son
 * action parente — jamais dans les listes de premier niveau (registre Actions, Planification
 * équipe, revue de réunion), pour ne pas y apparaître en double sous une forme détachée de son
 * contexte. Source unique de cette règle d'exclusion.
 */
export function isSubAction(action: ProductionAction): boolean {
  return action.parentActionId !== null;
}
