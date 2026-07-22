import { randomUUID } from "node:crypto";
import { orchestrateAssistantRequest } from "@/features/assistant-core/services/assistant-orchestrator";
import { AssistantToolRegistry } from "@/features/assistant-core/services/assistant-tool-registry";
import type { AssistantCapabilityId, AssistantTool, AssistantToolRisk } from "@/features/assistant-core/types/assistant-core";
import type { MailAssistantCommand, MailAssistantSession } from "@/features/mail-assistant/types/mail-assistant";

interface MailCommandExecution {
  session: MailAssistantSession;
  summary: string;
}

export async function orchestrateMailAssistantCommand(input: {
  session: MailAssistantSession;
  command: MailAssistantCommand;
  execute: () => Promise<MailAssistantSession>;
}): Promise<MailAssistantSession> {
  const requestId = randomUUID();
  const toolName = `mail.${input.command.intent}`;
  const capability = capabilityForIntent(input.command.intent);
  const risk = riskForIntent(input.command.intent);
  const tool: AssistantTool<MailAssistantCommand, MailCommandExecution> = {
    name: toolName,
    description: "Exécute une intention Mail à travers les services spécialisés existants.",
    capabilities: [capability],
    modules: ["mail"],
    risk,
    execute: async () => {
      const session = await input.execute();
      return { data: { session, summary: `Intention Mail ${input.command.intent} traitée.` }, summary: `Intention Mail ${input.command.intent} traitée.`, sourceLinks: input.command.messageIds.map((id) => `mail:${id}`) };
    },
  };
  const result = await orchestrateAssistantRequest({
    request: { id: requestId, text: input.command.rawText, context: { companyId: "local-company", userId: "local-user", moduleId: "mail", mode: input.session.account.mode === "demo" ? "demo" : "real", correlationId: input.session.id } },
    plan: { requestId, steps: [{ id: randomUUID(), toolName, capability, input: input.command, isConfirmed: true }] },
    registry: new AssistantToolRegistry([tool]),
  });
  if (result.status === "failed" && result.cause instanceof Error) throw result.cause;
  if (result.status !== "completed") throw new Error(result.status === "confirmation-required" ? "Cette action nécessite une confirmation explicite." : result.message);
  return (result.outputs[0].data as MailCommandExecution).session;
}

function capabilityForIntent(intent: MailAssistantCommand["intent"]): AssistantCapabilityId {
  if (intent === "create_action") return "task-creation";
  if (intent === "modify_reply") return "rewriting";
  if (intent === "create_draft" || intent === "send_email" || intent === "compose_new_mail") return "writing";
  if (intent === "undo" || intent === "redo") return "history";
  if (intent === "summarize_new_mail") return "conversation";
  return "tool-management";
}

function riskForIntent(intent: MailAssistantCommand["intent"]): AssistantToolRisk {
  if (intent === "summarize_new_mail") return "read";
  if (intent === "send_email") return "external";
  if (intent === "create_draft" || intent === "create_action" || intent === "compose_new_mail") return "prepare";
  return "mutate-local";
}
