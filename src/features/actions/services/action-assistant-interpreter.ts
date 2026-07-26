import { formatEuropeanDate } from "@/components/ui/ModuleUi";
import { groupActions } from "@/features/actions/services/action-grouping";
import { isActionOverdue } from "@/features/actions/services/action-status";
import type { ProductionAction } from "@/features/demo/types/demo";

export interface ActionAssistantProposal {
  kind: "complete" | "postpone" | "reassign" | "remark" | "create";
  actionId?: string;
  description?: string;
  responsable?: string;
  echeance?: string;
  remarque?: string;
  origine?: string;
}

export interface ActionAssistantOutcome {
  reply: string;
  proposal: ActionAssistantProposal | null;
  referencedActionId?: string;
}

const WEEKDAYS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];

function normalize(text: string): string {
  return text.trim().toLocaleLowerCase("fr");
}

function addDays(iso: string, days: number): string {
  const date = new Date(`${iso}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function parseRelativeFrenchDate(text: string, today = new Date().toISOString().slice(0, 10)): string | null {
  const normalized = normalize(text);
  const explicit = normalized.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?/);
  if (explicit) {
    const day = explicit[1].padStart(2, "0");
    const month = explicit[2].padStart(2, "0");
    const year = explicit[3] ?? today.slice(0, 4);
    return `${year}-${month}-${day}`;
  }
  if (/aujourd.?hui/.test(normalized)) return today;
  if (/demain/.test(normalized)) return addDays(today, 1);
  const weekday = WEEKDAYS.findIndex((name) => normalized.includes(name));
  if (weekday >= 0) {
    const current = new Date(`${today}T00:00:00`).getDay();
    let delta = weekday - current;
    if (delta <= 0) delta += 7;
    return addDays(today, delta);
  }
  return null;
}

function findExplicitActionId(text: string): string | null {
  const match = text.match(/ACT-\d+/i);
  return match ? match[0].toUpperCase() : null;
}

function formatActionLine(action: ProductionAction, today: string): string {
  const flag = isActionOverdue(action, today) ? " (en retard)" : "";
  return `${action.id} · ${action.description} · échéance ${formatEuropeanDate(action.echeance)}${flag}`;
}

/** Les idées « À planifier » n'ont pas encore de responsable/échéance réels : hors périmètre de la revue tant qu'elles n'ont pas été planifiées (voir l'onglet dédié d'Actions). */
export function buildReviewReply(actions: ProductionAction[], today = new Date().toISOString().slice(0, 10)): string {
  const open = actions.filter((item) => item.statut !== "Fait" && item.statut !== "À planifier");
  if (!open.length) return "Aucune action ouverte à revoir. Tout est à jour.";
  const groups = groupActions(open, "personne", today);
  return groups.map((group) => `${group.label} :\n${group.items.map((item) => `- ${formatActionLine(item, today)}`).join("\n")}`).join("\n\n");
}

export function buildPersonReply(actions: ProductionAction[], query: string, today = new Date().toISOString().slice(0, 10)): string {
  const needle = normalize(query);
  const matches = actions.filter((item) => item.statut !== "Fait" && item.statut !== "À planifier" && normalize(item.responsable).includes(needle));
  if (!matches.length) return `Aucune action ouverte pour « ${query.trim()} ».`;
  return matches.map((item) => `- ${formatActionLine(item, today)}`).join("\n");
}

export function buildOverdueReply(actions: ProductionAction[], today = new Date().toISOString().slice(0, 10)): string {
  const overdue = actions.filter((item) => isActionOverdue(item, today));
  if (!overdue.length) return "Aucune action n’est en retard.";
  return overdue.map((item) => `- ${formatActionLine(item, today)} · ${item.responsable}`).join("\n");
}

/** Interprète une commande en langage naturel sur le registre d'actions, entièrement en local (aucun appel IA payant). */
export function interpretActionAssistantMessage(rawText: string, actions: ProductionAction[], lastActionId: string | null, today = new Date().toISOString().slice(0, 10)): ActionAssistantOutcome {
  const text = rawText.trim();
  const normalized = normalize(text);
  const explicitId = findExplicitActionId(text);
  const targetId = explicitId ?? lastActionId ?? undefined;
  const target = targetId ? actions.find((item) => item.id === targetId) : undefined;

  if (/revue des actions|^revue$/.test(normalized)) return { reply: buildReviewReply(actions, today), proposal: null };
  if (/en retard/.test(normalized)) return { reply: buildOverdueReply(actions, today), proposal: null };
  const personMatch = normalized.match(/actions? de ([a-zàâäéèêëîïôöùûüç\s-]+)/);
  if (personMatch) return { reply: buildPersonReply(actions, personMatch[1], today), proposal: null };

  const createMatch = text.match(/cr[ée]e?\s+une\s+action\s+pour\s+(.+?)\s*:\s*(.+)/i);
  if (createMatch) {
    const responsable = createMatch[1].trim();
    const description = createMatch[2].trim();
    return { reply: `Je vais créer une action pour ${responsable} : « ${description} », échéance ${formatEuropeanDate(addDays(today, 7))}. Confirmez-vous ?`, proposal: { kind: "create", responsable, description, echeance: addDays(today, 7), origine: "IA" } };
  }

  if (/^fait\.?$/.test(normalized) || (explicitId !== null && /fait/.test(normalized))) {
    if (!target) return { reply: "Quelle action souhaitez-vous marquer comme faite ? Précisez son identifiant (ex. ACT-003) ou demandez d’abord une revue.", proposal: null };
    return { reply: `Je vais marquer ${target.id} (${target.description}) comme Fait. Confirmez-vous ?`, proposal: { kind: "complete", actionId: target.id }, referencedActionId: target.id };
  }

  if (/report/.test(normalized)) {
    if (!target) return { reply: "Quelle action souhaitez-vous reporter ? Précisez son identifiant (ex. ACT-003) ou demandez d’abord une revue.", proposal: null };
    const date = parseRelativeFrenchDate(text, today);
    if (!date) return { reply: `À quelle date souhaitez-vous reporter ${target.id} ?`, proposal: null, referencedActionId: target.id };
    return { reply: `Je vais reporter ${target.id} au ${formatEuropeanDate(date)}. Confirmez-vous ?`, proposal: { kind: "postpone", actionId: target.id, echeance: date }, referencedActionId: target.id };
  }

  const reassignMatch = text.match(/passe-?\s*(?:la|le)?\s*à\s+(.+)/i) ?? text.match(/r[ée]assigne(?:-la)?\s+à\s+(.+)/i);
  if (reassignMatch) {
    if (!target) return { reply: "Quelle action souhaitez-vous réassigner ? Précisez son identifiant (ex. ACT-003) ou demandez d’abord une revue.", proposal: null };
    const responsable = reassignMatch[1].trim();
    return { reply: `Je vais réassigner ${target.id} à ${responsable}. Confirmez-vous ?`, proposal: { kind: "reassign", actionId: target.id, responsable }, referencedActionId: target.id };
  }

  const remarkMatch = text.match(/ajoute(?:z)?\s+en\s+remarque\s*:\s*(.+)/i);
  if (remarkMatch) {
    if (!target) return { reply: "Quelle action souhaitez-vous compléter ? Précisez son identifiant (ex. ACT-003) ou demandez d’abord une revue.", proposal: null };
    const remarque = remarkMatch[1].trim();
    return { reply: `Je vais ajouter la remarque « ${remarque} » sur ${target.id}. Confirmez-vous ?`, proposal: { kind: "remark", actionId: target.id, remarque }, referencedActionId: target.id };
  }

  return { reply: "Je peux dérouler une revue des actions, lister les actions d’une personne, signaler les retards, créer une action ou mettre à jour une action déjà référencée (fait, reporte, réassigne, remarque). Que souhaitez-vous faire ?", proposal: null };
}

export function isConfirmation(text: string): boolean { return /^(oui|confirme|confirmé|ok|d.accord|vas-?y)[.!\s]*$/i.test(text.trim()); }
export function isCancellation(text: string): boolean { return /^(non|annule|stop|laisse tomber)[.!\s]*$/i.test(text.trim()); }
