import "server-only";

import { google } from "googleapis";
import {
  disconnectGoogleAccount,
  getAuthorizedGoogleClient,
  testGoogleConnection,
} from "@/features/mail/server/google/google-auth";
import { getGoogleTokenKey } from "@/features/mail/server/google/google-account-key";
import { isGoogleConfigured } from "@/features/mail/server/google/google-config";
import { getGmailReplyHeaders, parseGmailMessage } from "@/features/mail/server/google/gmail-message-parser";
import { createGmailRawMessage } from "@/features/mail/server/google/gmail-mime";
import { googleTokenRepository } from "@/features/mail/server/google/local-google-token-repository";
import type { MailProvider } from "@/features/mail/services/mail-provider";
import type {
  CreateMailDraftInput,
  ListMessagesOptions,
  MailAccount,
  MailConnectionStatus,
  MailDraft,
  MailMessage,
  MailThread,
} from "@/features/mail/types/mail";

const DEFAULT_MESSAGE_LIMIT = 25;
const MAX_MESSAGE_LIMIT = 100;

export class GoogleMailProvider implements MailProvider {
  readonly type = "google" as const;
  readonly name = "Google Workspace";
  readonly description = "Connexion sécurisée à Gmail avec lecture des messages récents et création de brouillons.";
  readonly isAvailable = true;
  readonly isMock = false;

  constructor(private readonly account: MailAccount) {}

  async connect(): Promise<MailAccount> {
    throw new Error("Utilisez le parcours OAuth Google Workspace pour établir la connexion.");
  }

  async disconnect(): Promise<void> {
    await disconnectGoogleAccount(this.key);
  }

  async getConnectionStatus(): Promise<MailConnectionStatus> {
    const record = await googleTokenRepository.get(this.key);
    if (!isGoogleConfigured()) {
      return {
        provider: this.type,
        state: "error",
        emailAddress: record?.emailAddress ?? this.account.emailAddress,
        connectedAt: record?.connectedAt ?? this.account.connectedAt,
        lastSuccessfulSyncAt: record?.lastSuccessfulSyncAt ?? this.account.lastSuccessfulSyncAt,
        error: "La configuration serveur Google Workspace est incomplète.",
      };
    }
    if (!record) {
      return {
        provider: this.type,
        state: "disconnected",
        emailAddress: this.account.emailAddress,
        connectedAt: this.account.connectedAt,
        lastSuccessfulSyncAt: this.account.lastSuccessfulSyncAt,
        error: "Aucun jeton serveur n’est associé à ce compte.",
      };
    }
    return {
      provider: this.type,
      state: record.lastError ? "error" : "connected",
      emailAddress: record.emailAddress,
      connectedAt: record.connectedAt,
      lastSuccessfulSyncAt: record.lastSuccessfulSyncAt,
      error: record.lastError,
    };
  }

  async testConnection(): Promise<MailConnectionStatus> {
    const result = await testGoogleConnection(this.key);
    return {
      provider: this.type,
      state: "connected",
      emailAddress: result.emailAddress,
      connectedAt: this.account.connectedAt,
      lastSuccessfulSyncAt: this.account.lastSuccessfulSyncAt,
      error: null,
    };
  }

  async listMessages(options: ListMessagesOptions = {}): Promise<MailMessage[]> {
    const limit = clampLimit(options.limit);
    const queries = [
      receivedSinceYesterdayQuery(),
      options.unreadOnly ? "is:unread" : "",
      "-in:spam",
      "-in:trash",
    ].filter(Boolean);
    return this.withGmail(async (gmail, emailAddress) => {
      const list = await gmail.users.messages.list({
        userId: "me",
        maxResults: limit,
        q: queries.join(" "),
      });
      const messages = await Promise.all((list.data.messages ?? []).map(async ({ id }) => {
        if (!id) return null;
        const result = await gmail.users.messages.get({ userId: "me", id, format: "full" });
        return this.withAccountId(parseGmailMessage(result.data, emailAddress));
      }));
      await googleTokenRepository.updateSynchronization(this.key, new Date().toISOString());
      return messages
        .filter((message): message is MailMessage => message !== null)
        .filter((message) => !options.category || message.category === options.category);
    });
  }

  async getMessage(messageId: string): Promise<MailMessage | null> {
    assertGmailId(messageId);
    return this.withGmail(async (gmail, emailAddress) => {
      try {
        const result = await gmail.users.messages.get({ userId: "me", id: messageId, format: "full" });
        return this.withAccountId(parseGmailMessage(result.data, emailAddress));
      } catch (error) {
        if (getHttpStatus(error) === 404) return null;
        throw error;
      }
    });
  }

  async getThread(threadId: string): Promise<MailThread | null> {
    assertGmailId(threadId);
    return this.withGmail(async (gmail, emailAddress) => {
      try {
        const result = await gmail.users.threads.get({ userId: "me", id: threadId, format: "full" });
        const messages = (result.data.messages ?? []).map((message) =>
          this.withAccountId(parseGmailMessage(message, emailAddress)));
        if (!result.data.id || messages.length === 0) return null;
        return {
          id: result.data.id,
          accountId: this.account.id,
          provider: this.type,
          subject: messages[0].subject,
          participants: messages.map((message) => message.from),
          messages,
          lastMessageAt: messages.at(-1)?.receivedAt ?? messages[0].receivedAt,
        };
      } catch (error) {
        if (getHttpStatus(error) === 404) return null;
        throw error;
      }
    });
  }

