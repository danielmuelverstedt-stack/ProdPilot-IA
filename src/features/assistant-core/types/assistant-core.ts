export const ASSISTANT_CAPABILITIES = [
  "conversation",
  "intent-understanding",
  "information-retrieval",
  "document-analysis",
  "summarization",
  "writing",
  "rewriting",
  "translation",
  "classification",
  "smart-search",
  "task-creation",
  "reminder-creation",
  "risk-analysis",
  "history",
  "notifications",
  "user-learning",
  "voice",
  "streaming",
  "context-management",
  "tool-management",
] as const;

export type AssistantCapabilityId = (typeof ASSISTANT_CAPABILITIES)[number];
export type AssistantToolRisk = "read" | "prepare" | "mutate-local" | "external";

export interface AssistantExecutionContext {
  companyId: string;
  userId: string;
  moduleId: string;
  mode: "demo" | "real";
  correlationId: string;
}

export interface AssistantRequest {
  id: string;
  text: string;
  context: AssistantExecutionContext;
}

export interface AssistantPlanStep {
  id: string;
  toolName: string;
  capability: AssistantCapabilityId;
  input: unknown;
  isConfirmed: boolean;
}

export interface AssistantExecutionPlan {
  requestId: string;
  steps: AssistantPlanStep[];
}

export interface AssistantToolResult<T = unknown> {
  data: T;
  summary: string;
  sourceLinks: string[];
}

export interface AssistantTool<TInput = unknown, TOutput = unknown> {
  name: string;
  description: string;
  capabilities: readonly AssistantCapabilityId[];
  modules: readonly string[];
  risk: AssistantToolRisk;
  execute(input: TInput, context: AssistantExecutionContext): Promise<AssistantToolResult<TOutput>>;
}

export interface AssistantExecutionTrace {
  stepId: string;
  toolName: string;
  capability: AssistantCapabilityId;
  startedAt: string;
  completedAt: string;
  summary: string;
  sourceLinks: string[];
}

export type AssistantOrchestrationResult =
  | { status: "completed"; outputs: AssistantToolResult[]; trace: AssistantExecutionTrace[] }
  | { status: "confirmation-required"; step: AssistantPlanStep; trace: AssistantExecutionTrace[] }
  | { status: "failed"; message: string; failedStepId: string | null; trace: AssistantExecutionTrace[]; cause?: unknown };
