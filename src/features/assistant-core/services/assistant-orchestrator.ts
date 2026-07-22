import { isAssistantCapability } from "./assistant-capability-catalog.ts";
import { AssistantToolRegistry } from "./assistant-tool-registry.ts";
import type { AssistantExecutionPlan, AssistantExecutionTrace, AssistantOrchestrationResult, AssistantRequest } from "../types/assistant-core.ts";

export async function orchestrateAssistantRequest(input: {
  request: AssistantRequest;
  plan: AssistantExecutionPlan;
  registry: AssistantToolRegistry;
}): Promise<AssistantOrchestrationResult> {
  const { request, plan, registry } = input;
  if (plan.requestId !== request.id || !plan.steps.length) return { status: "failed", message: "Le plan d’exécution de l’assistant est invalide.", failedStepId: null, trace: [] };
  const trace: AssistantExecutionTrace[] = [];
  const outputs = [];
  for (const step of plan.steps) {
    const tool = registry.get(step.toolName);
    if (!tool || !isAssistantCapability(step.capability) || !tool.capabilities.includes(step.capability) || !tool.modules.includes(request.context.moduleId)) {
      return { status: "failed", message: "Une capacité demandée n’est pas disponible dans ce contexte.", failedStepId: step.id, trace };
    }
    if (tool.risk !== "read" && !step.isConfirmed) return { status: "confirmation-required", step, trace };
    const startedAt = new Date().toISOString();
    try {
      const output = await tool.execute(step.input, request.context);
      const completedAt = new Date().toISOString();
      outputs.push(output);
      trace.push({ stepId: step.id, toolName: tool.name, capability: step.capability, startedAt, completedAt, summary: output.summary, sourceLinks: output.sourceLinks });
    } catch (cause) {
      return { status: "failed", message: "Un outil requis par l’assistant n’a pas pu terminer son travail.", failedStepId: step.id, trace, cause };
    }
  }
  return { status: "completed", outputs, trace };
}
