"use client";

import { createHash } from "@/features/mail-memory/services/stable-fingerprint";
import { IndexedDbMailMemoryAdapter } from "@/features/mail-memory/repositories/indexeddb-mail-memory-adapter";
import { AdapterMailMemoryRepository } from "@/features/mail-memory/repositories/mail-memory-repository";
import { createMailSourceLink } from "@/features/mail-memory/services/source-link-resolver";
import type { LocalAssistantSession, LocalMailMessage, MailMemoryContext, MailMemorySettings } from "@/features/mail-memory/types/mail-memory";
import type { MailAssistantSession } from "@/features/mail-assistant/types/mail-assistant";

let repository: AdapterMailMemoryRepository | null = null;

export function getBrowserMailMemoryRepository(): AdapterMailMemoryRepository {
  repository ??= new AdapterMailMemoryRepository(new IndexedDbMailMemoryAdapter());
  return repository;
}

export async function persistMailAssistantSession(session: MailAssistantSession, context: MailMemoryContext, settings: MailMemorySettings, accountEmail: string): Promise<void> {
  if (!settings.enabled || typeof indexedDB === "undefined") return;
  const memory = getBrowserMailMemoryRepository();
  if (settings.indexSynchronizedMails) {
    for (const message of session.messages) {
      const messageLink = createMailSourceLink(context, { externalId: message.id, parentExternalId: message.threadId, displayName: message.subject, sourceType: "mail", accountEmail });
      const threadLink = createMailSourceLink(context, { externalId: message.threadId, displayName: message.subject, sourceType: "thread", accountEmail });
      if (settings.keepSourceLinks) { await memory.save("sourceLinks", messageLink); await memory.save("sourceLinks", threadLink); }
      const attachments = message.attachments.map((attachment) => {
        const attachmentLink = createMailSourceLink(context, { externalId: attachment.id, parentExternalId: message.id, displayName: attachment.filename, sourceType: "attachment", accountEmail });
        if (settings.keepSourceLinks) void memory.save("sourceLinks", attachmentLink);
        return { attachmentId: attachment.id, sourceMessageId: message.id, provider: message.provider, filename: sanitizeText(attachment.filename), mimeType: sanitizeText(attachment.mimeType), approximateSizeBytes: attachment.sizeBytes, sourceLinkId: attachmentLink.id, accessState: attachmentLink.accessState };
      });
      const cleanedText = settings.storeCleanedMessageText ? cleanMessageText(message.bodyText) : undefined;
      const record: LocalMailMessage = {
        ...context,
        id: contextualId(context, "message", message.id), sourceId: message.id,
        createdAt: message.receivedAt, updatedAt: new Date().toISOString(), synchronizationStatus: "synchronized",
        threadId: message.threadId, from: message.from, to: message.to, cc: message.cc,
        subject: sanitizeText(message.subject), receivedAt: message.receivedAt, cleanedText,
        snippet: sanitizeText(message.snippet), labels: (message.labels ?? []).map(sanitizeText), isRead: message.isRead,
        isImportant: Boolean(message.isImportant), contentFingerprint: createHash(`${message.subject}\n${cleanedText ?? message.snippet}`),
        synchronizedAt: new Date().toISOString(), attachments, sourceLinkIds: [messageLink.id, threadLink.id],
        searchTerms: buildSearchTerms(message.subject, message.from.email, message.from.name ?? "", cleanedText ?? message.snippet, attachments.map((item) => item.filename).join(" ")),
      };
      await memory.save("mailMessages", record);
    }
  }
  if (settings.storeSessionHistory) await memory.save("assistantSessions", toLocalSession(session, context));
  if (settings.storeSessionHistory) {
    const now = new Date().toISOString();
    for (const reply of session.replies) await memory.save("replyProposals", { ...context, id: contextualId(context, "reply", `${session.id}:${reply.messageId}`), sourceId: reply.messageId, createdAt: reply.versions[0]?.createdAt ?? now, updatedAt: now, synchronizationStatus: "local", sessionId: session.id, messageId: reply.messageId, subject: reply.subject, status: reply.status, versions: reply.versions.map((version) => ({ ...version, bodyText: sanitizeText(version.bodyText) })), sourceLinkIds: [] });
    for (const audit of session.audits) await memory.save("assistantAuditEvents", { ...context, id: contextualId(context, "audit", audit.id), sourceId: audit.id, createdAt: audit.createdAt, updatedAt: now, synchronizationStatus: "local", type: audit.type, messageIds: audit.messageIds, outcome: audit.outcome, detail: audit.detail ? sanitizeText(audit.detail) : undefined });
    if (session.lastExecutedCommand) await memory.save("assistantCommands", { ...context, id: contextualId(context, "command", `${session.id}:${session.conversation.at(-2)?.id ?? now}`), sourceId: session.id, createdAt: now, updatedAt: now, synchronizationStatus: "local", intent: session.lastExecutedCommand.intent, text: sanitizeText(session.lastExecutedCommand.rawText), messageIds: session.lastExecutedCommand.messageIds });
    for (const messageId of session.draftsCreated) await memory.save("draftReferences", { ...context, id: contextualId(context, "draft", `${session.id}:${messageId}`), sourceId: messageId, createdAt: now, updatedAt: now, synchronizationStatus: "local", sessionId: session.id, messageId, providerDraftId: null, status: "prepared", sourceLinkIds: [] });
  }
}

function toLocalSession(session: MailAssistantSession, context: MailMemoryContext): LocalAssistantSession {
  const now = new Date().toISOString();
  return { ...context, id: contextualId(context, "session", session.id), sourceId: session.id, createdAt: session.startedAt, updatedAt: now, synchronizationStatus: "local", status: session.status === "finished" ? "finished" : "ready", startedAt: session.startedAt, endedAt: session.endedAt, referencedMessageIds: session.messages.map((message) => message.id), decisionsTaken: session.replies.filter((reply) => reply.status === "approved").map((reply) => reply.messageId), draftReferenceIds: session.draftsCreated, actionIds: session.actionsCreated, ignoredMessageIds: session.messages.filter((message) => message.ignored).map((message) => message.id), unresolvedItems: session.messages.filter((message) => !message.processed && !message.ignored).map((message) => message.id), summary: session.conversation.at(-1)?.text ?? "", conversation: session.conversation.map((entry) => ({ ...entry, text: sanitizeText(entry.text) })) };
}

function contextualId(context: MailMemoryContext, kind: string, id: string): string { return `${context.companyId}:${context.userId}:${context.accountId}:${context.mode}:${kind}:${id}`; }
function sanitizeText(value: string): string { return value.replace(/<[^>]*>/g, " ").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").replace(/\s+/g, " ").trim(); }
function cleanMessageText(value: string): string { return sanitizeText(value).replace(/https?:\/\/\S*(?:utm_|tracking)\S*/gi, "").slice(0, 20_000); }
function buildSearchTerms(...values: string[]): string[] { return Array.from(new Set(values.flatMap((value) => sanitizeText(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("fr").split(/[^a-z0-9@._-]+/).filter((term) => term.length > 1)))); }
