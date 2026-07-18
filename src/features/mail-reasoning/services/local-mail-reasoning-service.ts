import type { MailMemoryRepository } from "@/features/mail-memory/repositories/mail-memory-repository";
import type { MailMemoryContext, MailMemoryRecord, MailMemoryStoreName, MailMemoryUsageMetric } from "@/features/mail-memory/types/mail-memory";
import { reasonFromSnapshot } from "@/features/mail-reasoning/services/mail-reasoning-engine";
import type { MailReasoningReport, ReasoningRecord } from "@/features/mail-reasoning/types/mail-reasoning";

const SOURCES: Array<{ store: MailMemoryStoreName; type: ReasoningRecord["type"] }> = [
  { store: "mailMessages", type: "message" }, { store: "replyProposals", type: "reply" },
  { store: "draftReferences", type: "draft" }, { store: "followUps", type: "follow_up" },
  { store: "commitments", type: "commitment" }, { store: "mailDecisions", type: "decision" },
  { store: "meetingRequests", type: "meeting" }, { store: "internalActions", type: "action" },
  { store: "assistantSessions", type: "session" },
];

export async function createLocalMailReasoningReport(input: { repository: MailMemoryRepository; context: MailMemoryContext; now?: Date }): Promise<MailReasoningReport> {
  const now = input.now ?? new Date();
  const batches = await Promise.all(SOURCES.map(async ({ store, type }) => ({ type, records: await input.repository.list(store, input.context) })));
  const records = batches.flatMap(({ type, records: items }) => items.map((record) => normalize(record, type)));
  const report = reasonFromSnapshot({ records }, now);
  const metric: MailMemoryUsageMetric = { ...input.context, id: contextualId(input.context, "usage", `mail-reasoning:${now.toISOString()}`), sourceId: input.context.accountId, createdAt: now.toISOString(), updatedAt: now.toISOString(), synchronizationStatus: "local", operation: "mail_reasoning", orchestrationLevel: 0, sourceCount: records.length, aiCalled: false };
  await input.repository.save("usageMetrics", metric);
  return report;
}

function normalize(record: MailMemoryRecord, type: ReasoningRecord["type"]): ReasoningRecord {
  const value = record as MailMemoryRecord & Record<string, unknown>;
  const unresolved = Array.isArray(value.unresolvedItems) ? value.unresolvedItems.length : 0;
  return { id: record.id, sourceId: record.sourceId, type, title: text(value.subject) ?? text(value.title) ?? text(value.text) ?? text(value.summary) ?? `${type} ${record.sourceId}`, status: type === "message" ? text(value.workflowStatus) ?? "observed" : type === "session" && unresolved === 0 ? "finished" : text(value.status) ?? "open", dueAt: text(value.dueAt), updatedAt: record.updatedAt, sourceLinkIds: stringList(value.sourceLinkIds), stakeholder: text(value.stakeholder) ?? undefined, threadId: text(value.threadId) ?? undefined };
}
function text(value: unknown): string | null { return typeof value === "string" && value.trim() ? value : null; }
function stringList(value: unknown): string[] { return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []; }
function contextualId(context: MailMemoryContext, kind: string, id: string) { return `${context.companyId}:${context.userId}:${context.accountId}:${context.mode}:${kind}:${id}`; }
