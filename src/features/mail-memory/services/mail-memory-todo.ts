import type { MailMemoryRepository } from "@/features/mail-memory/repositories/mail-memory-repository";
import type { LocalAssistantSession, LocalCommitment, LocalDecision, MailMemoryContext, MailMemoryRecord, PreparedMeetingRequest } from "@/features/mail-memory/types/mail-memory";

export interface MailTodoItem { id: string; title: string; dueAt: string | null; type: "reply" | "follow_up" | "commitment" | "decision" | "draft" | "meeting" | "session" | "action"; sourceLinkIds: string[]; isOverdue: boolean }

export async function listMailTodo(repository: MailMemoryRepository, context: MailMemoryContext, now = new Date()): Promise<MailTodoItem[]> {
  const [commitments, decisions, meetings, sessions, followUps, actions, drafts] = await Promise.all([
    repository.list<LocalCommitment>("commitments", context), repository.list<LocalDecision>("mailDecisions", context),
    repository.list<PreparedMeetingRequest>("meetingRequests", context), repository.list<LocalAssistantSession>("assistantSessions", context),
    repository.list<MailMemoryRecord & { title?: string; dueAt?: string | null; sourceLinkIds?: string[]; status?: string }>("followUps", context),
    repository.list<MailMemoryRecord & { title?: string; dueAt?: string | null; sourceLinkIds?: string[]; status?: string }>("internalActions", context),
    repository.list<MailMemoryRecord & { subject?: string; sourceLinkIds?: string[]; status?: string }>("replyProposals", context),
  ]);
  const items: MailTodoItem[] = [];
  for (const item of commitments.filter((entry) => !["completed", "cancelled"].includes(entry.status))) items.push(toItem(item.id, item.text, item.dueAt, "commitment", item.sourceLinkIds, now));
  for (const item of decisions.filter((entry) => !entry.confirmedByUser && entry.status === "proposed")) items.push(toItem(item.id, item.title, null, "decision", item.sourceLinkIds, now));
  for (const item of meetings.filter((entry) => ["prepared", "awaiting_information"].includes(entry.status))) items.push(toItem(item.id, item.title, item.preferredDateRange.from, "meeting", item.sourceLinkIds, now));
  for (const item of sessions.filter((entry) => entry.status === "ready" && entry.unresolvedItems.length)) items.push(toItem(item.id, `${item.unresolvedItems.length} sujet(s) à reprendre dans une session Mail`, null, "session", [], now));
  for (const item of followUps.filter((entry) => entry.status !== "completed")) items.push(toItem(item.id, item.title ?? "Relance Mail", item.dueAt ?? null, "follow_up", item.sourceLinkIds ?? [], now));
  for (const item of actions.filter((entry) => entry.status !== "completed")) items.push(toItem(item.id, item.title ?? "Action issue d’un mail", item.dueAt ?? null, "action", item.sourceLinkIds ?? [], now));
  for (const item of drafts.filter((entry) => entry.status !== "approved")) items.push(toItem(item.id, item.subject ?? "Brouillon à relire", null, "draft", item.sourceLinkIds ?? [], now));
  return items.sort((a, b) => Number(b.isOverdue) - Number(a.isOverdue) || (a.dueAt ?? "9999").localeCompare(b.dueAt ?? "9999"));
}

function toItem(id: string, title: string, dueAt: string | null, type: MailTodoItem["type"], sourceLinkIds: string[], now: Date): MailTodoItem { return { id, title, dueAt, type, sourceLinkIds, isOverdue: Boolean(dueAt && new Date(dueAt).getTime() < now.getTime()) }; }
