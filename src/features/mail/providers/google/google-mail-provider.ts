import "server-only";

import { google } from "googleapis";
import {
  disconnectGoogleAccount,
  getAuthorizedGoogleClient,
  getGooglePermissionStatus,
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
  validateGoogleDraft,
} from "@/features/mail/providers/google/google-mail-validation";
import { googleTokenRepository } from "@/features/mail/server/google/local-google-token-repository";
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

let labelCreationQueue: Promise<void> = Promise.resolve();

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
    return this.withGmail(async (gmail, emailAddress) => {
      const ids = await listMessageIds(gmail, {
        limit,
        retrieveAll: options.retrieveAll === true,
        pageToken: options.cursor,
        labelIds: ["INBOX"],
        query: options.unreadOnly ? "is:unread" : undefined,
      });
      const messages = await getMessagesInBatches(gmail, ids, emailAddress, (message) => this.withAccountId(message));
      await googleTokenRepository.updateSynchronization(this.key, new Date().toISOString());
      return messages
        .filter((message) => !options.category || message.category === options.category);
    });
  }

  async getMailboxStatistics(): Promise<MailboxStatistics> {
    return this.withGmail(async (gmail) => {
      const [profile, inbox] = await Promise.all([
        gmail.users.getProfile({ userId: "me" }),
        gmail.users.labels.get({ userId: "me", id: "INBOX" }),
      ]);
      return {
        inboxMessages: inbox.data.messagesTotal ?? 0,
        inboxThreads: inbox.data.threadsTotal ?? 0,
        unreadInboxMessages: inbox.data.messagesUnread ?? 0,
        totalMessages: profile.data.messagesTotal ?? null,
        historyId: profile.data.historyId ?? null,
      };
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
      const ids = await listMessageIds(gmail, {
        limit: clampGoogleMessageLimit(this.account.settings.maximumMessagesRetrieved),
        retrieveAll: false,
        query,
      });
      return getMessagesInBatches(gmail, ids, emailAddress, (message) => this.withAccountId(message));
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

  async archiveMessage(messageId: string): Promise<void> {
    await this.modifyLabels({
      messageIds: [messageId],
      target: "message",
      addLabelIds: [],
      removeLabelIds: ["INBOX"],
    });
  }

  async getManagementPermission(): Promise<{ canModifyMail: boolean; reconnectRequired: boolean }> {
    const permission = await getGooglePermissionStatus(this.key);
    return { canModifyMail: permission.canModifyMail, reconnectRequired: !permission.canModifyMail };
  }

  async listLabels(): Promise<MailProviderLabel[]> {
    return this.withGmail(async (gmail) => {
      const result = await gmail.users.labels.list({ userId: "me" });
      return (result.data.labels ?? []).flatMap((label) => label.id && label.name ? [{
        id: label.id,
        name: label.name,
        type: label.type === "system" ? "system" as const : "user" as const,
      }] : []);
    });
  }

  async ensureLabels(names: string[]): Promise<MailProviderLabel[]> {
    await this.assertManagementPermission();
    const operation = labelCreationQueue.catch(() => undefined).then(() => this.ensureLabelsUnlocked(names));
    labelCreationQueue = operation.then(() => undefined, () => undefined);
    return operation;
  }

  private async ensureLabelsUnlocked(names: string[]): Promise<MailProviderLabel[]> {
    const existing = await this.listLabels();
    const byName = new Map(existing.map((label) => [label.name, label]));
    for (const name of [...new Set(names)]) {
      if (byName.has(name)) continue;
      const created = await this.withGmail(async (gmail) => gmail.users.labels.create({
        userId: "me",
        requestBody: { name, labelListVisibility: "labelShow", messageListVisibility: "show" },
      }));
      if (!created.data.id || !created.data.name) throw new Error(`Gmail n’a pas confirmé la création du libellé « ${name} ».`);
      byName.set(name, { id: created.data.id, name: created.data.name, type: "user" });
    }
    return names.map((name) => byName.get(name)).filter((label): label is MailProviderLabel => Boolean(label));
  }

  async modifyLabels(input: MailLabelMutation): Promise<MailMessage[]> {
    await this.assertManagementPermission();
    const messageIds = [...new Set(input.messageIds)];
    if (!messageIds.length || messageIds.length > 1000) throw new Error("La sélection de messages Gmail est invalide.");
    messageIds.forEach(assertGmailId);
    input.addLabelIds.forEach(assertLabelId);
    input.removeLabelIds.forEach(assertLabelId);
    if (input.target === "thread") {
      if (!input.threadId) throw new Error("Le fil Gmail ciblé est invalide.");
      assertGmailId(input.threadId);
      await this.withGmail(async (gmail) => gmail.users.threads.modify({
        userId: "me",
        id: input.threadId,
        requestBody: { addLabelIds: input.addLabelIds, removeLabelIds: input.removeLabelIds },
      }));
      return (await this.getThread(input.threadId))?.messages ?? [];
    }
    await this.withGmail(async (gmail) => {
      if (messageIds.length === 1) {
        await gmail.users.messages.modify({
          userId: "me",
          id: messageIds[0],
          requestBody: { addLabelIds: input.addLabelIds, removeLabelIds: input.removeLabelIds },
        });
      } else {
        await gmail.users.messages.batchModify({
          userId: "me",
          requestBody: { ids: messageIds, addLabelIds: input.addLabelIds, removeLabelIds: input.removeLabelIds },
        });
      }
    });
    const messages = await Promise.all(messageIds.map((id) => this.getMessage(id)));
    return messages.filter((message): message is MailMessage => message !== null);
  }

  private get key() {
    return getGoogleTokenKey(this.account.id);
  }

  private withAccountId(message: MailMessage): MailMessage {
    return { ...message, accountId: this.account.id };
  }

  private async assertManagementPermission(): Promise<void> {
    if (!(await getGooglePermissionStatus(this.key)).canModifyMail) {
      throw new Error("Une nouvelle autorisation Google est nécessaire pour classer et archiver les mails.");
    }
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

async function listMessageIds(
  gmail: ReturnType<typeof google.gmail>,
  input: { limit: number; retrieveAll: boolean; pageToken?: string; labelIds?: string[]; query?: string },
): Promise<string[]> {
  const ids: string[] = [];
  let pageToken = input.pageToken;
  do {
    const remaining = input.retrieveAll ? 500 : Math.max(1, input.limit - ids.length);
    const page = await gmail.users.messages.list({
      userId: "me",
      maxResults: Math.min(500, remaining),
      pageToken,
      labelIds: input.labelIds,
      q: input.query,
      includeSpamTrash: false,
    });
    ids.push(...(page.data.messages ?? []).flatMap(({ id }) => id ? [id] : []));
    pageToken = page.data.nextPageToken ?? undefined;
  } while (pageToken && (input.retrieveAll || ids.length < input.limit));
  return input.retrieveAll ? ids : ids.slice(0, input.limit);
}

async function getMessagesInBatches(
  gmail: ReturnType<typeof google.gmail>,
  ids: string[],
  emailAddress: string,
  withAccountId: (message: MailMessage) => MailMessage,
): Promise<MailMessage[]> {
  const messages: MailMessage[] = [];
  for (let index = 0; index < ids.length; index += 10) {
    const batch = await Promise.all(ids.slice(index, index + 10).map(async (id) => {
      const result = await gmail.users.messages.get({ userId: "me", id, format: "full" });
      return withAccountId(parseGmailMessage(result.data, emailAddress));
    }));
    messages.push(...batch);
  }
  return messages;
}

function assertLabelId(value: string): void {
  if (!/^(?:[A-Z][A-Z0-9_]*|Label_[A-Za-z0-9_-]+)$/.test(value)) {
    throw new Error("Un identifiant de libellé Gmail est invalide.");
  }
}
