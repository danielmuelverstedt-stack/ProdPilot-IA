import "server-only";

import { randomUUID } from "node:crypto";
import { getActiveMailContext } from "@/features/mail/services/mail-account-context";
import { invalidateMailMessageCache } from "@/features/mail/services/mail-message-cache";
import { mailActivityRepository } from "@/features/mail-management/server/mail-activity-repository";
import {
  MAIL_WORKFLOW_LABELS,
  type MailActivityEntry,
  type MailManagementAction,
  type MailManagementResult,
  type MailMutationSnapshot,
  type MailProviderLabel,
} from "@/features/mail-management/types/mail-management";
import type { MailMessage } from "@/features/mail/types/mail";
import { buildMailLabelMutation, getMailWorkflowView } from "@/features/mail-management/services/mail-workflow";

export interface ExecuteMailManagementInput {
  action: MailManagementAction;
  messageIds: string[];
  target: "message" | "thread";
  confirmed: boolean;
  source?: "user" | "ai";
  automatic?: boolean;
  reason?: string;
  aiConfidence?: number;
}

export async function getMailManagementPermission() {
  const { account, provider } = await getActiveMailContext();
  const permission = await provider.getManagementPermission();
  return { accountId: account.id, ...permission };
}

export async function getMailManagementOverview() {
  const { account, provider } = await getActiveMailContext();
  const permission = await provider.getManagementPermission();
  const labels = permission.canModifyMail ? await provider.listLabels() : [];
  const activity = await mailActivityRepository.list(account.id);
  return { permission: { accountId: account.id, ...permission }, labels, activity };
}

export async function ensureProdPilotLabels(): Promise<MailProviderLabel[]> {
  const { provider } = await getActiveMailContext();
  await assertModifyPermission(provider);
  return provider.ensureLabels(Object.values(MAIL_WORKFLOW_LABELS));
}

export async function executeMailManagementAction(input: ExecuteMailManagementInput): Promise<MailManagementResult> {
  validateActionInput(input);
  const { account, provider } = await getActiveMailContext();
  await assertModifyPermission(provider);
  const selected = await getSelectedMessages(provider, input.messageIds);
  const targetMessages = input.target === "thread"
    ? await getValidatedThreadMessages(provider, selected)
    : selected;
  const labels = await provider.ensureLabels(Object.values(MAIL_WORKFLOW_LABELS));
  const mutation = buildMailLabelMutation(input.action, labels, input.source ?? "user");
  const snapshotsBefore = targetMessages.map(toSnapshot);
  let changed: MailMessage[];
  try {
    changed = await provider.modifyLabels({
      messageIds: targetMessages.map((message) => message.id),
      threadId: input.target === "thread" ? targetMessages[0].threadId : undefined,
      target: input.target,
      ...mutation,
    });
    assertProviderConfirmation(changed, targetMessages, mutation.addLabelIds, mutation.removeLabelIds);
  } catch (error) {
    const rollbackError = await restoreSnapshots(provider, snapshotsBefore).then(() => null, (current) => current);
    await mailActivityRepository.add(createFailedActivityEntry({ accountId: account.id, provider: account.provider, input, labels, selected: targetMessages, snapshotsBefore, mutation, rollbackError })).catch(() => undefined);
    if (rollbackError) throw new Error("Gmail n’a pas confirmé l’action et la restauration automatique est incomplète. Vérifiez les libellés dans Gmail avant de réessayer.");
    throw error;
  }
  const entry = createActivityEntry({ accountId: account.id, provider: account.provider, input, labels, selected: targetMessages, changed, snapshotsBefore, mutation });
  await mailActivityRepository.add(entry);
  invalidateMailMessageCache(account.id);
  return {
    activityId: entry.id,
    action: input.action,
    messages: changed,
    canUndo: true,
    notice: buildNotice(input.action, changed.length, targetMessages[0].subject, input.source ?? "user", input.reason),
  };
}

export async function undoMailManagementAction(activityId: string): Promise<MailManagementResult> {
  if (!/^[-a-zA-Z0-9]{1,100}$/.test(activityId)) throw new Error("L’identifiant de l’action à annuler est invalide.");
  const { account, provider } = await getActiveMailContext();
  await assertModifyPermission(provider);
  const activity = await mailActivityRepository.get(activityId, account.id);
  if (!activity || !activity.canUndo || activity.gmailResult !== "confirmed") {
    throw new Error("Cette action Mail ne peut plus être annulée.");
  }
  const beforeUndo = await Promise.all(activity.snapshotsBefore.map(async ({ messageId }) => {
    const current = await provider.getMessage(messageId);
    if (!current) throw new Error("Un message à restaurer n’existe plus dans le compte Gmail actif.");
    return toSnapshot(current);
  }));
  let restored: MailMessage[];
  try {
    restored = await restoreSnapshots(provider, activity.snapshotsBefore);
  } catch (error) {
    const rollbackError = await restoreSnapshots(provider, beforeUndo).then(() => null, (current) => current);
    if (rollbackError) throw new Error("L’annulation a échoué et sa compensation est incomplète. Vérifiez les libellés dans Gmail.");
    throw error;
  }
  await mailActivityRepository.markUndone(activity.id, account.id, new Date().toISOString());
  invalidateMailMessageCache(account.id);
  return { activityId: activity.id, action: activity.action, messages: restored, canUndo: false, notice: `L’action sur « ${activity.subject} » a été annulée dans Gmail.` };
}

