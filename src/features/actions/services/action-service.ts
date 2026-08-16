import { updateDemoData } from "@/features/demo/services/demo-repository";
import type { ActionContextLink, ActionStatus, HistoryEntry, ProductionAction } from "@/features/demo/types/demo";

export interface NewActionInput {
  description: string;
  responsable: string;
  echeance: string;
  origine: string;
  introduitPar: string;
  remarque?: string | null;
  /** Une seule référence à la création (comme avant) ; d'autres peuvent être ajoutées ensuite via `addActionContextLink` (ex. depuis le panneau rapide de réunion). */
  contextLinks?: ActionContextLink[];
  /** "À planifier" pour une idée mise de côté sans responsable/échéance réels ; par défaut "À faire" comme avant. */
  statut?: ActionStatus;
  /** Action parente si celle-ci est une sous-action créée depuis la fiche d'une autre action ; `null`/absent pour une action de premier niveau. */
  parentActionId?: string | null;
  /** Type de besoin (bouton de besoin de l'étape « Cinq projets critiques » d'une réunion Production) ; `null`/absent pour toute autre action. */
  besoinType?: string | null;
}

const DEFAULT_HISTORY_AUTHOR = "Utilisateur";

function nextActionId(existing: ProductionAction[]): string {
  const highest = existing.reduce((max, item) => {
    const match = /^ACT-(\d+)$/.exec(item.id);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);
  return `ACT-${String(highest + 1).padStart(3, "0")}`;
}

/** Pousse une entrée d'historique sur une action déjà trouvée dans le brouillon — jamais appelée seule, toujours à la suite de la mutation qu'elle documente. */
function pushHistory(target: ProductionAction, author: string | undefined, description: string): void {
  const entry: HistoryEntry = { id: `${target.id}-h${target.history.length + 1}`, date: new Date().toISOString(), author: author ?? DEFAULT_HISTORY_AUTHOR, description };
  target.history.push(entry);
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
      contextLinks: input.contextLinks ?? [],
      description: input.description.trim(),
      responsable: input.responsable.trim(),
      responsableContactId: null,
      echeance: input.echeance,
      statut: input.statut ?? "À faire",
      dateCloture: null,
      remarque: input.remarque?.trim() || null,
      comments: [],
      history: [],
      besoinType: input.besoinType ?? null,
      priority: null,
      responsableId: null,
      estimatedHours: null,
      plannedWeek: null,
      planningOrder: null,
      parentActionId: input.parentActionId ?? null,
    };
    draft.actions.unshift(action);
  });
  return id;
}

/** Crée plusieurs sous-actions en une seule mutation du registre Actions. */
export function createSubActions(parentActionId: string, inputs: Array<Omit<NewActionInput, "parentActionId">>): string[] {
  const ids: string[] = [];
  updateDemoData((draft) => {
    for (const input of inputs) {
      if (!input.description.trim() || !input.responsable.trim() || !input.echeance) continue;
      const id = nextActionId(draft.actions);
      ids.push(id);
      draft.actions.unshift({
        id, dateEncodage: new Date().toISOString().slice(0, 10), introduitPar: input.introduitPar, origine: input.origine,
        contextLinks: input.contextLinks ?? [], description: input.description.trim(), responsable: input.responsable.trim(), responsableContactId: null,
        echeance: input.echeance, statut: input.statut ?? "À faire", dateCloture: null, remarque: input.remarque?.trim() || null,
        comments: [], history: [], besoinType: input.besoinType ?? null, priority: null, responsableId: null, estimatedHours: null,
        plannedWeek: null, planningOrder: null, parentActionId,
      });
    }
  });
  return ids;
}

/**
 * Retournent `true` si `id` correspondait à une action réelle (et a donc été modifiée), `false`
 * sinon — même convention que `machineSettingsService` (ex. `setActive`) pour une opération
 * « trouver puis muter par id » sans validation métier à relayer. Utile en particulier à
 * l'assistant IA (`AssistantPanel.tsx`), qui ne doit pas annoncer un succès si l'id qu'il a
 * interprété ne correspond plus à une action existante.
 */
export function completeAction(id: string, author?: string): boolean {
  let found = false;
  updateDemoData((draft) => {
    const target = draft.actions.find((item) => item.id === id);
    if (!target) return;
    found = true;
    target.statut = "Fait";
    target.dateCloture = new Date().toISOString();
    pushHistory(target, author, "Action clôturée.");
  });
  return found;
}

export function postponeAction(id: string, newEcheance: string, author?: string): boolean {
  let found = false;
  updateDemoData((draft) => {
    const target = draft.actions.find((item) => item.id === id);
    if (!target) return;
    found = true;
    target.statut = "Reporté";
    target.echeance = newEcheance;
    target.dateCloture = null;
    pushHistory(target, author, `Échéance reportée au ${newEcheance}.`);
  });
  return found;
}

