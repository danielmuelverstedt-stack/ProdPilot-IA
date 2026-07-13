import type {
  CreateMailDraftInput,
  ListMessagesOptions,
  MailAccount,
  MailConnectionStatus,
  MailDraft,
  MailMessage,
  MailProviderType,
  MailThread,
} from "@/features/mail/types/mail";

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
  getMessage(messageId: string): Promise<MailMessage | null>;
  getThread(threadId: string): Promise<MailThread | null>;
  searchMessages(query: string): Promise<MailMessage[]>;
  createDraft(input: CreateMailDraftInput): Promise<MailDraft>;
  archiveMessage(messageId: string): Promise<void>;
}