  async searchMessages(query: string): Promise<MailMessage[]> {
    const normalized = query.trim();
    if (!normalized || normalized.length > 200) throw new Error("La recherche Gmail est invalide.");
    return this.withGmail(async (gmail, emailAddress) => {
      const list = await gmail.users.messages.list({
        userId: "me",
        maxResults: DEFAULT_MESSAGE_LIMIT,
        q: normalized,
      });
      return Promise.all((list.data.messages ?? []).flatMap(({ id }) => id ? [
        gmail.users.messages.get({ userId: "me", id, format: "full" })
          .then((result) => this.withAccountId(parseGmailMessage(result.data, emailAddress))),
      ] : []));
    });
  }

  async createDraft(input: CreateMailDraftInput): Promise<MailDraft> {
    validateDraft(input);
    if (input.replyToMessageId) assertGmailId(input.replyToMessageId);
    if (input.replyToThreadId) assertGmailId(input.replyToThreadId);
    return this.withGmail(async (gmail) => {
      let inReplyTo: string | undefined;
      let references: string | undefined;
      if (input.replyToMessageId) {
        const original = await gmail.users.messages.get({
          userId: "me",
          id: input.replyToMessageId,
          format: "metadata",
          metadataHeaders: ["Message-ID", "References"],
        });
        const replyHeaders = getGmailReplyHeaders(original.data);
        inReplyTo = replyHeaders.messageId;
        references = [replyHeaders.references, replyHeaders.messageId].filter(Boolean).join(" ") || undefined;
      }
      const raw = createGmailRawMessage({
        to: input.to.map((address) => address.email),
        cc: input.cc?.map((address) => address.email),
        bcc: input.bcc?.map((address) => address.email),
        subject: input.subject,
        bodyText: input.bodyText,
        inReplyTo,
        references,
      });
      const result = await gmail.users.drafts.create({
        userId: "me",
        requestBody: { message: { raw, threadId: input.replyToThreadId } },
      });
      if (!result.data.id) throw new Error("Gmail n’a pas retourné l’identifiant du brouillon.");
      const now = new Date().toISOString();
      return {
        id: result.data.id,
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
        threadId: result.data.message?.threadId ?? input.replyToThreadId,
      };
    });
  }

  async archiveMessage(): Promise<void> {
    throw new Error("L’archivage nécessite la portée Gmail Modify et n’est pas disponible dans cette version.");
  }

  private get key() {
    return getGoogleTokenKey(this.account.id);
  }

  private withAccountId(message: MailMessage): MailMessage {
    return { ...message, accountId: this.account.id };
  }

  private async withGmail<T>(
    operation: (gmail: ReturnType<typeof google.gmail>, emailAddress: string) => Promise<T>,
  ): Promise<T> {
    const record = await googleTokenRepository.get(this.key);
    if (!record) throw new Error("Google Workspace n’est pas connecté pour ce compte.");
    try {
      const auth = await getAuthorizedGoogleClient(this.key);
      const result = await operation(google.gmail({ version: "v1", auth: auth as never }), record.emailAddress);
      await googleTokenRepository.updateError(this.key, null);
      return result;
    } catch (error) {
      const message = error instanceof Error && error.message.includes("expiré")
        ? error.message
        : "La communication avec Gmail a échoué. Reconnectez ce compte si le problème persiste.";
      await googleTokenRepository.updateError(this.key, message);
      throw new Error(message);
    }
  }
}

function clampLimit(value?: number): number {
  return Number.isInteger(value)
    ? Math.min(Math.max(value!, 1), MAX_MESSAGE_LIMIT)
    : DEFAULT_MESSAGE_LIMIT;
}

function receivedSinceYesterdayQuery(): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - 1);
  return `after:${date.toISOString().slice(0, 10).replaceAll("-", "/")}`;
}

function assertGmailId(value: string): void {
  if (!/^[A-Za-z0-9_-]{1,200}$/.test(value)) throw new Error("L’identifiant Gmail est invalide.");
}

function validateDraft(input: CreateMailDraftInput): void {
  if (!input.to.length || input.to.length > 20 || !input.to.every((item) => isValidEmail(item.email))) {
    throw new Error("Le destinataire du brouillon est invalide.");
  }
  if (!input.subject.trim() || input.subject.length > 998 || /[\r\n]/.test(input.subject)) {
    throw new Error("L’objet du brouillon est invalide.");
  }
  if (!input.bodyText.trim() || input.bodyText.length > 200_000) {
    throw new Error("Le contenu du brouillon est invalide.");
  }
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && !/[\r\n]/.test(value);
}

function getHttpStatus(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null) return undefined;
  if ("code" in error && typeof error.code === "number") return error.code;
  if ("response" in error && typeof error.response === "object" && error.response
    && "status" in error.response && typeof error.response.status === "number") {
    return error.response.status;
  }
  return undefined;
}
