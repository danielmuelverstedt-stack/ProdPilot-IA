import type { MailMessage } from "@/features/mail/types/mail";

export const MAIL_WORKFLOW_LABELS = {
  toProcess: "ProdPilot/À traiter",
  waiting: "ProdPilot/En attente",
  processed: "ProdPilot/Traités",
  aiArchived: "ProdPilot/Archivé par IA",
} as const;

export type MailWorkflowView = "all" | "new" | "to_process" | "waiting" | "processed" | "ai_archived";
export type MailManagementAction = "to_process" | "waiting" | "processed" | "archive" | "restore" | "mark_read" | "mark_unread";
export type MailMutationTarget = "message" | "thread";

export interface MailProviderLabel {
  id: string;
  name: string;
  type: "system" | "user";
}

export interface MailLabelMutation {
  messageIds: string[];
  threadId?: string;
  target: MailMutationTarget;
  addLabelIds: string[];
  removeLabelIds: string[];
}

export interface MailMutationSnapshot {
  messageId: string;
  threadId: string;
  labelIds: string[];
}

export interface MailManagementResult {
  activityId: string;
  action: MailManagementAction;
  messages: MailMessage[];
  canUndo: boolean;
  notice: string;
}

export interface MailActivityEntry {
  id: string;
  accountId: string;
  provider: string;
  target: MailMutationTarget;
  messageIds: string[];
  threadId: string | null;
  subject: string;
  action: MailManagementAction;
  source: "user" | "ai";
  automatic: boolean;
  previousClassification: MailWorkflowView;
  nextClassification: MailWorkflowView;
  labelsAdded: string[];
  labelsRemoved: string[];
  snapshotsBefore: MailMutationSnapshot[];
  snapshotsAfter: MailMutationSnapshot[];
  aiConfidence: number | null;
  reason: string;
  gmailResult: "confirmed" | "failed" | "undone";
  canUndo: boolean;
  createdAt: string;
  undoneAt: string | null;
}

export type MailAiClassification = "to_process" | "waiting" | "processed" | "informational" | "low_value" | "needs_review";

export interface MailClassificationDecision {
  classification: MailAiClassification;
  confidence: number;
  reason: string;
  detectedActions: string[];
  detectedDeadlines: string[];
  recommendedLabels: string[];
  proposedOperation: {
    type: "none" | "label" | "archive" | "mark_processed" | "mark_waiting";
    requiresConfirmation: true;
  };
}

export interface MailAutomationRule {
  id: string;
  name: string;
  condition: { kind: "sender_domain" | "sender" | "subject_contains" | "newsletter"; value: string };
  action: "keep_to_process" | "archive" | "mark_waiting";
  isActive: boolean;
  priority: number;
  origin: "user" | "ai_proposal";
  createdAt: string;
  lastUsedAt: string | null;
}
