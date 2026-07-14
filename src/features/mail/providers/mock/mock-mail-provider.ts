import "server-only";

import { randomUUID } from "node:crypto";
import { getMockMailMessages } from "@/features/mail/mock/mail-messages";
import { getMailProviderDefinition } from "@/features/mail/config/mail-provider-catalog";
import type { MailProvider } from "@/features/mail/services/mail-provider";
import type {
  CreateMailDraftInput,
  ListMessagesOptions,
  MailAccount,
  MailConnectionStatus,
  MailDraft,
  MailMessage,
  MailSearchCriteria,
  MailThread,
} from "@/features/mail/types/mail";

export class MockMailProvider implements MailProvider {
  readonly type: MailAccount["provider"];
  readonly name: string;
  readonly description = "Compte de démonstration local, sans connexion à un service externe.";
  readonly isAvailable = true;
  readonly isMock = true;

  constructor(private readonly account: MailAccount) {
    this.type = account.provider;
    this.name = getMailProviderDefinition(account.provider).label;
  }

  async connect(): Promise<MailAccount> {
    return structuredClone(this.account);
  }

  async disconnect(): Promise<void> {}

  async getConnectionStatus(): Promise<MailConnectionStatus> {
    return {
      provider: this.account.provider,
      state: this.account.status,
      emailAddress: this.account.emailAddress,
      connectedAt: this.account.connectedAt,
      lastSuccessfulSyncAt: this.account.lastSuccessfulSyncAt,
      error: this.account.error,
    };
  }

  async testConnection(): Promise<MailConnectionStatus> {
    return this.getConnectionStatus();
  }

  async listMessages(options: ListMessagesOptions = {}): Promise<MailMessage[]> {
    const messages = getMockMailMessages(this.account)
      .filter((message) => !options.unreadOnly || !message.isRead)
      .filter((message) => !options.category || message.category === options.category);
    return messages.slice(0, options.limit ?? 25);
  }

  async getMessage(messageId: string): Promise<MailMessage | null> {
    return getMockMailMessages(this.account).find((message) => message.id === messageId) ?? null;
  }

  async getThread(threadId: string): Promise<MailThread | null> {
    const messages = getMockMailMessages(this.account).filter((message) => message.threadId === threadId);
    if (!messages.length) return null;
    return {
      id: threadId,
      accountId: this.account.id,
      provider: this.account.provider,
      subject: messages[0].subject,
      participants: messages.flatMap((message) => [message.from, ...message.to]),
      messages,
      lastMessageAt: messages.at(-1)?.receivedAt ?? messages[0].receivedAt,
    };
  }

  async searchMessages(criteria: MailSearchCriteria): Promise<MailMessage[]> {
    const { searchMailMessages } = await import("@/features/mail/services/mail-search");
    return searchMailMessages(getMockMailMessages(this.account), criteria);
  }

  async createDraft(input: CreateMailDraftInput): Promise<MailDraft> {
    const now = new Date().toISOString();
    return {
      id: `mock-draft-${randomUUID()}`,
      accountId: this.account.id,
      provider: this.account.provider,
      to: input.to,
      cc: input.cc ?? [],
      bcc: input.bcc ?? [],
      subject: input.subject,
      bodyText: input.bodyText,
      createdAt: now,
      updatedAt: now,
      status: "draft",
      threadId: input.replyToThreadId,
    };
  }

  async archiveMessage(): Promise<void> {}
}
