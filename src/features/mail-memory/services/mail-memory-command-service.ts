"use client";

import { randomLocalId } from "@/features/mail-memory/services/random-local-id";
import { getBrowserMailMemoryRepository } from "@/features/mail-memory/services/mail-memory-service";
import { searchMailMemory } from "@/features/mail-memory/services/mail-memory-search";
import { listMailTodo } from "@/features/mail-memory/services/mail-memory-todo";
import type { LocalDecision, MailMemoryContext, PreparedMeetingRequest, SourceLink } from "@/features/mail-memory/types/mail-memory";
import type { MailAssistantSession } from "@/features/mail-assistant/types/mail-assistant";

export interface LocalMemoryCommandResult { handled: boolean; text?: string; sourceLinks?: SourceLink[]; level?: 0 | 1 }

export async function executeLocalMemoryCommand(text: string, session: MailAssistantSession, context: MailMemoryContext): Promise<LocalMemoryCommandResult> {
  const repository = getBrowserMailMemoryRepository(); const normalized = text.toLocaleLowerCase("fr");
  if (/que dois-je faire|qu.est-ce qui est en retard|quels mails nécessitent encore|qu.est-ce que j.ai promis/.test(normalized)) {
    const items = await listMailTodo(repository, context); const visible = items.slice(0, 8);
    return { handled: true, level: 0, text: visible.length ? `Voici ce qui reste à traiter localement :\n${visible.map((item) => `• ${item.title}${item.isOverdue ? " — en retard" : ""}`).join("\n")}` : "Aucun suivi Mail local nécessite votre attention." };
  }
  if (/retrouve|montre (?:les )?échanges|quels mails parlent|qu.est-ce que j.avais répondu|fournisseurs attendent/.test(normalized)) {
    const result = await searchMailMemory(repository, context, { text, limit: 10 });
    return { handled: true, level: result.orchestrationLevel, sourceLinks: result.sourceLinks, text: result.messages.length ? `${result.messages.length} résultat${result.messages.length > 1 ? "s" : ""} trouvé${result.messages.length > 1 ? "s" : ""} dans la mémoire locale :\n${result.messages.map((message) => `• ${message.from.name ?? message.from.email} — ${message.subject}`).join("\n")}` : "Je n’ai trouvé aucun message correspondant dans la mémoire locale. Une synchronisation peut être nécessaire." };
  }
  if (/planifie|prépare|propose/.test(normalized) && /réunion/.test(normalized)) {
    const now = new Date().toISOString(); const current = session.messages.find((message) => !message.ignored && !message.processed) ?? session.messages[0];
    const sourceLinks = current ? (await repository.list<SourceLink>("sourceLinks", context)).filter((link) => link.externalId === current.id || link.externalId === current.threadId).map((link) => link.id) : [];
    const request: PreparedMeetingRequest = { ...context, id: randomLocalId("meeting"), sourceId: current?.threadId ?? session.id, createdAt: now, updatedAt: now, synchronizationStatus: "local", title: current ? `Réunion — ${current.subject}` : "Réunion à préparer", purpose: current?.summary || current?.snippet || "Clarifier le sujet de la conversation", suggestedParticipants: current ? [current.from.email] : [], durationMinutes: null, preferredDateRange: { from: null, to: null }, sourceLinkIds: sourceLinks, agenda: current ? [current.subject] : [], status: "awaiting_information" };
    await repository.save("meetingRequests", request);
    return { handled: true, level: 0, text: "J’ai préparé la réunion et conservé le lien vers le mail d’origine. Indiquez la date souhaitée et confirmez les participants avant toute planification externe." };
  }
  if (/retiens (?:cette )?décision|mémorise (?:cette )?décision/.test(normalized)) {
    const current = session.messages.find((message) => !message.ignored && !message.processed) ?? session.messages[0]; if (!current) return { handled: true, level: 0, text: "Aucun mail courant ne permet de rattacher cette décision." };
    const now = new Date().toISOString(); const links = (await repository.list<SourceLink>("sourceLinks", context)).filter((link) => link.externalId === current.id || link.externalId === current.threadId).map((link) => link.id);
    const decision: LocalDecision = { ...context, id: randomLocalId("decision"), sourceId: current.threadId, createdAt: now, updatedAt: now, synchronizationStatus: "local", title: current.subject, description: session.conversation.at(-1)?.text ?? current.summary, decidedAt: now, participants: [current.from.email], status: "confirmed", confirmedByUser: true, confidence: 1, sourceLinkIds: links, relatedMessageId: current.id, relatedThreadId: current.threadId, authority: "user_confirmed" };
    await repository.save("mailDecisions", decision); return { handled: true, level: 0, text: "Cette décision est maintenant confirmée dans la mémoire locale, avec le lien vers sa source." };
  }
  return { handled: false };
}
