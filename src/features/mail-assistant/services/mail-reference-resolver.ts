import type { MailAssistantSessionMessage } from "@/features/mail-assistant/types/mail-assistant";

export interface MailReferenceResolution { messageIds: string[]; isAmbiguous: boolean; clarification?: string }

export function resolveMailReferences(text: string, messages: MailAssistantSessionMessage[]): MailReferenceResolution {
  const normalized = text.toLocaleLowerCase("fr");
  const ordinal = normalized.match(/(?:mail\s+)?(?:n[°o]\s*)?(\d+)/)?.[1];
  const wordOrdinals: Array<[RegExp, number]> = [[/\bpremier/, 1], [/\bdeuxième|\bsecond/, 2], [/\btroisième/, 3], [/\bquatrième/, 4], [/\bcinquième/, 5]];
  const number = ordinal ? Number(ordinal) : wordOrdinals.find(([pattern]) => pattern.test(normalized))?.[1];
  if (number) {
    const found = messages.find((message) => message.sessionNumber === number);
    return found ? { messageIds: [found.id], isAmbiguous: false } : { messageIds: [], isAmbiguous: true, clarification: `Je ne trouve pas de message n° ${number} dans cette session.` };
  }
  if (/les deux urgents|tous les urgents/.test(normalized)) return selected(messages.filter((message) => message.classification.isUrgent), "Plusieurs groupes de messages urgents correspondent.");
  const candidates = messages.filter((message) => {
    const haystack = `${message.from.name ?? ""} ${message.from.email} ${message.subject} ${message.attachments.map((item) => item.filename).join(" ")}`.toLocaleLowerCase("fr");
    const meaningful = normalized.split(/\s+/).filter((word) => word.length >= 4 && !REFERENCE_STOP_WORDS.has(word));
    return meaningful.some((word) => haystack.includes(word));
  });
  if (candidates.length) return selected(candidates, "Plusieurs messages correspondent. Lequel souhaitez-vous traiter ?");
  return { messageIds: [], isAmbiguous: false };
}

function selected(messages: MailAssistantSessionMessage[], clarification: string): MailReferenceResolution {
  return messages.length === 1 ? { messageIds: [messages[0].id], isAmbiguous: false } : messages.length > 1 ? { messageIds: [], isAmbiguous: true, clarification } : { messageIds: [], isAmbiguous: false };
}
const REFERENCE_STOP_WORDS = new Set(["pour", "mail", "message", "celui", "celle", "avec", "reçu", "matin", "dernier", "fais", "plus", "crée", "prépare"]);
