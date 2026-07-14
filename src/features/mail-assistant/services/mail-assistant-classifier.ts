import type { MailMessage } from "@/features/mail/types/mail";
import type { MailAssistantBrief, MailAssistantClassification } from "@/features/mail-assistant/types/mail-assistant";

export function classifyMailForAssistant(message: MailMessage): MailAssistantClassification {
  const text = `${message.subject} ${message.snippet} ${message.bodyText}`.toLocaleLowerCase("fr");
  const asksQuestion = /\?|pouvez-vous|peux-tu|merci de|confirmer|répondre|quel(?:le)?/.test(text);
  const automated = /no[- ]?reply|automatique|confirmation automatique|accusé de réception/.test(text);
  const urgentWords = /urgent|retard|risque|bloqu|avant midi|aujourd|arrêt|défaillant/.test(text);
  const actionWords = /action|relancer|intervention|replanifier|vérifier|remplacer|impact/.test(text);
  const isUrgent = message.category === "urgent" || message.priority === "high" && urgentWords;
  const requiresReply = message.category === "reply_required" || asksQuestion;
  const suggestsAction = message.category === "action_required" || actionWords;
  if (requiresReply) return { group: isUrgent ? "now" : "reply", reason: asksQuestion ? "Une question ou une confirmation explicite a été détectée." : "Le message est identifié comme nécessitant une réponse.", confidence: 0.9, requiresReply: true, suggestsAction, isUrgent };
  if (isUrgent) return { group: "now", reason: "Un risque, un retard ou une échéance proche est mentionné.", confidence: 0.86, requiresReply: false, suggestsAction, isUrgent: true };
  if (suggestsAction) return { group: "action", reason: "Le contenu suggère une action opérationnelle à préparer.", confidence: 0.84, requiresReply: false, suggestsAction: true, isUrgent: false };
  if (automated) return { group: "no_action", reason: "Message automatique sans question ni demande détectée.", confidence: 0.94, requiresReply: false, suggestsAction: false, isUrgent: false };
  if (message.category === "information") return { group: "information", reason: "Le message apporte une information sans demande explicite.", confidence: 0.85, requiresReply: false, suggestsAction: false, isUrgent: false };
  return { group: "review", reason: "L’intention n’est pas assez claire pour recommander une action avec confiance.", confidence: 0.58, requiresReply: false, suggestsAction: false, isUrgent: false };
}

export function createMailAssistantBrief(classifications: MailAssistantClassification[]): MailAssistantBrief {
  const replies = classifications.filter((item) => item.requiresReply).length;
  const actions = classifications.filter((item) => item.suggestsAction).length;
  const urgent = classifications.filter((item) => item.isUrgent).length;
  const review = classifications.filter((item) => item.group === "review").length;
  const noReply = classifications.filter((item) => !item.requiresReply).length;
  return { newMessages: classifications.length, noReply, replies, actions, urgent, review, explanation: `J’ai utilisé les demandes explicites, les échéances et les signaux de risque. ${review ? `${review} message${review > 1 ? "s restent" : " reste"} à vérifier car la confiance est limitée.` : "Aucun classement ne présente une confiance faible."}` };
}
