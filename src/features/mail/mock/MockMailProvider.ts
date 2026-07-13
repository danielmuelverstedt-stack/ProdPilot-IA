import "server-only";

import type { MailProvider } from "@/features/mail/services/mail-provider";
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

interface MockMailProviderOptions {
  type: MailProviderType;
  name: string;
  description: string;
  accountId: string;
  emailAddress: string;
  messages: MailMessage[];
}

export class MockMailProvider implements MailProvider {
  readonly isAvailable = true;
  readonly isMock = true;
  readonly type: MailProviderType;
  readonly name: string;
  readonly description: string;

  private account: MailAccount;
  private messages: MailMessage[];
  private drafts: MailDraft[] = [];

  constructor(private readonly options: MockMailProviderOptions) {
    this.type = options.type;
    this.name = options.name;
    this.description = options.description;
    this.messages = options.messages.map((message) => ({ ...message }));
    this.account = {
      id: options.accountId,
      provider: options.type,
      emailAddress: options.emailAddress,
      displayName: "Responsable de production",
      status: "connected",
      connectedAt: "2026-07-13T06:00:00.000Z",
    };
  }

  async connect(): Promise<MailAccount> {
    this.account = {
      ...this.account,
      emailAddress: this.options.emailAddress,
      displayName: "Responsable de production",
      status: "connected",
      connectedAt: new Date().toISOString(),
    };
    return { ...this.account };
  }

  async disconnect(): Promise<void> {
    this.account = {
      ...this.account,
      emailAddress: null,
      displayName: null,
      status: "disconnected",
      connectedAt: null,
    };
  }

  async getConnectionStatus(): Promise<MailConnectionStatus> {
    return {
      provider: this.type,
      state: this.account.status,
      emailAddress: this.account.emailAddress,
      connectedAt: this.account.connectedAt,
    };
  }

  async listMessages(options: ListMessagesOptions = {}): Promise<MailMessage[]> {
    this.assertConnected();
    return this.messages
      .filter(
        (message) =>
          !message.isArchived &&
          (!options.unreadOnly || !message.isRead) &&
          (!options.category || message.category === options.category),
      )
      .slice(0, options.limit ?? 25)
      .map((message) => ({ ...message }));
  }

  async getMessage(messageId: string): Promise<MailMessage | null> {
    this.assertConnected();
    return this.messages.find((message) => message.id === messageId) ?? null;
  }

  async getThread(threadId: string): Promise<MailThread | null> {
    this.assertConnected();
    const messages = this.messages.filter((message) => message.threadId === threadId);
    if (messages.length === 0) return null;

    return {
      id: threadId,
      accountId: this.account.id,
      provider: this.type,
      subject: messages[0].subject,
      participants: messages.map((message) => message.from),
      messages,
      lastMessageAt: messages.at(-1)?.receivedAt ?? messages[0].receivedAt,
    };
  }

  async searchMessages(query: string): Promise<MailMessage[]> {
    this.assertConnected();
    const normalizedQuery = query.trim().toLocaleLowerCase("fr");
    if (!normalizedQuery) return this.listMessages();

    return this.messages.filter((message) =>
      [message.subject, message.summary, message.bodyText, message.from.email]
        .join(" ")
        .toLocaleLowerCase("fr")
        .includes(normalizedQuery),
    );
  }

  async createDraft(input: CreateMailDraftInput): Promise<MailDraft> {
    this.assertConnected();
    const now = new Date().toISOString();
    const draft: MailDraft = {
      id: `draft-${this.type}-${this.drafts.length + 1}`,
      accountId: this.account.id,
      provider: this.type,
      to: input.to,
      cc: input.cc ?? [],
      bcc: input.bcc ?? [],
      subject: input.subject,
      bodyText: input.bodyText,
      createdAt: now,
      updatedAt: now,
      status: "draft",
    };
    this.drafts.push(draft);
    return { ...draft };
  }

  async archiveMessage(messageId: string): Promise<void> {
    this.assertConnected();
    const message = this.messages.find((item) => item.id === messageId);
    if (!message) throw new Error("Le message demandé est introuvable.");
    message.isArchived = true;
  }

  private assertConnected() {
    if (this.account.status !== "connected") {
      throw new Error(`${this.name} n’est pas connecté.`);
    }
  }
}
