import { resolveMailReferences } from "@/features/mail-assistant/services/mail-reference-resolver";
import type { MailAssistantCommand, MailAssistantIntent, MailAssistantSessionMessage } from "@/features/mail-assistant/types/mail-assistant";

export function interpretMailAssistantCommand(rawText: string, messages: MailAssistantSessionMessage[], pendingIntent?: MailAssistantIntent): MailAssistantCommand {
  const text = rawText.trim();
  const normalized = text.toLocaleLowerCase("fr");
  const reference = resolveMailReferences(text, messages);
  const isExplicitSend = /\b(envoie|envoyer|expédie|expédier)\b/.test(normalized);
  let intent: MailAssistantIntent = "summarize_new_mail";
  if (isExplicitSend) intent = "send_email";
  else if (/brouillon/.test(normalized)) intent = "create_draft";
  else if (/crée|ajoute/.test(normalized) && /action|relance/.test(normalized)) intent = "create_action";
  else if (/ignore/.test(normalized)) intent = "ignore_message";
  else if (/annule|undo|reviens/.test(normalized)) intent = "undo";
  else if (/refais|redo/.test(normalized)) intent = "redo";
  else if (/termine|fin de session/.test(normalized)) intent = "finish_session";
  else if (/plus court|diplomatique|plus direct|dis plutôt|traduis|tutoie|vouvoie|retire|ajoute que|ne promets/.test(normalized)) intent = "modify_reply";
  else if (/^(ok|oui|d’accord|fais-le)[.!\s]*$/.test(normalized) && pendingIntent) intent = pendingIntent;
  const defaultTargets = reference.messageIds.length ? reference.messageIds : targetAllApproved(intent, messages);
  return { intent, rawText: text, messageIds: defaultTargets, instruction: intent === "modify_reply" ? text : undefined, isExplicitSend, isAmbiguous: reference.isAmbiguous, clarification: reference.clarification };
}

function targetAllApproved(intent: MailAssistantIntent, messages: MailAssistantSessionMessage[]) {
  if (intent === "create_draft" || intent === "send_email") return messages.filter((message) => message.classification.requiresReply && !message.ignored).map((message) => message.id);
  return [];
}
