import { orchestrateAssistantRequest } from "@/features/assistant-core/services/assistant-orchestrator";
import { AssistantToolRegistry } from "@/features/assistant-core/services/assistant-tool-registry";
import type { AssistantExecutionContext, AssistantTool } from "@/features/assistant-core/types/assistant-core";
import type { ErpPlanningQueryResult, OperationView } from "@/features/erp-import/types/erp-import";

function assistantContext(): AssistantExecutionContext {
  return { companyId: "local-company", userId: "local-user", moduleId: "planning", mode: "demo", correlationId: crypto.randomUUID() };
}

async function apiMessage(response: Response): Promise<string> {
  const payload: unknown = await response.json().catch(() => null);
  if (payload && typeof payload === "object" && "message" in payload && typeof (payload as { message?: unknown }).message === "string") return (payload as { message: string }).message;
  return "Le Planning n’a pas répondu correctement.";
}

/**
 * Opérations réelles d'un OF (planning ERP importé), pour répondre à une question de l'assistant
 * ou préparer une modification précise. Même route que la fiche OF (`WorkOrderDetail.tsx`) :
 * aucune deuxième source, passée par l'orchestrateur central pour rester tracée comme tout autre
 * outil de l'assistant (voir `mail-assistant-orchestration.ts`).
 */
export async function fetchOperationsForWorkOrder(workOrderId: string): Promise<OperationView[]> {
  const requestId = crypto.randomUUID();
  const toolName = "planning.lookup-work-order";
  const tool: AssistantTool<string, OperationView[]> = {
    name: toolName,
    description: "Recherche les opérations réelles d’un OF dans le planning ERP importé.",
    capabilities: ["information-retrieval"],
    modules: ["planning"],
    risk: "read",
    execute: async (id) => {
      const response = await fetch(`/api/erp/planning?search=${encodeURIComponent(id)}&sort=work-order&pageSize=200`, { cache: "no-store" });
      if (!response.ok) throw new Error(await apiMessage(response));
      const payload = await response.json() as ErpPlanningQueryResult;
      const rows = payload.rows.filter((row) => row.workOrderId === id);
      return { data: rows, summary: `${rows.length} opération(s) trouvée(s) pour ${id}.`, sourceLinks: [`/of/${id}`] };
    },
  };
  const result = await orchestrateAssistantRequest({
    request: { id: requestId, text: workOrderId, context: assistantContext() },
    plan: { requestId, steps: [{ id: crypto.randomUUID(), toolName, capability: "information-retrieval", input: workOrderId, isConfirmed: true }] },
    registry: new AssistantToolRegistry([tool]),
  });
  if (result.status !== "completed") return [];
  return result.outputs[0].data as OperationView[];
}

/**
 * Opérations réelles planifiées sur une machine (planning ERP importé), pour lister les OF les
 * plus prioritaires d'une machine à la demande de l'assistant. Même route/filtre `machine=` que
 * l'Atelier, passée par l'orchestrateur central comme `fetchOperationsForWorkOrder`.
 */
export async function fetchOperationsForMachine(machineId: string): Promise<OperationView[]> {
  const requestId = crypto.randomUUID();
  const toolName = "planning.lookup-machine";
  const tool: AssistantTool<string, OperationView[]> = {
    name: toolName,
    description: "Recherche les opérations planifiées sur une machine dans le planning ERP importé.",
    capabilities: ["information-retrieval"],
    modules: ["planning"],
    risk: "read",
    execute: async (id) => {
      const response = await fetch(`/api/erp/planning?machine=${encodeURIComponent(id)}&pageSize=200`, { cache: "no-store" });
      if (!response.ok) throw new Error(await apiMessage(response));
      const payload = await response.json() as ErpPlanningQueryResult;
      return { data: payload.rows, summary: `${payload.rows.length} opération(s) trouvée(s) sur la machine ${id}.`, sourceLinks: [] };
    },
  };
  const result = await orchestrateAssistantRequest({
    request: { id: requestId, text: machineId, context: assistantContext() },
    plan: { requestId, steps: [{ id: crypto.randomUUID(), toolName, capability: "information-retrieval", input: machineId, isConfirmed: true }] },
    registry: new AssistantToolRegistry([tool]),
  });
  if (result.status !== "completed") return [];
  return result.outputs[0].data as OperationView[];
}

/**
 * Applique un changement de priorité déjà confirmé explicitement par l'utilisateur (jamais avant),
 * via la même route PATCH que l'Atelier/Planning capacité — aucune règle de mutation redéfinie ici.
 */
export async function applyPlanningPriorityChange(operationId: string, priority: number): Promise<void> {
  const requestId = crypto.randomUUID();
  const toolName = "planning.set-priority";
  const tool: AssistantTool<{ operationId: string; priority: number }, null> = {
    name: toolName,
    description: "Modifie la priorité d’une opération ERP déjà confirmée par l’utilisateur.",
    capabilities: ["tool-management"],
    modules: ["planning"],
    risk: "mutate-local",
    execute: async (input) => {
      const response = await fetch(`/api/erp/operations/${encodeURIComponent(input.operationId)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ priority: input.priority }) });
      if (!response.ok) throw new Error(await apiMessage(response));
      return { data: null, summary: `Priorité de l’opération ${input.operationId} mise à ${input.priority}.`, sourceLinks: [] };
    },
  };
  const result = await orchestrateAssistantRequest({
    request: { id: requestId, text: `priorite:${operationId}:${priority}`, context: assistantContext() },
    plan: { requestId, steps: [{ id: crypto.randomUUID(), toolName, capability: "tool-management", input: { operationId, priority }, isConfirmed: true }] },
    registry: new AssistantToolRegistry([tool]),
  });
  if (result.status !== "completed") throw new Error(result.status === "failed" ? result.message : "Cette modification nécessite une confirmation explicite.");
}
