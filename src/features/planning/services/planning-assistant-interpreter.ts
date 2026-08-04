import type { OperationView } from "@/features/erp-import/types/erp-import";

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
