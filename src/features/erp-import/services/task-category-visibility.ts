import type { OperationView } from "../types/erp-import.ts";

/**
 * Filtre les opérations dont la catégorie de tâche (`taskCode`) n'est pas explicitement
 * marquée visible. Contrairement aux autres filtres (machines, départements…), une liste
 * vide masque tout : c'est le comportement demandé pour découvrir les catégories ERP une par
 * une plutôt que de tout afficher d'un coup. Appelée depuis les deux seuls points où les
 * opérations ERP sont chargées côté client (`useWorkshopOperations`, `ErpPlanningWorkspace`),
 * pour que le masquage reste cohérent partout où le Planning affiche des opérations.
 */
export function applyTaskCategoryVisibility(operations: OperationView[], visibleTaskCategoryCodes: string[]): OperationView[] {
  const visible = new Set(visibleTaskCategoryCodes);
  return operations.filter((operation) => visible.has(operation.taskCode));
}
