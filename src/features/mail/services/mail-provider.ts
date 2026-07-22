import type {
  CreateMailDraftInput,
  ListMessagesOptions,
  MailAccount,
  MailConnectionStatus,
  MailDraft,
  MailboxStatistics,
  MailMessage,
  MailSearchCriteria,
  MailProviderType,
  MailThread,
} from "@/features/mail/types/mail";
import type { MailLabelMutation, MailProviderLabel } from "@/features/mail-management/types/mail-management";

export interface MailProvider {
  readonly type: MailProviderType;
  readonly name: string;
  readonly description: string;
  readonly isAvailable: boolean;
  readonly isMock: boolean;

  connect(): Promise<MailAccount>;
  disconnect(accountId?: string): Promise<void>;
  getConnectionStatus(accountId?: string): Promise<MailConnectionStatus>;
  testConnection(): Promise<MailConnectionStatus>;
  listMessages(options?: ListMessagesOptions): Promise<MailMessage[]>;
  getMailboxStatistics(): Promise<MailboxStatistics>;
  getMessage(messageId: string): Promise<MailMessage | null>;
  getThread(threadId: string): Promise<MailThread | null>;
  searchMessages(criteria: MailSearchCriteria): Promise<MailMessage[]>;
  createDraft(input: CreateMailDraftInput): Promise<MailDraft>;
  sendDraft(draftId: string): Promise<{ messageId: string; threadId: string }>;
  archiveMessage(messageId: string): Promise<void>;
  getManagementPermission(): Promise<{ canModifyMail: boolean; reconnectRequired: boolean }>;
  listLabels(): Promise<MailProviderLabel[]>;
  ensureLabels(names: string[]): Promise<MailProviderLabel[]>;
  modifyLabels(input: MailLabelMutation): Promise<MailMessage[]>;
}