export async function listMailActivity(): Promise<MailActivityEntry[]> {
  const { account } = await getActiveMailContext();
  return mailActivityRepository.list(account.id);
}

async function assertModifyPermission(provider: Awaited<ReturnType<typeof getActiveMailContext>>["provider"]): Promise<void> {
  const permission = await provider.getManagementPermission();
  if (!permission.canModifyMail) throw new Error("Une nouvelle autorisation Google est nécessaire pour classer et archiver les mails.");
}

async function getSelectedMessages(provider: Awaited<ReturnType<typeof getActiveMailContext>>["provider"], messageIds: string[]) {
  const messages = await Promise.all([...new Set(messageIds)].map((id) => provider.getMessage(id)));
  if (messages.some((message) => message === null)) throw new Error("Un message sélectionné n’existe pas dans le compte Gmail actif.");
  return messages.filter((message): message is MailMessage => message !== null);
}

async function getValidatedThreadMessages(provider: Awaited<ReturnType<typeof getActiveMailContext>>["provider"], selected: MailMessage[]) {
  const threadId = selected[0].threadId;
  if (selected.some((message) => message.threadId !== threadId)) throw new Error("Une action de conversation doit cibler un seul fil Gmail.");
  const thread = await provider.getThread(threadId);
  if (!thread?.messages.length) throw new Error("Le fil Gmail sélectionné est introuvable.");
  return thread.messages;
}

function validateActionInput(input: ExecuteMailManagementInput): void {
  const actions: MailManagementAction[] = ["to_process", "waiting", "processed", "archive", "restore", "mark_read", "mark_unread"];
  if (!actions.includes(input.action) || !["message", "thread"].includes(input.target)) throw new Error("L’action Mail demandée est invalide.");
  if (!input.confirmed) throw new Error("Cette action Gmail nécessite une confirmation explicite.");
  if (!Array.isArray(input.messageIds) || input.messageIds.length < 1 || input.messageIds.length > 1000 || input.messageIds.some((id) => !/^[A-Za-z0-9_-]{1,200}$/.test(id))) {
    throw new Error("La sélection de messages Gmail est invalide.");
  }
  if (input.automatic) throw new Error("Les mutations Gmail automatiques sans confirmation précise sont désactivées par les règles produit.");
  if (input.aiConfidence !== undefined && (input.aiConfidence < 0 || input.aiConfidence > 1)) throw new Error("La confiance IA est invalide.");
}

function assertProviderConfirmation(changed: MailMessage[], expected: MailMessage[], added: string[], removed: string[]): void {
  if (changed.length !== expected.length) throw new Error("Gmail n’a pas confirmé tous les messages modifiés.");
  for (const message of changed) {
    const labels = message.labels ?? [];
    if (added.some((label) => !labels.includes(label)) || removed.some((label) => labels.includes(label))) {
      throw new Error("L’état Gmail reçu après modification ne correspond pas à l’action demandée.");
    }
  }
}

function createActivityEntry(args: {
  accountId: string;
  provider: string;
  input: ExecuteMailManagementInput;
  labels: MailProviderLabel[];
  selected: MailMessage[];
  changed: MailMessage[];
  snapshotsBefore: MailMutationSnapshot[];
  mutation: { addLabelIds: string[]; removeLabelIds: string[] };
}): MailActivityEntry {
  const labelNames = new Map(args.labels.map((label) => [label.id, label.name]));
  return {
    id: `mail-activity-${randomUUID()}`,
    accountId: args.accountId,
    provider: args.provider,
    target: args.input.target,
    messageIds: args.selected.map((message) => message.id),
    threadId: args.input.target === "thread" ? args.selected[0].threadId : null,
    subject: args.selected[0].subject,
    action: args.input.action,
    source: args.input.source ?? "user",
    automatic: args.input.automatic ?? false,
    previousClassification: getMailWorkflowView(args.selected[0], args.labels),
    nextClassification: getMailWorkflowView(args.changed[0], args.labels),
    labelsAdded: args.mutation.addLabelIds.map((id) => labelNames.get(id) ?? id),
    labelsRemoved: args.mutation.removeLabelIds.map((id) => labelNames.get(id) ?? id),
    snapshotsBefore: args.snapshotsBefore,
    snapshotsAfter: args.changed.map(toSnapshot),
    aiConfidence: args.input.aiConfidence ?? null,
    reason: (args.input.reason ?? "Action confirmée par l’utilisateur.").slice(0, 500),
    gmailResult: "confirmed",
    canUndo: true,
    createdAt: new Date().toISOString(),
    undoneAt: null,
  };
}

