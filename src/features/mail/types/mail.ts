export const MAIL_PROVIDER_TYPES = ["google", "microsoft", "mock"] as const;

export type MailProviderType = (typeof MAIL_PROVIDER_TYPES)[number];

export type MailAccountMode = "demo" | "oauth";

export type MailMessageCategory =
  | "urgent"
  | "reply_required"
  | "information"
  | "action_required";

export type MailPriority = "high" | "normal" | "low";

export type MailConnectionState =
  | "connected"
  | "disconnected"
  | "unavailable"
  | "error";

export interface MailAddress {
  name?: string;
  email: string;
}

export interface MailAccount {
  id: string;
  provider: MailProviderType;
  emailAddress: string;
  displayName: string;
  mode: MailAccountMode;
  status: MailConnectionState;
  connectedAt: string | null;
  lastSuccessfulSyncAt: string | null;
  lastConnectionTestAt: string | null;
  isActive: boolean;
  error: string | null;
}

export interface MailAttachment {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  isInline: boolean;
}

export interface MailMessage {
  id: string;
  accountId: string;
  provider: MailProviderType;
  threadId: string;
  from: MailAddress;
  to: MailAddress[];
  cc: MailAddress[];
  subject: string;
  snippet: string;
  bodyText: string;
  summary: string;
  proposedAction: string;
  category: MailMessageCategory;
  priority: MailPriority;
  receivedAt: string;
  isRead: boolean;
  isArchived: boolean;
  attachments: MailAttachment[];
}

export interface MailThread {
  id: string;
  accountId: string;
  provider: MailProviderType;
  subject: string;
  participants: MailAddress[];
  messages: MailMessage[];
  lastMessageAt: string;
}

export interface MailDraft {
  id: string;
  accountId: string;
  provider: MailProviderType;
  to: MailAddress[];
  cc: MailAddress[];
  bcc: MailAddress[];
  subject: string;
  bodyText: string;
  createdAt: string;
  updatedAt: string;
  status: "draft";
  threadId?: string;
}

export interface CreateMailDraftInput {
  to: MailAddress[];
  cc?: MailAddress[];
  bcc?: MailAddress[];
  subject: string;
  bodyText: string;
  replyToMessageId?: string;
  replyToThreadId?: string;
}

export interface ListMessagesOptions {
  limit?: number;
  cursor?: string;
  unreadOnly?: boolean;
  category?: MailMessageCategory;
}

export interface MailConnectionStatus {
  provider: MailProviderType;
  state: MailConnectionState;
  emailAddress: string | null;
  connectedAt: string | null;
  lastSuccessfulSyncAt?: string | null;
  error?: string | null;
}

export function isMailProviderType(value: unknown): value is MailProviderType {
  return MAIL_PROVIDER_TYPES.some((provider) => provider === value);
}
