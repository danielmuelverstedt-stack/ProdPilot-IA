import type { MailAddress, MailMessage, MailProviderType } from "@/features/mail/types/mail";

export const MAIL_ASSISTANT_INTENTS = [
  "start_mail_session", "summarize_new_mail", "list_important_mail", "open_message",
  "explain_classification", "modify_reply", "generate_reply", "create_draft",
  "create_action", "add_to_qrqc", "add_to_meeting", "mark_processed",
  "ignore_message", "send_email", "undo", "redo", "next_message",
  "previous_message", "finish_session",
] as const;

export type MailAssistantIntent = (typeof MAIL_ASSISTANT_INTENTS)[number];
export type MailAssistantGroup = "now" | "reply" | "action" | "review" | "information" | "no_action" | "processed";
export type MailAssistantActionLevel = 1 | 2 | 3;
export type MailAssistantStatus = "idle" | "starting" | "ready" | "executing" | "finished" | "error";

export interface MailAssistantClassification {
  group: MailAssistantGroup;
  reason: string;
  confidence: number;
  requiresReply: boolean;
  suggestsAction: boolean;
  isUrgent: boolean;
}

export interface MailAssistantReplyVersion {
  id: string;
  bodyText: string;
  createdAt: string;
  source: "assistant" | "user";
  instruction?: string;
}

export interface MailAssistantReplyProposal {
  messageId: string;
  recipients: MailAddress[];
  subject: string;
  reason: string;
  confidence: number;
  detectedDeadline: string | null;
  versions: MailAssistantReplyVersion[];
  currentVersion: number;
  isManuallyEdited: boolean;
  status: "pending" | "approved" | "draft_created" | "ignored";
}

export interface MailAssistantSessionMessage extends MailMessage {
  sessionNumber: number;
  classification: MailAssistantClassification;
  processed: boolean;
  ignored: boolean;
}

export interface MailAssistantConversationEntry {
  id: string;
  role: "assistant" | "user";
  text: string;
  createdAt: string;
}

export interface MailAssistantAuditEvent {
  id: string;
  type: "classification_proposed" | "user_correction" | "reply_generated" | "reply_modified" | "draft_creation_approved" | "draft_created" | "action_created" | "message_ignored" | "send_explicitly_requested" | "execution_success" | "execution_failure";
  accountId: string;
  messageIds: string[];
  createdAt: string;
  outcome?: "success" | "failure" | "skipped";
  detail?: string;
}

export interface MailAssistantCommand {
  intent: MailAssistantIntent;
  rawText: string;
  messageIds: string[];
  instruction?: string;
  isExplicitSend: boolean;
  isAmbiguous: boolean;
  clarification?: string;
}

export interface MailAssistantSession {
  id: string;
  account: { id: string; displayName: string; emailAddress: string; provider: MailProviderType; mode: "demo" | "oauth" };
  status: MailAssistantStatus;
  startedAt: string;
  endedAt: string | null;
  messages: MailAssistantSessionMessage[];
  replies: MailAssistantReplyProposal[];
  conversation: MailAssistantConversationEntry[];
  audits: MailAssistantAuditEvent[];
  draftsCreated: string[];
  actionsCreated: string[];
  pendingApproval: { intent: MailAssistantIntent; messageIds: string[]; level: MailAssistantActionLevel } | null;
  lastExecutedCommand: MailAssistantCommand | null;
  errors: string[];
}

export interface MailAssistantBrief {
  newMessages: number;
  noReply: number;
  replies: number;
  actions: number;
  urgent: number;
  review: number;
  explanation: string;
}
