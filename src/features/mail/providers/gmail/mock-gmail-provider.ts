import "server-only";

import type { MailProvider } from "@/features/mail/services/mail-provider";
import type {
  CreateMailDraftInput,
  ListMessagesOptions,
  MailAccount,
  MailConnectionStatus,
  MailDraft,
  MailMessage,
  SendMailDraftOptions,
  MailThread,
} from "@/features/mail/types/mail";

const MOCK_ACCOUNT_ID = "google-workspace-mock";

const initialMessages: MailMessage[] = [
  {
    id: "message-1",
    accountId: MOCK_ACCOUNT_ID,
    provider: "google",
    threadId: "thread-1",
    from: { name: "Service achats", email: "achats@exemple.fr" },
    to: [{ name: "Production", email: "production@exemple.fr" }],
    cc: [],
    subject: "Confirmation de livraison matière",
    snippet: "La matière nécessaire à l’OF 2418 sera livrée demain matin.",
    bodyText:
      "Bonjour, la matière nécessaire à l’OF 2418 sera livrée demain matin à 08 h 30.",
    receivedAt: "2026-07-13T07:15:00.000Z",
    isRead: false,
    isArchived: false,
    attachments: [],
  },
];

export class MockGmailProvider implements MailProvider {
  readonly type = "google" as const;
  readonly name = "Google Workspace";
  readonly description =
    "Connectez Gmail pour consulter et traiter les messages liés à la production.";
  readonly isAvailable = true;
  readonly isMock = true;

  private account: MailAccount = {
    id: MOCK_ACCOUNT_ID,
    provider: "google",
    emailAddress: null,
    displayName: null,
    status: "disconnected",
    connectedAt: null,
  };

  private messages = [...initialMessages];
  private drafts: MailDraft[] = [];

  async connect(): Promise<MailAccount> {
    this.account = {
      ...this.account,
      emailAddress: "production@exemple.fr",
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
    const visibleMessages = this.messages.filter(
      (message) => !message.isArchived && (!options.unreadOnly || !message.isRead),
    );
    return visibleMessages.slice(0, options.limit ?? 25);
  }

  async getMessage(messageId: string): Promise<MailMessage | null> {
    this.assertConnected();
    return this.messages.find((message) => message.id === messageId) ?? null;
  }

  async getThread(threadId: string): Promise<MailThread | null> {
    this.assertConnected();
    const messages = this.messages.filter(
      (message) => message.threadId === threadId,
    );

    if (messages.length === 0) {
      return null;
    }

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

    if (!normalizedQuery) {
      return this.listMessages();
    }

    return this.messages.filter((message) =>
      [message.subject, message.snippet, message.bodyText, message.from.email]
        .join(" ")
        .toLocaleLowerCase("fr")
        .includes(normalizedQuery),
    );
  }

  async createDraft(input: CreateMailDraftInput): Promise<MailDraft> {
    this.assertConnected();
    const now = new Date().toISOString();
    const draft: MailDraft = {
      id: `draft-${this.drafts.length + 1}`,
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

  async sendDraft(
    draftId: string,
    options: SendMailDraftOptions,
  ): Promise<MailMessage> {
    this.assertConnected();

    if (options.confirmedByUser !== true) {
      throw new Error("L’envoi doit être confirmé explicitement.");
    }

    const draft = this.drafts.find((item) => item.id === draftId);

    if (!draft) {
      throw new Error("Le brouillon demandé est introuvable.");
    }

    draft.status = "sent";
    draft.updatedAt = new Date().toISOString();

    const sentMessage: MailMessage = {
      id: `sent-${draft.id}`,
      accountId: draft.accountId,
      provider: this.type,
      threadId: `thread-${draft.id}`,
      from: {
        name: this.account.displayName ?? undefined,
        email: this.account.emailAddress ?? "production@exemple.fr",
      },
      to: draft.to,
      cc: draft.cc,
      subject: draft.subject,
      snippet: draft.bodyText.slice(0, 140),
      bodyText: draft.bodyText,
      receivedAt: draft.updatedAt,
      isRead: true,
      isArchived: false,
      attachments: [],
    };
    this.messages.push(sentMessage);
    return sentMessage;
  }

  async archiveMessage(messageId: string): Promise<void> {
    this.assertConnected();
    const message = this.messages.find((item) => item.id === messageId);

    if (!message) {
      throw new Error("Le message demandé est introuvable.");
    }

    message.isArchived = true;
  }

  private assertConnected() {
    if (this.account.status !== "connected") {
      throw new Error("Google Workspace n’est pas connecté.");
    }
  }
}
