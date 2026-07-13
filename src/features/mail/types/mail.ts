export const MAIL_PROVIDER_TYPES = ["google", "microsoft"] as const;

export type MailProviderType = (typeof MAIL_PROVIDER_TYPES)[number];

export type MailConnectionState =
  | "connected"
  | "disconnected"
  | "unavailable";

export interface MailAddress {
  name?: string;
  email: string;
}

export interface MailAccount {
  id: string;
  provider: MailProviderType;
  emailAddress: string | null;
  displayName: string | null;
  status: MailConnectionState;
  connectedAt: string | null;
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
  status: "draft" | "sent";
}

export interface CreateMailDraftInput {
  to: MailAddress[];
  cc?: MailAddress[];
  bcc?: MailAddress[];
  subject: string;
  bodyText: string;
  replyToMessageId?: string;
}

export interface SendMailDraftOptions {
  confirmedByUser: true;
}

export interface ListMessagesOptions {
  limit?: number;
  cursor?: string;
  unreadOnly?: boolean;
}

export interface MailConnectionStatus {
  provider: MailProviderType;
  state: MailConnectionState;
  emailAddress: string | null;
  connectedAt: string | null;
}

export interface MailConnectionSummary extends MailConnectionStatus {
  providerName: string;
  description: string;
  isMock: boolean;
}

export function isMailProviderType(value: unknown): value is MailProviderType {
  return MAIL_PROVIDER_TYPES.some((provider) => provider === value);
}
