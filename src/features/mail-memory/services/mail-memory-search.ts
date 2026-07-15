import type { MailMemoryRepository } from "@/features/mail-memory/repositories/mail-memory-repository";
import type { LocalCommitment, LocalDecision, LocalMailMessage, MailMemoryContext, MailMemorySearchQuery, MailMemorySearchResult, SourceLink } from "@/features/mail-memory/types/mail-memory";

export async function searchMailMemory(repository: MailMemoryRepository, context: MailMemoryContext, query: MailMemorySearchQuery): Promise<MailMemorySearchResult> {
  const normalized = normalize(query.text);
  const queryTerms = normalized.split(" ").filter((term) => term.length > 2 && !STOP_WORDS.has(term));
  const [messages, decisions, commitments, links] = await Promise.all([
    repository.list<LocalMailMessage>("mailMessages", context),
    repository.list<LocalDecision>("mailDecisions", context),
    repository.list<LocalCommitment>("commitments", context),
    repository.list<SourceLink>("sourceLinks", context),
  ]);
  const matchesMessage = (message: LocalMailMessage) => {
    if (query.threadId && message.threadId !== query.threadId) return false;
    if (query.sender && !normalize(`${message.from.name ?? ""} ${message.from.email}`).includes(normalize(query.sender))) return false;
    if (query.recipient && !normalize(message.to.map((item) => `${item.name ?? ""} ${item.email}`).join(" ")).includes(normalize(query.recipient))) return false;
    if (query.dateFrom && message.receivedAt < query.dateFrom) return false;
    if (query.dateTo && message.receivedAt > query.dateTo) return false;
    const haystack = normalize(`${message.from.name ?? ""} ${message.from.email} ${message.to.map((item) => `${item.name ?? ""} ${item.email}`).join(" ")} ${message.subject} ${message.snippet} ${message.cleanedText ?? ""} ${message.attachments.map((item) => item.filename).join(" ")}`);
    return !normalized || queryTerms.every((term) => haystack.includes(term) || message.searchTerms.some((candidate) => candidate.includes(term)));
  };
  const selectedMessages = messages.filter(matchesMessage).sort((a, b) => b.receivedAt.localeCompare(a.receivedAt)).slice(0, query.limit ?? 20);
  const messageIds = new Set(selectedMessages.map((message) => message.id));
  const threadIds = new Set(selectedMessages.map((message) => message.threadId));
  const selectedDecisions = decisions.filter((decision) => (!normalized || normalize(`${decision.title} ${decision.description}`).includes(normalized)) || Boolean(decision.relatedMessageId && messageIds.has(decision.relatedMessageId)) || Boolean(decision.relatedThreadId && threadIds.has(decision.relatedThreadId))).sort(authorityOrder);
  const selectedCommitments = commitments.filter((commitment) => (!normalized || normalize(`${commitment.committedBy} ${commitment.text} ${commitment.stakeholder}`).includes(normalized)) || commitment.sourceLinkIds.some((id) => selectedMessages.some((message) => message.sourceLinkIds.includes(id))));
  const sourceIds = new Set([...selectedMessages.flatMap((message) => message.sourceLinkIds), ...selectedDecisions.flatMap((decision) => decision.sourceLinkIds), ...selectedCommitments.flatMap((commitment) => commitment.sourceLinkIds)]);
  const selectedLinks = links.filter((link) => sourceIds.has(link.id));
  return { messages: selectedMessages, decisions: selectedDecisions, commitments: selectedCommitments, sourceLinks: selectedLinks, orchestrationLevel: selectedMessages.length || selectedDecisions.length || selectedCommitments.length ? 0 : 1, isPossiblyOutdated: selectedMessages.some((message) => message.synchronizationStatus === "stale") };
}

function normalize(value: string): string { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("fr").replace(/\s+/g, " ").trim(); }
function authorityOrder(a: LocalDecision, b: LocalDecision): number { return Number(b.confirmedByUser) - Number(a.confirmedByUser) || b.updatedAt.localeCompare(a.updatedAt); }
const STOP_WORDS = new Set(["retrouve", "montre", "mail", "mails", "discussion", "echanges", "avec", "dans", "sur", "les", "des", "une", "qui", "parlent", "avais", "repondu", "quels", "quel"]);
