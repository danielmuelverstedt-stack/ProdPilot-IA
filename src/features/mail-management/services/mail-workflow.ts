import { MAIL_WORKFLOW_LABELS, type MailManagementAction, type MailProviderLabel, type MailWorkflowView } from "../types/mail-management.ts";
import type { MailMessage } from "@/features/mail/types/mail";

export function getMailWorkflowView(message: MailMessage, labels: MailProviderLabel[]): MailWorkflowView {
  const current = new Set(message.labels ?? []);
  const byName = new Map(labels.map((label) => [label.name, label.id]));
  const has = (name: string) => current.has(byName.get(name) ?? name);
  if (has(MAIL_WORKFLOW_LABELS.aiArchived)) return "ai_archived";
  if (has(MAIL_WORKFLOW_LABELS.processed)) return "processed";
  if (has(MAIL_WORKFLOW_LABELS.waiting)) return "waiting";
  if (!message.isRead && current.has("INBOX")) return "new";
  if (has(MAIL_WORKFLOW_LABELS.toProcess) || current.has("INBOX")) return "to_process";
  return "all";
}

export function isMailVisibleInWorkflowView(message: MailMessage, view: MailWorkflowView, labels: MailProviderLabel[]): boolean {
  if (view === "all") return true;
  const actual = getMailWorkflowView(message, labels);
  if (view === "to_process") return actual === "to_process" || actual === "new";
  return actual === view;
}

export function buildMailLabelMutation(action: MailManagementAction, labels: MailProviderLabel[], source: "user" | "ai") {
  const ids = new Map(labels.map((label) => [label.name, label.id]));
  const workflowIds = Object.values(MAIL_WORKFLOW_LABELS).map((name) => requiredLabelId(ids, name));
  const id = (name: string) => requiredLabelId(ids, name);
  if (action === "to_process") return { addLabelIds: [id(MAIL_WORKFLOW_LABELS.toProcess), "INBOX"], removeLabelIds: workflowIds.filter((value) => value !== id(MAIL_WORKFLOW_LABELS.toProcess)) };
  if (action === "waiting") return { addLabelIds: [id(MAIL_WORKFLOW_LABELS.waiting)], removeLabelIds: [...workflowIds.filter((value) => value !== id(MAIL_WORKFLOW_LABELS.waiting)), "INBOX"] };
  if (action === "processed") return { addLabelIds: [id(MAIL_WORKFLOW_LABELS.processed)], removeLabelIds: [...workflowIds.filter((value) => value !== id(MAIL_WORKFLOW_LABELS.processed)), "INBOX"] };
  if (action === "archive" && source === "ai") return { addLabelIds: [id(MAIL_WORKFLOW_LABELS.aiArchived)], removeLabelIds: [...workflowIds.filter((value) => value !== id(MAIL_WORKFLOW_LABELS.aiArchived)), "INBOX"] };
  if (action === "archive") return { addLabelIds: [], removeLabelIds: [...workflowIds, "INBOX"] };
  if (action === "restore") return { addLabelIds: ["INBOX", id(MAIL_WORKFLOW_LABELS.toProcess)], removeLabelIds: workflowIds.filter((value) => value !== id(MAIL_WORKFLOW_LABELS.toProcess)) };
  if (action === "mark_read") return { addLabelIds: [], removeLabelIds: ["UNREAD"] };
  return { addLabelIds: ["UNREAD"], removeLabelIds: [] };
}

function requiredLabelId(labels: Map<string, string>, name: string): string {
  const id = labels.get(name);
  if (!id) throw new Error(`Le libellé Gmail « ${name} » est indisponible.`);
  return id;
}
