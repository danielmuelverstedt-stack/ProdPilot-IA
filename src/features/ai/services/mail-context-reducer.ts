import type { MailAiMessageContext } from "@/features/ai/types/mail-ai";
import type { MailAiOperationType, MailAiTokenBudget } from "@/features/ai/types/ai";
import { estimateTokens } from "@/features/ai/config/ai-token-budget";

export type MailThreadContextMode = "selected_message_only" | "recent_thread_messages" | "full_thread_when_short";

export interface ReducedMailContext {
  message: MailAiMessageContext;
  thread: MailAiMessageContext[];
  estimatedInputTokens: number;
  wasTruncated: boolean;
  reductionNotes: string[];
  transferSummary: {
    fieldsTransferred: string[];
    includesMessageBody: true;
    threadMessageCount: number;
    attachmentMetadataCount: number;
    includesBinaryAttachments: false;
    includesOAuthTokens: false;
    includesSecrets: false;
  };
}

export function reduceMailContext(input: {
  operation: MailAiOperationType;
  selected: MailAiMessageContext;
  thread: MailAiMessageContext[];
  budget: MailAiTokenBudget;
  mode?: MailThreadContextMode;
  includeAttachmentMetadata: boolean;
}): ReducedMailContext {
  const notes: string[] = [];
  const selected = reduceMessage(input.selected, input.budget, input.includeAttachmentMetadata, notes);
  if (!selected.bodyText.trim()) throw new Error("Le message sélectionné ne contient aucun texte exploitable.");

  const mode = input.operation === "mail_rewrite" ? "selected_message_only" : input.mode ?? "recent_thread_messages";
  const candidates = deduplicateMessages(input.thread)
    .filter((message) => message.id !== selected.id)
    .sort((first, second) => new Date(first.receivedAt).getTime() - new Date(second.receivedAt).getTime());
  const maximum = Math.max(0, input.budget.maximumThreadMessages - 1);
  let chosen = mode === "selected_message_only" ? [] : candidates.slice(-maximum);
  if (mode === "full_thread_when_short" && candidates.length <= maximum) chosen = candidates;
  if (chosen.length < candidates.length) notes.push("Des messages anciens ou répétés du fil ont été omis.");
  let thread = chosen.map((message) => reduceMessage(message, input.budget, input.includeAttachmentMetadata, notes));

  let serialized = serializeForEstimate(selected, thread);
  while (estimateTokens(serialized) > input.budget.maximumInputTokens && thread.length > 0) {
    thread = thread.slice(1);
    notes.push("Le fil a été réduit pour respecter le budget de contexte.");
    serialized = serializeForEstimate(selected, thread);
  }
  if (estimateTokens(serialized) > input.budget.maximumInputTokens) {
    const maximumCharacters = Math.max(1_000, input.budget.maximumInputTokens * 3);
    selected.bodyText = truncate(selected.bodyText, maximumCharacters, notes, "Le message principal a été tronqué pour respecter le budget.");
    serialized = serializeForEstimate(selected, thread);
  }
  const estimatedInputTokens = estimateTokens(serialized);
  if (estimatedInputTokens > input.budget.maximumInputTokens) {
    throw new Error("Le message reste trop volumineux après réduction du contexte.");
  }
  return {
    message: selected,
    thread,
    estimatedInputTokens,
    wasTruncated: notes.length > 0,
    reductionNotes: [...new Set(notes)],
    transferSummary: {
      fieldsTransferred: ["objet", "expéditeur", "destinataires utiles", "date", "corps texte réduit", ...(thread.length ? ["contexte récent du fil"] : []), ...(selected.attachmentMetadata.length ? ["métadonnées de pièces jointes"] : [])],
      includesMessageBody: true,
      threadMessageCount: thread.length,
      attachmentMetadataCount: selected.attachmentMetadata.length + thread.reduce((sum, item) => sum + item.attachmentMetadata.length, 0),
      includesBinaryAttachments: false,
      includesOAuthTokens: false,
      includesSecrets: false,
    },
  };
}

function reduceMessage(message: MailAiMessageContext, budget: MailAiTokenBudget, includeAttachments: boolean, notes: string[]): MailAiMessageContext {
  let body = message.bodyText.replace(/https?:\/\/[^\s]*(?:utm_(?:source|medium|campaign)|mc_cid|gclid|tracking)[^\s]*/gi, "[lien de suivi retiré]");
  body = body.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  body = stripQuotedHistory(body, budget.maximumQuotedHistoryCharacters, notes);
  body = stripLongFooter(body, notes);
  body = stripSignature(body, notes);
  body = truncate(body, budget.maximumCharactersPerMessage, notes, "Un corps de message trop long a été tronqué.");
  const attachments = includeAttachments
    ? message.attachmentMetadata.slice(0, budget.maximumAttachmentMetadataEntries)
    : [];
  if (attachments.length < message.attachmentMetadata.length) notes.push("Des métadonnées de pièces jointes ont été omises.");
  return { ...message, bodyText: body, attachmentMetadata: attachments };
}

function stripQuotedHistory(body: string, maximum: number, notes: string[]) {
  const marker = /\n(?:>|Le .+ a écrit\s*:|On .+ wrote:|Van:|From:|De:)\s*/i.exec(body);
  if (!marker) return body;
  const quoted = body.slice(marker.index);
  const kept = maximum > 0 ? quoted.slice(0, maximum) : "";
  if (kept.length < quoted.length) notes.push("L’historique cité répétitif a été réduit.");
  return `${body.slice(0, marker.index).trim()}${kept ? `\n\n${kept}` : ""}`;
}

function stripLongFooter(body: string, notes: string[]) {
  const marker = /\n(?:_{5,}|-{5,}|confidentiality notice|ce message et ses annexes|dit bericht is vertrouwelijk)/i.exec(body);
  if (!marker || body.length - marker.index < 800) return body;
  notes.push("Un long pied de page légal a été omis.");
  return body.slice(0, marker.index).trim();
}

function stripSignature(body: string, notes: string[]) {
  const marker = /\n(?:cordialement|bien à vous|met vriendelijke groet|best regards),?\s*\n/i.exec(body);
  if (!marker || body.length - marker.index > 800) return body;
  notes.push("Une signature évidente a été omise du contexte.");
  return body.slice(0, marker.index).trim();
}

function truncate(value: string, maximum: number, notes: string[], note: string) {
  if (value.length <= maximum) return value;
  notes.push(note);
  return `${value.slice(0, Math.max(0, maximum - 15)).trimEnd()}\n[texte tronqué]`;
}

function deduplicateMessages(messages: MailAiMessageContext[]) {
  const fingerprints = new Set<string>();
  return messages.filter((message) => {
    const fingerprint = `${message.subject}|${message.sender}|${message.bodyText.replace(/\s+/g, " ").trim()}`;
    if (fingerprints.has(fingerprint)) return false;
    fingerprints.add(fingerprint);
    return true;
  });
}

function serializeForEstimate(message: MailAiMessageContext, thread: MailAiMessageContext[]) {
  return JSON.stringify({ message, thread });
}
