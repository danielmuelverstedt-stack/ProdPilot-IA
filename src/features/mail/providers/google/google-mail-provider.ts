import "server-only";

import { google } from "googleapis";
import {
  disconnectGoogleAccount,
  getAuthorizedGoogleClient,
  testGoogleConnection,
} from "@/features/mail/server/google/google-auth";
import { getGoogleTokenKey } from "@/features/mail/server/google/google-account-key";
import { getGoogleConfigurationStatus } from "@/features/mail/server/google/google-config";
import { getGmailReplyHeaders, parseGmailMessage } from "@/features/mail/server/google/gmail-message-parser";
import { createGmailRawMessage } from "@/features/mail/server/google/gmail-mime";
import { buildGmailSearchQuery } from "@/features/mail/providers/google/google-search-query";
import {
  assertGmailId,
  clampGoogleMessageLimit,
  getGoogleHttpStatus,
  receivedSinceYesterdayQuery,
  validateGoogleDraft,
} from "@/features/mail/providers/google/google-mail-validation";
import { googleTokenRepository } from "@/features/mail/server/google/local-google-token-repository";
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
    const configuration = getGoogleConfigurationStatus();
    if (!configuration.isValid) {
      return {
        provider: this.type,
        state: "error",
        emailAddress: record?.emailAddress ?? this.account.emailAddress,
        connectedAt: record?.connectedAt ?? this.account.connectedAt,
        lastSuccessfulSyncAt: record?.lastSuccessfulSyncAt ?? this.account.lastSuccessfulSyncAt,
        error: configuration.error,
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
    const limit = clampGoogleMessageLimit(options.limit);
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
        if (getGoogleHttpStatus(error) === 404) return null;
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
        if (getGoogleHttpStatus(error) === 404) return null;
        throw error;
      }
    });
  }

  async searchMessages(criteria: MailSearchCriteria): Promise<MailMessage[]> {
    const query = buildGmailSearchQuery(criteria);
    if (!query) return [];
    return this.withGmail(async (gmail, emailAddress) => {
      const list = await gmail.users.messages.list({
        userId: "me",
        maxResults: clampGoogleMessageLimit(this.account.settings.maximumMessagesRetrieved),
        q: query,
      });
      return Promise.all((list.data.messages ?? []).flatMap(({ id }) => id ? [
        gmail.users.messages.get({ userId: "me", id, format: "full" })
          .then((result) => this.withAccountId(parseGmailMessage(result.data, emailAddress))),
      ] : []));
    });
  }

  async createDraft(input: CreateMailDraftInput): Promise<MailDraft> {
    validateGoogleDraft(input);
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
      const result = await operation(google.gmail({
        version: "v1",
        auth: auth as never,
        fetchImplementation: globalThis.fetch,
        cache: "no-store",
      }), record.emailAddress);
      await googleTokenRepository.updateError(this.key, null);
      return result;
    } catch (error) {
      const status = getGoogleHttpStatus(error);
      const message = status === 401
        ? "La session Google a expiré ou a été révoquée. Reconnectez ce compte."
        : status === 403
          ? "Google refuse l’accès aux messages. Vérifiez les autorisations Gmail accordées."
          : error instanceof Error && error.message.includes("expiré")
            ? error.message
            : "La communication avec Gmail a échoué. Réessayez dans quelques instants.";
      await googleTokenRepository.updateError(this.key, message);
      throw new Error(message);
    }
  }
}
