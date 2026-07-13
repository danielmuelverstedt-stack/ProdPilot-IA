import "server-only";

import type { gmail_v1 } from "googleapis";
import type { MailAddress, MailAttachment, MailMessage } from "@/features/mail/types/mail";

type MessagePart = gmail_v1.Schema$MessagePart;

export function parseGmailMessage(message: gmail_v1.Schema$Message, accountEmail: string): MailMessage {
  if (!message.id || !message.threadId) throw new Error("Réponse Gmail incomplète.");
  const headers = new Map((message.payload?.headers ?? []).map((header) => [header.name?.toLowerCase() ?? "", header.value ?? ""]));
  const from = parseAddresses(headers.get("from"))[0] ?? { email: "adresse-inconnue" };
  const to = parseAddresses(headers.get("to"));
  const cc = parseAddresses(headers.get("cc"));
  const bodyText = extractSafeBody(message.payload);
  const labels = new Set(message.labelIds ?? []);
  const priority = labels.has("IMPORTANT") || labels.has("STARRED") ? "high" : "normal";
  const category = priority === "high" ? "urgent" : labels.has("UNREAD") ? "reply_required" : "information";
  const receivedAt = parseReceivedAt(message.internalDate, headers.get("date"));
  const snippet = (message.snippet ?? "").trim();

  return {
    id: message.id,
    accountId: accountEmail,
    provider: "google",
    threadId: message.threadId,
    from,
    to,
    cc,
    subject: headers.get("subject")?.trim() || "Sans objet",
    snippet,
    bodyText,
    summary: snippet || truncate(bodyText, 240) || "Aucun aperçu disponible.",
    proposedAction: category === "urgent" ? "Ouvrir et vérifier ce message prioritaire." : category === "reply_required" ? "Vérifier si une réponse est nécessaire." : "Lire pour information.",
    category,
    priority,
    receivedAt,
    isRead: !labels.has("UNREAD"),
    isArchived: !labels.has("INBOX"),
    attachments: collectAttachments(message.payload),
  };
}

export function getGmailReplyHeaders(message: gmail_v1.Schema$Message) {
  const headers = new Map((message.payload?.headers ?? []).map((header) => [header.name?.toLowerCase() ?? "", header.value ?? ""]));
  return {
    messageId: headers.get("message-id")?.trim(),
    references: headers.get("references")?.trim(),
  };
}

function extractSafeBody(payload?: MessagePart): string {
  if (!payload) return "";
  const plain = findBodyPart(payload, "text/plain");
  if (plain) return normalizeText(decodeBase64Url(plain.body?.data));
  const html = findBodyPart(payload, "text/html");
  if (html) return htmlToText(decodeBase64Url(html.body?.data));
  if (payload.body?.data) {
    const decoded = decodeBase64Url(payload.body.data);
    return payload.mimeType === "text/html" ? htmlToText(decoded) : normalizeText(decoded);
  }
  return "";
}

function findBodyPart(part: MessagePart, mimeType: string): MessagePart | null {
  if (part.mimeType === mimeType && !part.filename && part.body?.data) return part;
  for (const child of part.parts ?? []) {
    const found = findBodyPart(child, mimeType);
    if (found) return found;
  }
  return null;
}

function collectAttachments(payload?: MessagePart): MailAttachment[] {
  const attachments: MailAttachment[] = [];
  function visit(part?: MessagePart) {
    if (!part) return;
    if (part.filename && part.body?.attachmentId) {
      const disposition = part.headers?.find((header) => header.name?.toLowerCase() === "content-disposition")?.value ?? "";
      attachments.push({
        id: part.body.attachmentId,
        filename: part.filename,
        mimeType: part.mimeType ?? "application/octet-stream",
        sizeBytes: part.body.size ?? 0,
        isInline: disposition.toLowerCase().includes("inline"),
      });
    }
    part.parts?.forEach(visit);
  }
  visit(payload);
  return attachments;
}

function parseAddresses(value?: string): MailAddress[] {
  if (!value) return [];
  const matches = [...value.matchAll(/(?:(?:"([^"]+)"|([^,<]+))\s*)?<([^>]+)>|([^,\s]+@[^,\s]+)/g)];
  return matches.map((match) => ({
    name: (match[1] ?? match[2])?.trim() || undefined,
    email: (match[3] ?? match[4]).trim().toLowerCase(),
  }));
}

function decodeBase64Url(value?: string | null): string {
  if (!value) return "";
  return Buffer.from(value.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
}

function htmlToText(html: string): string {
  return normalizeText(html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code))));
}

function normalizeText(value: string): string {
  return value.replace(/\r\n/g, "\n").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

function parseReceivedAt(internalDate?: string | null, headerDate?: string): string {
  const timestamp = internalDate ? Number(internalDate) : Date.parse(headerDate ?? "");
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : new Date(0).toISOString();
}

function truncate(value: string, length: number): string {
  return value.length > length ? `${value.slice(0, length - 1).trim()}…` : value;
}
