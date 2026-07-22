import "server-only";

import { randomUUID } from "node:crypto";
import { getMockMailMessages } from "@/features/mail/mock/mail-messages";
import { getMailProviderDefinition } from "@/features/mail/config/mail-provider-catalog";
import type { MailProvider } from "@/features/mail/services/mail-provider";
import type { MailLabelMutation, MailProviderLabel } from "@/features/mail-management/types/mail-management";
import type {
  CreateMailDraftInput,
  ListMessagesOptions,
  MailAccount,
  MailConnectionStatus,
  MailDraft,
  MailboxStatistics,
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
    return options.retrieveAll ? messages : messages.slice(0, options.limit ?? 25);
  }

  async getMailboxStatistics(): Promise<MailboxStatistics> {
    const messages = getMockMailMessages(this.account);
    return {
      inboxMessages: messages.length,
      inboxThreads: new Set(messages.map((message) => message.threadId)).size,
      unreadInboxMessages: messages.filter((message) => !message.isRead).length,
      totalMessages: messages.length,
      historyId: null,
    };
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

  async sendDraft(draftId: string): Promise<{ messageId: string; threadId: string }> {
    if (!this.account.settings.sendingEnabled) throw new Error("L’envoi n’est pas autorisé pour ce compte. Activez-le dans Réglages → Connexions → Messagerie avant d’envoyer.");
    return { messageId: `mock-sent-${randomUUID()}`, threadId: draftId };
  }

  async archiveMessage(): Promise<void> {}

  async getManagementPermission(): Promise<{ canModifyMail: boolean; reconnectRequired: boolean }> {
    return { canModifyMail: true, reconnectRequired: false };
  }

  async listLabels(): Promise<MailProviderLabel[]> {
    return [...mockLabels.values()].map((label) => structuredClone(label));
  }

  async ensureLabels(names: string[]): Promise<MailProviderLabel[]> {
    return names.map((name) => {
      const current = [...mockLabels.values()].find((label) => label.name === name);
      if (current) return structuredClone(current);
      const label = { id: `mock-label-${mockLabels.size + 1}`, name, type: "user" as const };
      mockLabels.set(label.id, label);
      return structuredClone(label);
    });
  }

  async modifyLabels(input: MailLabelMutation): Promise<MailMessage[]> {
    const targetIds = input.target === "thread" && input.threadId
      ? getMockMailMessages(this.account).filter((message) => message.threadId === input.threadId).map((message) => message.id)
      : input.messageIds;
    return getMockMailMessages(this.account).filter((message) => targetIds.includes(message.id)).map((message) => {
      const labels = new Set(message.labels ?? []);
      input.removeLabelIds.forEach((label) => labels.delete(label));
      input.addLabelIds.forEach((label) => labels.add(label));
      return { ...message, labels: [...labels], isRead: !labels.has("UNREAD"), isArchived: !labels.has("INBOX") };
    });
  }
}

const mockLabels = new Map<string, MailProviderLabel>([
  ["INBOX", { id: "INBOX", name: "INBOX", type: "system" }],
  ["UNREAD", { id: "UNREAD", name: "UNREAD", type: "system" }],
]);