function createFailedActivityEntry(args: {
  accountId: string;
  provider: string;
  input: ExecuteMailManagementInput;
  labels: MailProviderLabel[];
  selected: MailMessage[];
  snapshotsBefore: MailMutationSnapshot[];
  mutation: { addLabelIds: string[]; removeLabelIds: string[] };
  rollbackError: unknown;
}): MailActivityEntry {
  const labelNames = new Map(args.labels.map((label) => [label.id, label.name]));
  const safeFailure = args.rollbackError
    ? "Gmail n’a pas confirmé l’action et la restauration automatique est incomplète."
    : "Gmail n’a pas confirmé l’action; les libellés précédents ont été restaurés.";
  return {
    id: `mail-activity-${randomUUID()}`,
    accountId: args.accountId,
    provider: args.provider,
    target: args.input.target,
    messageIds: args.selected.map((message) => message.id),
    threadId: args.input.target === "thread" ? args.selected[0].threadId : null,
    subject: args.selected[0].subject,
    action: args.input.action,
    source: args.input.source ?? "user",
    automatic: false,
    previousClassification: getMailWorkflowView(args.selected[0], args.labels),
    nextClassification: getMailWorkflowView(args.selected[0], args.labels),
    labelsAdded: args.mutation.addLabelIds.map((id) => labelNames.get(id) ?? id),
    labelsRemoved: args.mutation.removeLabelIds.map((id) => labelNames.get(id) ?? id),
    snapshotsBefore: args.snapshotsBefore,
    snapshotsAfter: args.snapshotsBefore,
    aiConfidence: args.input.aiConfidence ?? null,
    reason: `${(args.input.reason ?? "Action demandée.").slice(0, 350)} ${safeFailure}`,
    gmailResult: "failed",
    canUndo: false,
    createdAt: new Date().toISOString(),
    undoneAt: null,
  };
}

function toSnapshot(message: MailMessage): MailMutationSnapshot {
  return { messageId: message.id, threadId: message.threadId, labelIds: [...(message.labels ?? [])] };
}

async function restoreSnapshots(
  provider: Awaited<ReturnType<typeof getActiveMailContext>>["provider"],
  snapshots: MailMutationSnapshot[],
): Promise<MailMessage[]> {
  const restored: MailMessage[] = [];
  for (const snapshot of snapshots) {
    const current = await provider.getMessage(snapshot.messageId);
    if (!current) throw new Error("Un message à restaurer n’existe plus dans le compte Gmail actif.");
    const currentLabels = current.labels ?? [];
    const addLabelIds = snapshot.labelIds.filter((label) => !currentLabels.includes(label));
    const removeLabelIds = currentLabels.filter((label) => !snapshot.labelIds.includes(label));
    if (!addLabelIds.length && !removeLabelIds.length) { restored.push(current); continue; }
    const result = await provider.modifyLabels({ messageIds: [snapshot.messageId], target: "message", addLabelIds, removeLabelIds });
    const confirmed = result[0];
    if (!confirmed || !sameLabels(confirmed.labels ?? [], snapshot.labelIds)) throw new Error("Gmail n’a pas confirmé la restauration exacte des libellés.");
    restored.push(confirmed);
  }
  return restored;
}

function sameLabels(first: string[], second: string[]): boolean {
  return first.length === second.length && first.every((label) => second.includes(label));
}

function buildNotice(action: MailManagementAction, count: number, subject: string, source: "user" | "ai", reason?: string): string {
  const target = count === 1 ? `Le mail « ${subject} »` : `${count} mails`;
  const endings: Record<MailManagementAction, string> = {
    to_process: "a été classé dans À traiter.",
    waiting: "a été placé en attente et retiré de la boîte principale.",
    processed: "a été marqué comme traité et archivé.",
    archive: source === "ai" ? "a été archivé par l’IA après confirmation." : "a été archivé dans Gmail.",
    restore: "a été restauré dans la boîte de réception.",
    mark_read: "a été marqué comme lu.",
    mark_unread: "a été marqué comme non lu.",
  };
  const notice = `${target} ${count === 1 ? endings[action] : endings[action].replace("a été", "ont été")}`;
  return source === "ai" && reason ? `${notice} ${reason.slice(0, 220)}` : notice;
}
