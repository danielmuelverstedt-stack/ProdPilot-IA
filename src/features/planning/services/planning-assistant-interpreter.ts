import type { OperationView } from "@/features/erp-import/types/erp-import";
import type { MachineSettings } from "@/features/settings/types/settings";

export interface PlanningAssistantProposal {
  kind: "set-priority";
  operationId: string;
  workOrderId: string;
  operationNumber: number;
  priority: number;
}

export interface PlanningAssistantOutcome {
  reply: string;
  proposal: PlanningAssistantProposal | null;
  referencedWorkOrderId?: string;
  /** Plusieurs opérations correspondaient à l'OF visé : mémorisées par l'appelant pour résoudre un « opération 20 » de suivi, sans deviner laquelle était visée. */
  pendingCandidates?: OperationView[];
}

export type PlanningAssistantIntent = "machine-lookup" | "priority-lookup" | "set-priority" | "unknown";

function normalize(text: string): string {
  return text.trim().toLocaleLowerCase("fr");
}

/** "OF-63596", "OF63596", "of 63596", ou une faute de frappe fréquente sans le F ("o63596") — toujours normalisé en "OF-" + chiffres pour la recherche dans le planning ERP importé. */
export function extractWorkOrderId(text: string): string | null {
  const withPrefix = text.match(/\bOF[-\s]?(\d{3,8})\b/i);
  if (withPrefix) return `OF-${withPrefix[1]}`;
  const typo = text.match(/\bo[-\s]?(\d{4,8})\b/i);
  return typo ? `OF-${typo[1]}` : null;
}

export function extractOperationNumber(text: string): number | null {
  const match = text.match(/op[ée]ration\.?\s*(?:n[°o]?\.?\s*)?(\d+)/i) ?? text.match(/^\s*(\d{1,4})\s*$/);
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : null;
}

/** Fenêtre volontairement large entre « priorité » et le nombre (« priorité n2 », « priorité n°2 », « priorité numéro 2 », « priorité 2 ») : sans risque, `interpretPlanningIntent` n'utilise ce nombre que combiné à un verbe de modification explicite. */
export function extractTargetPriority(text: string): number | null {
  const match = text.match(/priorit[ée][^\d]{0,12}(\d{1,3})/i);
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : null;
}

const SET_PRIORITY_VERBS = /\b(passe|passer|mets|mettre|met|change|changer|fixe|fixer)\b/i;

export function isPlanningAssistantRequest(text: string): boolean {
  return extractWorkOrderId(text) !== null || /priorit[ée]|machine/i.test(text);
}

export function interpretPlanningIntent(text: string): PlanningAssistantIntent {
  const normalized = normalize(text);
  const targetPriority = extractTargetPriority(text);
  if (targetPriority !== null && SET_PRIORITY_VERBS.test(normalized)) return "set-priority";
  if (/machine/.test(normalized)) return "machine-lookup";
  if (/priorit[ée]/.test(normalized)) return "priority-lookup";
  return "unknown";
}

function describeOperation(operation: OperationView): string {
  return `Op. ${operation.operationNumber}${operation.description ? ` (${operation.description})` : ""}`;
}

export function buildMachineLookupReply(workOrderId: string, operations: OperationView[]): string {
  if (!operations.length) return `${workOrderId} est introuvable dans le planning ERP importé.`;
  const machines = new Set(operations.map((operation) => operation.machine || "Machine non définie"));
  if (machines.size === 1) return `${workOrderId} est sur la machine ${[...machines][0]}.`;
  return `${workOrderId} a plusieurs opérations, sur des machines différentes :\n${operations.map((operation) => `- ${describeOperation(operation)} → ${operation.machine || "Machine non définie"}`).join("\n")}`;
}

export function buildPriorityLookupReply(workOrderId: string, operations: OperationView[]): string {
  if (!operations.length) return `${workOrderId} est introuvable dans le planning ERP importé.`;
  const priorities = new Set(operations.map((operation) => operation.effectivePriority));
  if (priorities.size === 1) return `${workOrderId} est en priorité ${[...priorities][0]}.`;
  return `${workOrderId} a plusieurs opérations, à des priorités différentes :\n${operations.map((operation) => `- ${describeOperation(operation)} → priorité ${operation.effectivePriority}`).join("\n")}`;
}

/**
 * Ne propose jamais de modification tant que l'opération précise n'est pas identifiée sans
 * ambiguïté (une seule opération pour cet OF, ou un numéro d'opération explicitement désigné) —
 * conforme à la Constitution IA : « L'IA ne doit jamais décider seule d'une priorité engageante ».
 */
