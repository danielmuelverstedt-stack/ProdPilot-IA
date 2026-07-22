import { resolveMailReferences } from "@/features/mail-assistant/services/mail-reference-resolver";
import type { MailAssistantCommand, MailAssistantIntent, MailAssistantSessionMessage } from "@/features/mail-assistant/types/mail-assistant";

export function interpretMailAssistantCommand(rawText: string, messages: MailAssistantSessionMessage[], pendingIntent?: MailAssistantIntent): MailAssistantCommand {
  const text = rawText.trim();
  const normalized = text.toLocaleLowerCase("fr");
  const reference = resolveMailReferences(text, messages);
  const isExplicitSend = /\b(envoie|envoyer|expédie|expédier)\b/.test(normalized);
  const isComposeRequest = /\b(écris|écrit|rédige|prépare)\b/.test(normalized) && /\b(mail|e-?mail|courriel)\b/.test(normalized) && !/répond|réponse/.test(normalized);
  let intent: MailAssistantIntent = "summarize_new_mail";
  if (isComposeRequest) intent = "compose_new_mail";
  else if (isExplicitSend) intent = "send_email";
  else if (/brouillon/.test(normalized)) intent = "create_draft";
  else if (/crée|ajoute/.test(normalized) && /action|relance/.test(normalized)) intent = "create_action";
  else if (/ignore/.test(normalized)) intent = "ignore_message";
  else if (/valide|approuve/.test(normalized)) intent = "mark_processed";
  else if (/annule|undo|reviens/.test(normalized)) intent = "undo";
  else if (/refais|redo/.test(normalized)) intent = "redo";
  else if (/termine|fin de session/.test(normalized)) intent = "finish_session";
  else if (/plus court|diplomatique|plus direct|dis plutôt|traduis|tutoie|vouvoie|retire|ajoute que|ne promets/.test(normalized)) intent = "modify_reply";
  else if (/^(ok|oui|d’accord|fais-le)[.!\s]*$/.test(normalized)) intent = pendingIntent ?? "mark_processed";
  const defaultTargets = intent === "compose_new_mail" ? [] : reference.messageIds.length ? reference.messageIds : /les deux/.test(normalized) && intent === "mark_processed" ? messages.filter((message) => message.classification.requiresReply && !message.ignored).slice(0, 2).map((message) => message.id) : targetAllApproved(intent, messages);
  return {
    intent, rawText: text, messageIds: defaultTargets,
    instruction: intent === "modify_reply" || intent === "compose_new_mail" ? text : undefined,
    recipientEmail: intent === "compose_new_mail" ? extractEmail(text) : undefined,
    isExplicitSend, isAmbiguous: intent === "compose_new_mail" ? false : reference.isAmbiguous,
    clarification: intent === "compose_new_mail" ? undefined : reference.clarification,
    isConversationalFallback: intent === "summarize_new_mail",
  };
}

function extractEmail(text: string): string | undefined {
  return text.match(/[^\s<>@]+@[^\s<>@]+\.[^\s<>@.,;]+/)?.[0];
}

function targetAllApproved(intent: MailAssistantIntent, messages: MailAssistantSessionMessage[]) {
  if (intent === "create_draft" || intent === "send_email") return messages.filter((message) => message.classification.requiresReply && !message.ignored).map((message) => message.id);
  if (intent === "mark_processed") return messages.filter((message) => message.classification.requiresReply && !message.ignored).slice(0, 1).map((message) => message.id);
  return [];
}
