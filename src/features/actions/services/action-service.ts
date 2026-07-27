import { updateDemoData } from "@/features/demo/services/demo-repository";
import type { ActionContextLink, ActionStatus, ProductionAction } from "@/features/demo/types/demo";

export interface NewActionInput {
  description: string;
  responsable: string;
  echeance: string;
  origine: string;
  introduitPar: string;
  remarque?: string | null;
  contextLink?: ActionContextLink | null;
  /** "À planifier" pour une idée mise de côté sans responsable/échéance réels ; par défaut "À faire" comme avant. */
  statut?: ActionStatus;
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
      statut: input.statut ?? "À faire",
      dateCloture: null,
      remarque: input.remarque?.trim() || null,
    };
    draft.actions.unshift(action);
  });
  return id;
}

/**
 * Retournent `true` si `id` correspondait à une action réelle (et a donc été modifiée), `false`
 * sinon — même convention que `machineSettingsService` (ex. `setActive`) pour une opération
 * « trouver puis muter par id » sans validation métier à relayer. Utile en particulier à
 * l'assistant IA (`AssistantPanel.tsx`), qui ne doit pas annoncer un succès si l'id qu'il a
 * interprété ne correspond plus à une action existante.
 */
export function completeAction(id: string): boolean {
  let found = false;
  updateDemoData((draft) => {
    const target = draft.actions.find((item) => item.id === id);
    if (!target) return;
    found = true;
    target.statut = "Fait";
    target.dateCloture = new Date().toISOString();
  });
  return found;
}

export function postponeAction(id: string, newEcheance: string): boolean {
  let found = false;
  updateDemoData((draft) => {
    const target = draft.actions.find((item) => item.id === id);
    if (!target) return;
    found = true;
    target.statut = "Reporté";
    target.echeance = newEcheance;
    target.dateCloture = null;
  });
  return found;
}

/** Valide une idée « À planifier » en action réelle : lui donne un responsable et une échéance, puis la fait rejoindre "À faire" comme n'importe quelle action. */
export function planAction(id: string, responsable: string, echeance: string): boolean {
  let found = false;
  updateDemoData((draft) => {
    const target = draft.actions.find((item) => item.id === id);
    if (!target) return;
    found = true;
    target.statut = "À faire";
    target.responsable = responsable.trim();
    target.echeance = echeance;
  });
  return found;
}

export function reassignAction(id: string, responsable: string): boolean {
  let found = false;
  updateDemoData((draft) => {
    const target = draft.actions.find((item) => item.id === id);
    if (target) { found = true; target.responsable = responsable; }
  });
  return found;
}

export function setRemark(id: string, remarque: string): boolean {
  let found = false;
  updateDemoData((draft) => {
    const target = draft.actions.find((item) => item.id === id);
    if (target) { found = true; target.remarque = remarque.trim() || null; }
  });
  return found;
}

export function reopenAction(id: string): boolean {
  let found = false;
  updateDemoData((draft) => {
    const target = draft.actions.find((item) => item.id === id);
    if (!target) return;
    found = true;
    target.statut = "À faire";
    target.dateCloture = null;
  });
  return found;
}

export function deleteAction(id: string): boolean {
  let found = false;
  updateDemoData((draft) => {
    found = draft.actions.some((item) => item.id === id);
    draft.actions = draft.actions.filter((item) => item.id !== id);
  });
  return found;
}
