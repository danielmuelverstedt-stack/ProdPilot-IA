import { isActionOverdue } from "@/features/actions/services/action-status";
import type { ProductionAction } from "@/features/demo/types/demo";

export type ActionGroupMode = "personne" | "origine" | "echeance";

export interface ActionGroup {
  key: string;
  label: string;
  items: ProductionAction[];
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function endOfWeekIso(today: string): string {
  const date = new Date(`${today}T00:00:00`);
  const day = date.getDay();
  const daysUntilSunday = day === 0 ? 0 : 7 - day;
  date.setDate(date.getDate() + daysUntilSunday);
  return date.toISOString().slice(0, 10);
}

function countOverdue(items: ProductionAction[], today: string): number {
  return items.filter((item) => isActionOverdue(item, today)).length;
}

function sortWithOverdueFirst(items: ProductionAction[], today: string): ProductionAction[] {
  return [...items].sort((a, b) => {
    const overdueDiff = Number(isActionOverdue(b, today)) - Number(isActionOverdue(a, today));
    if (overdueDiff !== 0) return overdueDiff;
    return a.echeance.localeCompare(b.echeance);
  });
}

export function groupActions(actions: ProductionAction[], mode: ActionGroupMode, today = todayIso()): ActionGroup[] {
  if (mode === "personne") {
    const byPerson = new Map<string, ProductionAction[]>();
    actions.forEach((action) => { const key = action.responsable || "Non assigné"; byPerson.set(key, [...(byPerson.get(key) ?? []), action]); });
    return [...byPerson.entries()]
      .map(([label, items]) => ({ key: label, label, items: sortWithOverdueFirst(items, today) }))
      .sort((a, b) => countOverdue(b.items, today) - countOverdue(a.items, today) || a.label.localeCompare(b.label, "fr"));
  }
  if (mode === "origine") {
    const byOrigin = new Map<string, ProductionAction[]>();
    actions.forEach((action) => { const key = action.origine || "Manuel"; byOrigin.set(key, [...(byOrigin.get(key) ?? []), action]); });
    return [...byOrigin.entries()]
      .map(([label, items]) => ({ key: label, label, items: sortWithOverdueFirst(items, today) }))
      .sort((a, b) => a.label.localeCompare(b.label, "fr"));
  }
  const week = endOfWeekIso(today);
  const buckets: ActionGroup[] = [
    { key: "late", label: "En retard", items: [] },
    { key: "today", label: "Aujourd’hui", items: [] },
    { key: "week", label: "Cette semaine", items: [] },
    { key: "later", label: "Plus tard", items: [] },
  ];
  actions.forEach((action) => {
    if (isActionOverdue(action, today)) buckets[0].items.push(action);
    else if (action.echeance === today) buckets[1].items.push(action);
    else if (action.echeance > today && action.echeance <= week) buckets[2].items.push(action);
    else buckets[3].items.push(action);
  });
  buckets.forEach((bucket) => { bucket.items = bucket.items.sort((a, b) => a.echeance.localeCompare(b.echeance)); });
  return buckets.filter((bucket) => bucket.items.length > 0);
}
