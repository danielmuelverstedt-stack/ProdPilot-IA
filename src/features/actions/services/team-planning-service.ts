import { updateDemoData } from "@/features/demo/services/demo-repository";
import type { Priority, ProductionAction, TeamMember } from "@/features/demo/types/demo";
import { addIsoWeeks, isoWeekKey, isoWeekMonthKey } from "./iso-week";

/**
 * Index personne+semaine → actions planifiées (triées par `planningOrder`) et charge totale,
 * construit une seule fois par rendu de la grille (voir `buildTeamPlanningIndex`) plutôt que de
 * refiltrer la liste complète des actions à chaque case affichée.
 */
export interface TeamPlanningIndex {
  actionsByCell: Map<string, ProductionAction[]>;
  hoursByCell: Map<string, number>;
}

export function cellKey(personId: string, weekKey: string): string {
  return `${personId}:${weekKey}`;
}

/** Une action « Fait » compte pour 0 h (exclue du total de charge), mais reste dans `actionsByCell` pour rester visible, grisée. */
function chargeableHours(action: ProductionAction): number {
  return action.statut === "Fait" ? 0 : action.estimatedHours ?? 0;
}

export function buildTeamPlanningIndex(actions: ProductionAction[]): TeamPlanningIndex {
  const actionsByCell = new Map<string, ProductionAction[]>();
  actions.forEach((action) => {
    if (!action.responsableId || !action.plannedWeek) return;
    const key = cellKey(action.responsableId, action.plannedWeek);
    const list = actionsByCell.get(key);
    if (list) list.push(action);
    else actionsByCell.set(key, [action]);
  });
  actionsByCell.forEach((list) => list.sort((a, b) => (a.planningOrder ?? 0) - (b.planningOrder ?? 0)));
  const hoursByCell = new Map<string, number>();
  actionsByCell.forEach((list, key) => hoursByCell.set(key, list.reduce((sum, action) => sum + chargeableHours(action), 0)));
  return { actionsByCell, hoursByCell };
}

/** Actions avec responsable ET charge, mais pas encore de semaine — panneau « Non planifiées ». Une action « Fait » n'a plus besoin d'être planifiée. */
export function unscheduledActions(actions: ProductionAction[]): ProductionAction[] {
  return actions.filter((action) => action.responsableId !== null && action.estimatedHours !== null && action.plannedWeek === null && action.statut !== "Fait");
}

/** Aperçu du total d'une case si `draggedAction` y était déposée (sans compter deux fois si elle y est déjà). */
export function previewCellHours(index: TeamPlanningIndex, personId: string, weekKey: string, draggedAction: ProductionAction): number {
  const current = index.hoursByCell.get(cellKey(personId, weekKey)) ?? 0;
  const alreadyInCell = draggedAction.responsableId === personId && draggedAction.plannedWeek === weekKey;
  return alreadyInCell ? current : current + chargeableHours(draggedAction);
}

export function loadPercent(hours: number, capacityHours: number): number {
  return capacityHours > 0 ? Math.round((hours / capacityHours) * 100) : 0;
}

function nextOrderInCell(actions: ProductionAction[], personId: string, weekKey: string, excludeActionId: string): number {
  const orders = actions
    .filter((item) => item.id !== excludeActionId && item.responsableId === personId && item.plannedWeek === weekKey)
    .map((item) => item.planningOrder ?? 0);
  return orders.length ? Math.max(...orders) + 1 : 0;
}

function applyAssignment(action: ProductionAction, person: TeamMember, weekKey: string, allActions: ProductionAction[]): void {
  action.responsableId = person.id;
  action.responsable = person.name;
  action.plannedWeek = weekKey;
  action.planningOrder = nextOrderInCell(allActions, person.id, weekKey, action.id);
}

/** Dépose une carte sur une case personne × semaine : assigne la période et, si besoin, réassigne le responsable. */
export function assignAction(actionId: string, personId: string, weekKey: string): boolean {
  let updated = false;
  updateDemoData((draft) => {
    const action = draft.actions.find((item) => item.id === actionId);
    const person = draft.people.find((item) => item.id === personId);
    if (!action || !person) return;
    applyAssignment(action, person, weekKey, draft.actions);
    updated = true;
  });
  return updated;
}

/** Dépose une carte sur le panneau « Non planifiées » : retire la période, garde le responsable (ne perd jamais l'affectation ni la charge). */
export function unassignAction(actionId: string): boolean {
  let updated = false;
  updateDemoData((draft) => {
    const action = draft.actions.find((item) => item.id === actionId);
    if (!action) return;
    action.plannedWeek = null;
    action.planningOrder = null;
    updated = true;
  });
  return updated;
}

/** Réordonnance les cartes d'une case après un glisser vertical ; ignore silencieusement les id qui ne sont plus dans cette case. */
export function reorderWithinCell(personId: string, weekKey: string, orderedActionIds: string[]): boolean {
  let updated = false;
  updateDemoData((draft) => {
    let order = 0;
    orderedActionIds.forEach((id) => {
      const action = draft.actions.find((item) => item.id === id && item.responsableId === personId && item.plannedWeek === weekKey);
      if (!action) return;
      action.planningOrder = order;
      order += 1;
      updated = true;
    });
  });
  return updated;
}

