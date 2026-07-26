import { getTaskCategoryLabel, TASK_CATEGORY_CODES, UNCATEGORIZED_TASK_CATEGORY_VALUE } from "./task-category-dictionary.ts";

export interface TaskCategoryMachineGroup<M> {
  /** Code de catégorie, ou `null` pour le groupe « Non catégorisées ». */
  code: string | null;
  label: string;
  machines: M[];
}

/**
 * Regroupe des machines (physiques ou postes de travail) par catégorie de tâche, dans l'ordre
 * canonique du dictionnaire, en ne gardant que les catégories explicitement activées
 * (`visibleCodes`, le réglage partagé `visibleTaskCategoryCodes`) — vide par défaut, comme les
 * autres usages de ce réglage : rien ne s'affiche tant que l'utilisateur n'a rien activé.
 * Utilisé par Planning capacité et par l'Atelier (mode de regroupement « Catégorie ») pour
 * bâtir des sections dépliables identiques, à partir de la même source de vérité.
 */
export function groupMachinesByTaskCategory<M extends { taskCategoryCode?: string | null }>(
  machines: M[],
  visibleCodes: string[],
): TaskCategoryMachineGroup<M>[] {
  const visible = new Set(visibleCodes);
  const groups: TaskCategoryMachineGroup<M>[] = [];

  for (const code of TASK_CATEGORY_CODES) {
    if (!visible.has(code)) continue;
    const matching = machines.filter((machine) => machine.taskCategoryCode === code);
    groups.push({ code, label: getTaskCategoryLabel(code), machines: matching });
  }

  if (visible.has(UNCATEGORIZED_TASK_CATEGORY_VALUE)) {
    const uncategorized = machines.filter((machine) => !machine.taskCategoryCode);
    groups.push({ code: null, label: "Non catégorisées", machines: uncategorized });
  }

  return groups;
}