/** Valide une idée « À planifier » en action réelle : lui donne un responsable et une échéance, puis la fait rejoindre "À faire" comme n'importe quelle action. */
export function planAction(id: string, responsable: string, echeance: string, author?: string): boolean {
  let found = false;
  updateDemoData((draft) => {
    const target = draft.actions.find((item) => item.id === id);
    if (!target) return;
    found = true;
    target.statut = "À faire";
    target.responsable = responsable.trim();
    target.echeance = echeance;
    pushHistory(target, author, `Planifiée : responsable ${responsable.trim()}, échéance ${echeance}.`);
  });
  return found;
}

export function reassignAction(id: string, responsable: string, author?: string): boolean {
  let found = false;
  updateDemoData((draft) => {
    const target = draft.actions.find((item) => item.id === id);
    if (!target) return;
    found = true;
    target.responsable = responsable;
    target.responsableContactId = null;
    pushHistory(target, author, `Responsable changé : ${responsable}.`);
  });
  return found;
}

/** Réassigne vers un contact du module Contacts — `responsable` (texte affiché partout ailleurs dans l'app) est synchronisé avec le nom du contact, jamais dupliqué autrement que ce nom. */
export function reassignActionToContact(id: string, contactId: string, displayName: string, author?: string): boolean {
  let found = false;
  updateDemoData((draft) => {
    const target = draft.actions.find((item) => item.id === id);
    if (!target) return;
    found = true;
    target.responsable = displayName;
    target.responsableContactId = contactId;
    pushHistory(target, author, `Responsable changé : ${displayName}.`);
  });
  return found;
}

/** Change uniquement l'échéance, sans toucher au statut — distinct de `postponeAction`, qui force le statut à « Reporté » ; sert à corriger une date sans rouvrir/reporter l'action. */
export function updateActionEcheance(id: string, echeance: string, author?: string): boolean {
  let found = false;
  updateDemoData((draft) => {
    const target = draft.actions.find((item) => item.id === id);
    if (!target) return;
    found = true;
    target.echeance = echeance;
    pushHistory(target, author, `Échéance modifiée au ${echeance}.`);
  });
  return found;
}

/** Édition groupée des champs descriptifs — source unique pour la fiche action (`ActionDetail.tsx`) comme pour tout futur appelant, plutôt qu'une mutation `updateDemoData` inline propre à un seul écran. */
export function updateActionDetails(id: string, patch: { description?: string; responsable?: string; origine?: string; remarque?: string | null }, author?: string): boolean {
  let found = false;
  updateDemoData((draft) => {
    const target = draft.actions.find((item) => item.id === id);
    if (!target) return;
    found = true;
    if (patch.description !== undefined) target.description = patch.description.trim();
    if (patch.responsable !== undefined) { target.responsable = patch.responsable.trim(); target.responsableContactId = null; }
    if (patch.origine !== undefined) target.origine = patch.origine;
    if (patch.remarque !== undefined) target.remarque = patch.remarque?.trim() || null;
    pushHistory(target, author, "Informations modifiées.");
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

export function reopenAction(id: string, author?: string): boolean {
  let found = false;
  updateDemoData((draft) => {
    const target = draft.actions.find((item) => item.id === id);
    if (!target) return;
    found = true;
    target.statut = "À faire";
    target.dateCloture = null;
    pushHistory(target, author, "Action rouverte.");
  });
  return found;
}

/** Pousse un commentaire (auteur + date + texte) et l'entrée d'historique correspondante, en une seule mutation. */
export function addActionComment(id: string, author: string, text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  let found = false;
  updateDemoData((draft) => {
    const target = draft.actions.find((item) => item.id === id);
    if (!target) return;
    found = true;
    target.comments.push({ id: `${target.id}-c${target.comments.length + 1}`, author, date: new Date().toISOString(), text: trimmed });
    pushHistory(target, author, "Commentaire ajouté.");
  });
  return found;
}

/** Ajoute un lien vers un autre module s'il n'existe pas déjà (déduplication par module+id) — jamais de copie de l'action, seulement une référence de plus. */
export function addActionContextLink(id: string, link: ActionContextLink, author?: string): boolean {
  let found = false;
  updateDemoData((draft) => {
    const target = draft.actions.find((item) => item.id === id);
    if (!target) return;
    found = true;
    if (!target.contextLinks.some((item) => item.module === link.module && item.id === link.id)) {
      target.contextLinks.push(link);
      pushHistory(target, author, `Lien ajouté : ${link.label}.`);
    }
  });
  return found;
}

export function removeActionContextLink(id: string, module: ActionContextLink["module"], linkId: string, author?: string): boolean {
  let found = false;
  updateDemoData((draft) => {
    const target = draft.actions.find((item) => item.id === id);
    if (!target) return;
    found = true;
    const removed = target.contextLinks.find((item) => item.module === module && item.id === linkId);
    target.contextLinks = target.contextLinks.filter((item) => !(item.module === module && item.id === linkId));
    if (removed) pushHistory(target, author, `Lien retiré : ${removed.label}.`);
  });
  return found;
}

/** Supprime aussi les sous-actions de `id` : une sous-action n'a pas de sens sans son action parente. */
export function deleteAction(id: string): boolean {
  let found = false;
  updateDemoData((draft) => {
    found = draft.actions.some((item) => item.id === id);
    draft.actions = draft.actions.filter((item) => item.id !== id && item.parentActionId !== id);
  });
  return found;
}
