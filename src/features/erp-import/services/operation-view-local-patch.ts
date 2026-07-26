import { ISSUE_LABELS, priorityScore } from "./operation-quality-scoring.ts";
import type { ErpOperationStatus, OperationView } from "../types/erp-import.ts";

const UNDEFINED_MACHINE = "Non définie";

export interface OperationViewLocalPatch {
  priority?: number;
  machineId?: string | null;
  plannedDate?: string | null;
  status?: ErpOperationStatus;
  comment?: string | null;
}

const LOCALLY_PATCHABLE_KEYS = new Set<keyof OperationViewLocalPatch>(["priority", "machineId", "plannedDate", "status", "comment"]);

/** Vrai si toutes les clés du patch générique sont gérées par `applyOperationPatchLocally` (sinon : replier sur un rechargement complet). */
export function isLocallyPatchable(patch: Record<string, unknown>): boolean {
  return Object.keys(patch).every((key) => LOCALLY_PATCHABLE_KEYS.has(key as keyof OperationViewLocalPatch));
}

/**
 * Applique localement, sans recharger tout le jeu de données, un changement de priorité,
 * machine, date planifiée, statut ou commentaire déjà confirmé par le serveur (le PATCH réel
 * part toujours en arrière-plan ; en cas d'échec, l'appelant restaure la ligne précédente).
 *
 * `delayDays`, `articleWorkOrderCount` et `department` dépendent de l'ensemble du jeu de
 * données (comptage inter-opérations, énumération des machines…) et ne sont donc jamais
 * recalculés ici — mais aucun d'eux ne dépend de la priorité, de la machine, de la date, du
 * statut ou du commentaire, donc les laisser inchangés reste exact.
 *
 * `issues`/`priorityScore` dépendent, eux, directement des champs modifiés : plutôt que de
 * recalculer tous les indicateurs qualité (ce qui exigerait le bon de commande complet, pas
 * toujours disponible côté client sur les listes paginées), seules les trois catégories
 * réellement affectées (machine/date/priorité) sont basculées dans le tableau `issues` déjà
 * reçu du serveur, avec les mêmes libellés (`ISSUE_LABELS`, partagés avec le serveur).
 */
export function applyOperationPatchLocally(row: OperationView, patch: OperationViewLocalPatch): OperationView {
  const machineId = patch.machineId !== undefined ? patch.machineId : row.machineId;
  const plannedDate = patch.plannedDate !== undefined ? patch.plannedDate : row.plannedDate;
  const priority = patch.priority !== undefined ? patch.priority : row.effectivePriority;
  const status = patch.status !== undefined ? patch.status : row.effectiveStatus;

  let issues = row.issues;
  if (patch.machineId !== undefined) issues = toggleIssue(issues, ISSUE_LABELS["missing-machine"], machineId === null);
  if (patch.plannedDate !== undefined) issues = toggleIssue(issues, ISSUE_LABELS["missing-date"], !plannedDate);
  if (patch.priority !== undefined) issues = toggleIssue(issues, ISSUE_LABELS["missing-priority"], priority === 0);
  if (patch.status !== undefined) issues = toggleIssue(issues, ISSUE_LABELS["unknown-status"], status === "unknown");

  const scoreInputsChanged = patch.priority !== undefined || patch.status !== undefined || issues !== row.issues;
  const nextPriorityScore = scoreInputsChanged ? priorityScore(row.delayDays, priority, status, row.subcontracted, issues.length) : row.priorityScore;

  return {
    ...row,
    machineId,
    machine: machineId ?? UNDEFINED_MACHINE,
    isWithoutMachine: machineId === null,
    hasPlannedMachine: patch.machineId !== undefined ? true : row.hasPlannedMachine,
    plannedDate,
    priority,
    effectivePriority: priority,
    userPriority: patch.priority !== undefined ? priority : row.userPriority,
    hasUserPriority: patch.priority !== undefined ? true : row.hasUserPriority,
    status,
    effectiveStatus: status,
    comment: patch.comment !== undefined ? patch.comment : row.comment,
    hasComment: patch.comment !== undefined ? Boolean(patch.comment?.trim()) : row.hasComment,
    hasManualOverride: true,
    issues,
    priorityScore: nextPriorityScore,
  };
}

function toggleIssue(issues: string[], label: string, shouldBePresent: boolean): string[] {
  const isPresent = issues.includes(label);
  if (shouldBePresent === isPresent) return issues;
  return shouldBePresent ? [...issues, label] : issues.filter((entry) => entry !== label);
}
