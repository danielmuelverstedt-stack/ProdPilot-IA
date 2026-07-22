import { updateDemoData } from "@/features/demo/services/demo-repository";
import type { ActionContextLink, ProductionAction } from "@/features/demo/types/demo";

export interface NewActionInput {
  description: string;
  responsable: string;
  echeance: string;
  origine: string;
  introduitPar: string;
  remarque?: string | null;
  contextLink?: ActionContextLink | null;
}

function nextActionId(existing: ProductionAction[]): string {
  const highest = existing.reduce((max, item) => {
    const match = /^ACT-(\d+)$/.exec(item.id);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);
  return `ACT-${String(highest + 1).padStart(3, "0")}`;
}

export function createAction(input: NewActionInput): string {
  let id = "";
  updateDemoData((draft) => {
    id = nextActionId(draft.actions);
    const action: ProductionAction = {
      id,
      dateEncodage: new Date().toISOString().slice(0, 10),
      introduitPar: input.introduitPar,
      origine: input.origine,
      contextLink: input.contextLink ?? null,
      description: input.description.trim(),
      responsable: input.responsable.trim(),
      echeance: input.echeance,
      statut: "À faire",
      dateCloture: null,
      remarque: input.remarque?.trim() || null,
    };
    draft.actions.unshift(action);
  });
  return id;
}

export function completeAction(id: string): void {
  updateDemoData((draft) => {
    const target = draft.actions.find((item) => item.id === id);
    if (!target) return;
    target.statut = "Fait";
    target.dateCloture = new Date().toISOString();
  });
}

export function postponeAction(id: string, newEcheance: string): void {
  updateDemoData((draft) => {
    const target = draft.actions.find((item) => item.id === id);
    if (!target) return;
    target.statut = "Reporté";
    target.echeance = newEcheance;
    target.dateCloture = null;
  });
}

export function reassignAction(id: string, responsable: string): void {
  updateDemoData((draft) => {
    const target = draft.actions.find((item) => item.id === id);
    if (target) target.responsable = responsable;
  });
}

export function setRemark(id: string, remarque: string): void {
  updateDemoData((draft) => {
    const target = draft.actions.find((item) => item.id === id);
    if (target) target.remarque = remarque.trim() || null;
  });
}

export function reopenAction(id: string): void {
  updateDemoData((draft) => {
    const target = draft.actions.find((item) => item.id === id);
    if (!target) return;
    target.statut = "À faire";
    target.dateCloture = null;
  });
}

export function deleteAction(id: string): void {
  updateDemoData((draft) => { draft.actions = draft.actions.filter((item) => item.id !== id); });
}