export function buildSetPriorityOutcome(workOrderId: string, operations: OperationView[], priority: number, operationNumber: number | null): PlanningAssistantOutcome {
  if (!operations.length) return { reply: `${workOrderId} est introuvable dans le planning ERP importé.`, proposal: null };
  let target = operations[0];
  if (operations.length > 1) {
    if (operationNumber !== null) {
      const match = operations.find((operation) => operation.operationNumber === operationNumber);
      if (!match) {
        return { reply: `Aucune opération n°${operationNumber} trouvée pour ${workOrderId}. Opérations disponibles : ${operations.map((operation) => operation.operationNumber).join(", ")}.`, proposal: null, referencedWorkOrderId: workOrderId, pendingCandidates: operations };
      }
      target = match;
    } else {
      return {
        reply: `${workOrderId} a plusieurs opérations. Laquelle souhaitez-vous mettre en priorité ${priority} ? Précisez le numéro d'opération.\n${operations.map((operation) => `- ${describeOperation(operation)} · machine ${operation.machine || "non définie"} · priorité actuelle ${operation.effectivePriority}`).join("\n")}`,
        proposal: null,
        referencedWorkOrderId: workOrderId,
        pendingCandidates: operations,
      };
    }
  }
  return {
    reply: `Je vais mettre ${describeOperation(target)} de ${workOrderId} (machine ${target.machine || "non définie"}) en priorité ${priority}, actuellement ${target.effectivePriority}. Confirmez-vous ?`,
    proposal: { kind: "set-priority", operationId: target.id, workOrderId, operationNumber: target.operationNumber, priority },
    referencedWorkOrderId: workOrderId,
  };
}

export interface MachineOfListQuery {
  machineText: string;
  limit: number;
}

export interface MachineResolution {
  machine: MachineSettings | null;
  candidates: MachineSettings[];
}

function normalizeMachineToken(value: string): string {
  return value.trim().toLocaleLowerCase("fr").replace(/[\s-]+/g, "");
}

/**
 * Ne devine jamais entre deux machines proches : un identifiant/nom qui correspond à une seule
 * machine la renvoie directement, plusieurs correspondances renvoient la liste à préciser (même
 * principe que la désambiguïsation d'opération de `buildSetPriorityOutcome`).
 */
export function resolveMachineQuery(machineText: string, machines: MachineSettings[]): MachineResolution {
  const usable = machines.filter((machine) => !machine.deleted);
  const normalizedQuery = normalizeMachineToken(machineText);
  const idMatches = usable.filter((machine) => normalizeMachineToken(machine.id) === normalizedQuery);
  if (idMatches.length === 1) return { machine: idMatches[0], candidates: [] };
  const loose = machineText.trim().toLocaleLowerCase("fr");
  const nameMatches = usable.filter((machine) =>
    machine.displayName.toLocaleLowerCase("fr").includes(loose)
    || machine.name.toLocaleLowerCase("fr").includes(loose)
    || normalizeMachineToken(machine.id).includes(normalizedQuery));
  if (nameMatches.length === 1) return { machine: nameMatches[0], candidates: [] };
  if (nameMatches.length > 1) return { machine: null, candidates: nameMatches };
  if (idMatches.length > 1) return { machine: null, candidates: idMatches };
  return { machine: null, candidates: [] };
}

/** Ancré sur la fin de phrase pour capturer le dernier « sur »/« de » (« les 5 OF en priorité sur la VTC-200 »), jamais un « de » antérieur non lié à la machine. */
const MACHINE_TEXT_PATTERN = /.*\b(?:sur|de)\s+(?:la\s+|le\s+|l['’]\s*)?(?:machine\s+)?([A-Za-zÀ-ÿ0-9][A-Za-zÀ-ÿ0-9 _-]*?)\s*[?!.]*$/i;

export function isMachineOfListRequest(text: string): boolean {
  if (extractWorkOrderId(text)) return false;
  return /\bOFs?\b/i.test(text) && MACHINE_TEXT_PATTERN.test(text);
}

export function extractMachineQuery(text: string): MachineOfListQuery | null {
  const match = text.match(MACHINE_TEXT_PATTERN);
  if (!match) return null;
  const machineText = match[1].trim();
  if (!machineText) return null;
  const countMatch = text.match(/\b(\d{1,3})\s*OFs?\b/i);
  const limit = countMatch ? Math.min(Math.max(Number(countMatch[1]), 1), 50) : 5;
  return { machineText, limit };
}

export function buildMachineOfListReply(machineLabel: string, operations: OperationView[], limit: number): string {
  if (!operations.length) return `Aucun OF planifié trouvé sur ${machineLabel}.`;
  const shown = operations.slice(0, limit);
  const lines = shown.map((operation) => `- ${operation.workOrderId} · Op. ${operation.operationNumber}${operation.description ? ` (${operation.description})` : ""} · priorité ${operation.effectivePriority}`);
  const suffix = operations.length > shown.length ? `\n… et ${operations.length - shown.length} autre(s) OF sur cette machine.` : "";
  return `${shown.length} OF sur ${machineLabel}, du plus prioritaire :\n${lines.join("\n")}${suffix}`;
}

export function buildMachineNotFoundReply(machineText: string): string {
  return `Aucune machine ne correspond à « ${machineText} ».`;
}

export function buildMachineAmbiguousReply(machineText: string, candidates: MachineSettings[]): string {
  return `Plusieurs machines correspondent à « ${machineText} » : ${candidates.map((machine) => machine.displayName).join(", ")}. Précisez laquelle.`;
}