/** Semaines ISO attribuées à `monthKey` (celles dont le lundi tombe dans ce mois), dans l'ordre chronologique. */
export function weeksInMonth(monthKey: string): string[] {
  const [year, month] = monthKey.split("-").map(Number);
  if (!year || !month) return [];
  let cursor = isoWeekKey(new Date(Date.UTC(year, month - 1, 1)));
  if (isoWeekMonthKey(cursor) !== monthKey) cursor = addIsoWeeks(cursor, 1);
  const weeks: string[] = [];
  while (isoWeekMonthKey(cursor) === monthKey) {
    weeks.push(cursor);
    cursor = addIsoWeeks(cursor, 1);
  }
  return weeks;
}

/**
 * Dépose une carte sur un mois (vue Mois) : place l'action sur la première semaine de ce mois qui
 * n'est pas déjà en surcharge pour cette personne, sinon la première semaine du mois.
 */
export function moveToMonth(actionId: string, personId: string, monthKey: string): boolean {
  let updated = false;
  updateDemoData((draft) => {
    const action = draft.actions.find((item) => item.id === actionId);
    const person = draft.people.find((item) => item.id === personId);
    const weeks = weeksInMonth(monthKey);
    if (!action || !person || !weeks.length) return;
    const targetWeek = weeks.find((week) => {
      const existingHours = draft.actions
        .filter((item) => item.id !== action.id && item.responsableId === personId && item.plannedWeek === week)
        .reduce((sum, item) => sum + chargeableHours(item), 0);
      return existingHours + chargeableHours(action) <= person.weeklyCapacityHours;
    }) ?? weeks[0];
    applyAssignment(action, person, targetWeek, draft.actions);
    updated = true;
  });
  return updated;
}

/** Priorité modifiée depuis l'onglet Liste des actions ; affichée sous forme de pastille sur les cartes de la grille. */
export function updateActionPriority(actionId: string, priority: Priority | null): boolean {
  let updated = false;
  updateDemoData((draft) => {
    const action = draft.actions.find((item) => item.id === actionId);
    if (!action) return;
    action.priority = priority;
    updated = true;
  });
  return updated;
}

/** Champ « Charge estimée » modifié depuis l'onglet Liste des actions (indépendant du drag). */
export function updateEstimatedHours(actionId: string, hours: number | null): boolean {
  let updated = false;
  updateDemoData((draft) => {
    const action = draft.actions.find((item) => item.id === actionId);
    if (!action) return;
    action.estimatedHours = hours;
    updated = true;
  });
  return updated;
}

/** Champ « Responsable » modifié depuis l'onglet Liste des actions : référence toujours la personne par id, synchronise le texte libre affiché ailleurs dans l'app. */
export function updateResponsableId(actionId: string, personId: string | null): boolean {
  let updated = false;
  updateDemoData((draft) => {
    const action = draft.actions.find((item) => item.id === actionId);
    if (!action) return;
    if (personId === null) { action.responsableId = null; updated = true; return; }
    const person = draft.people.find((item) => item.id === personId);
    if (!person) return;
    action.responsableId = personId;
    action.responsable = person.name;
    updated = true;
  });
  return updated;
}

/** Champ « Période planifiée » modifié depuis l'onglet Liste des actions, sans glisser-déposer. */
export function updatePlannedWeek(actionId: string, weekKey: string | null): boolean {
  let updated = false;
  updateDemoData((draft) => {
    const action = draft.actions.find((item) => item.id === actionId);
    if (!action || !action.responsableId) return;
    if (weekKey === null) { action.plannedWeek = null; action.planningOrder = null; updated = true; return; }
    action.plannedWeek = weekKey;
    action.planningOrder = nextOrderInCell(draft.actions, action.responsableId, weekKey, action.id);
    updated = true;
  });
  return updated;
}

function nextTeamMemberId(existing: TeamMember[]): string {
  const highest = existing.reduce((max, item) => {
    const match = /^person-(\d+)$/.exec(item.id);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);
  return `person-${highest + 1}`;
}

export function createTeamMember(name: string, weeklyCapacityHours: number): string {
  let id = "";
  updateDemoData((draft) => {
    id = nextTeamMemberId(draft.people);
    draft.people.push({ id, name: name.trim(), weeklyCapacityHours, order: draft.people.length });
  });
  return id;
}

export function updateTeamMember(personId: string, patch: { name?: string; weeklyCapacityHours?: number }): boolean {
  let updated = false;
  updateDemoData((draft) => {
    const person = draft.people.find((item) => item.id === personId);
    if (!person) return;
    if (patch.name !== undefined) {
      person.name = patch.name.trim();
      draft.actions.forEach((action) => { if (action.responsableId === personId) action.responsable = person.name; });
    }
    if (patch.weeklyCapacityHours !== undefined) person.weeklyCapacityHours = patch.weeklyCapacityHours;
    updated = true;
  });
  return updated;
}

/**
 * Supprime une personne : ses actions gardent `responsableId` (jamais de perte de charge/historique,
 * juste un badge « Responsable supprimé » tant qu'aucune nouvelle personne n'est réaffectée) mais
 * perdent leur période — elles réapparaissent dans « Non planifiées », comme demandé.
 */
export function deleteTeamMember(personId: string): boolean {
  let updated = false;
  updateDemoData((draft) => {
    const index = draft.people.findIndex((item) => item.id === personId);
    if (index < 0) return;
    draft.people.splice(index, 1);
    draft.actions.forEach((action) => {
      if (action.responsableId === personId) { action.plannedWeek = null; action.planningOrder = null; }
    });
    updated = true;
  });
  return updated;
}
