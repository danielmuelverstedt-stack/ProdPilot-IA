export const MAIL_PROVIDER_TYPES = ["google", "microsoft", "imap", "mock"] as const;

export type MailProviderType = (typeof MAIL_PROVIDER_TYPES)[number];

export type MailAccountMode = "demo" | "oauth";

export type MailPreferredLanguage = "fr" | "nl" | "en";

export type MailReplyTone = "professional" | "concise" | "warm" | "neutral";

export type MailDisplayDensity = "compact" | "comfortable";

export type MailReadingPanePosition = "hidden" | "right" | "bottom";

export type MailConversationMode = "threaded" | "individual";

export type MailDateFormat = "dd/MM/yyyy" | "dd/MM/yy";

export type MailReplyBehavior = "reply" | "reply_all";

export type MailDefaultSort = "newest" | "oldest" | "priority";

export type MailDefaultFilter = "all" | "unread" | "urgent" | "reply_required";

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
  organizationId?: string | null;
  settings: MailAccountSettings;
}

export interface MailAccountSettings {
  preferredLanguage: MailPreferredLanguage;
  defaultReplyTone: MailReplyTone;
  synchronizationPeriodMinutes: number;
  maximumMessagesRetrieved: number;
  unreadMessagesOnly: boolean;
  includeAttachmentMetadata: boolean;
  automaticDraftCreation: boolean;
  displayDensity: MailDisplayDensity;
  previewPaneEnabled: boolean;
  readingPanePosition: MailReadingPanePosition;
  conversationMode: MailConversationMode;
  groupMessagesByThread: boolean;
  dateFormat: MailDateFormat;
  timeFormat: "24h";
  signature: string;
  replyBehavior: MailReplyBehavior;
  notifyOnNewMail: boolean;
  notifyOnSynchronization: boolean;
  notifyOnConnectionLoss: boolean;
  defaultFilter: MailDefaultFilter;
  defaultSort: MailDefaultSort;
  favoriteFolders: string[];
  draftAutosaveEnabled: boolean;
  draftAutosaveDelaySeconds: number;
  keepDraftHistory: boolean;
  sendingEnabled: boolean;
}

export interface MailAttachment {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  isInline: boolean;
  contentId?: string;
  previewCapability?: "none" | "image" | "pdf" | "text";
  ocrStatus?: "not_requested" | "pending" | "completed" | "unavailable";
  analysisStatus?: "not_requested" | "pending" | "completed" | "unavailable";
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
  labels?: string[];
  tags?: string[];
  isImportant?: boolean;
  isFlagged?: boolean;
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
  status: "draft" | "saving" | "saved" | "error" | "sent";
  threadId?: string;
  source?: "user" | "deterministic" | "future_ai";
  hasUnsavedChanges?: boolean;
  version?: number;
}

export interface MailDraftRevision {
  id: string;
  draftId: string;
  version: number;
  bodyText: string;
  createdAt: string;
  source: "user" | "autosave" | "future_ai";
}

export interface MailConversation {
  id: string;
  threadId: string;
  accountId: string;
  participants: MailAddress[];
  messages: MailMessage[];
  quotedMessageIds: string[];
  updatedAt: string;
  memoryStatus: "not_available" | "prepared";
}

export type MailNotificationType =
  | "new_mail"
  | "synchronization"
  | "connection_lost"
  | "provider_error"
  | "draft_saved"
  | "future_ai_completed";

export interface MailNotification {
  id: string;
  accountId: string;
  type: MailNotificationType;
  title: string;
  message: string;
  createdAt: string;
  severity: "information" | "warning" | "error";
}

export type MailReadFilter = "all" | "unread" | "read";
export type MailDatePreset = "all" | "today" | "yesterday" | "this_week" | "custom";

export interface MailSearchCriteria {
  text?: string;
  subject?: string;
  sender?: string;
  recipient?: string;
  body?: string;
  attachmentName?: string;
  readState?: MailReadFilter;
  importantOnly?: boolean;
  flaggedOnly?: boolean;
  waitingReplyOnly?: boolean;
  hasAttachment?: boolean;
  datePreset?: MailDatePreset;
  dateFrom?: string;
  dateTo?: string;
  provider?: MailProviderType;
  accountId?: string;
  labels?: string[];
  tags?: string[];
  priority?: MailPriority;
  category?: MailMessageCategory;
  futureAiKeywords?: string[];
  sort?: MailDefaultSort;
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
  retrieveAll?: boolean;
  forceRefresh?: boolean;
}

export interface MailboxStatistics {
  inboxMessages: number;
  inboxThreads: number;
  unreadInboxMessages: number;
  totalMessages: number | null;
  historyId: string | null;
}

export interface MailSynchronizationSummary {
  synchronizedMessages: number;
  detectedMessages: number | null;
  isComplete: boolean;
  pageCount: number;
  durationMs: number;
  completedAt: string;
  cache: "hit" | "miss";
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
