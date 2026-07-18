export type MailReasoningKind = "risk" | "opportunity" | "recommendation" | "dependency" | "blocked_item" | "waiting_item" | "conflict" | "deadline" | "commitment" | "decision_impact";
export type MailReasoningSeverity = "info" | "low" | "medium" | "high" | "critical";
export type MailReasoningStatus = "open" | "waiting" | "recommended" | "resolved" | "dismissed";
export interface MailReasoningSource { recordId: string; sourceId: string; sourceType: string; sourceLinkIds: string[]; fact: string }
export interface MailReasoningObject { id: string; kind: MailReasoningKind; title: string; description: string; confidence: number; severity: MailReasoningSeverity; reason: string; supportingSources: MailReasoningSource[]; createdAt: string; updatedAt: string; status: MailReasoningStatus; recommendedAction: "reply_now" | "wait" | "create_follow_up" | "schedule_meeting" | "call_supplier" | "ask_confirmation" | "escalate" | "archive" | "review" | null }
export interface MailReasoningDependency { fromId: string; toId: string; relation: "blocks" | "waits_for" | "enables" | "duplicates" | "impacts"; reason: string }
export interface MailReasoningExecution { mode: "local" | "cached" | "ai"; reason: string; tokenEstimate: number; aiCalled: boolean }
export interface MailReasoningReport { objects: MailReasoningObject[]; dependencies: MailReasoningDependency[]; execution: MailReasoningExecution; generatedAt: string }
export interface ReasoningRecord { id: string; sourceId: string; title: string; status: string; dueAt: string | null; updatedAt: string; sourceLinkIds: string[]; type: "message" | "reply" | "draft" | "follow_up" | "commitment" | "decision" | "meeting" | "action" | "session"; stakeholder?: string; threadId?: string }
export interface MailReasoningSnapshot { records: ReasoningRecord[] }
