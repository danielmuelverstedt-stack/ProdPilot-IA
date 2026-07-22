import assert from "node:assert/strict";
import test from "node:test";
import { orchestrateAssistantRequest } from "../src/features/assistant-core/services/assistant-orchestrator.ts";
import { AssistantToolRegistry } from "../src/features/assistant-core/services/assistant-tool-registry.ts";
import { listAssistantCapabilities } from "../src/features/assistant-core/services/assistant-capability-catalog.ts";

const context = { companyId: "company-1", userId: "user-1", moduleId: "planning", mode: "demo", correlationId: "session-1" };

test("le catalogue central expose les capacités transversales sans dépendance Mail", () => {
  const capabilities = listAssistantCapabilities();
  assert.ok(capabilities.includes("conversation"));
  assert.ok(capabilities.includes("tool-management"));
  assert.ok(capabilities.includes("context-management"));
  assert.ok(capabilities.includes("voice"));
  assert.equal(new Set(capabilities).size, capabilities.length);
});

test("l’orchestrateur exécute un outil autorisé et conserve une trace sourcée", async () => {
  const registry = new AssistantToolRegistry([{ name: "planning.read", description: "Lecture Planning", capabilities: ["information-retrieval"], modules: ["planning"], risk: "read", execute: async () => ({ data: 42, summary: "Planning lu.", sourceLinks: ["planning:active"] }) }]);
  const result = await orchestrateAssistantRequest({ request: { id: "request-1", text: "Lis le planning", context }, plan: { requestId: "request-1", steps: [{ id: "step-1", toolName: "planning.read", capability: "information-retrieval", input: {}, isConfirmed: false }] }, registry });
  assert.equal(result.status, "completed");
  assert.equal(result.trace[0].sourceLinks[0], "planning:active");
});

test("une mutation non confirmée est arrêtée avant l’outil", async () => {
  let executed = false;
  const registry = new AssistantToolRegistry([{ name: "task.create", description: "Prépare une tâche", capabilities: ["task-creation"], modules: ["planning"], risk: "prepare", execute: async () => { executed = true; return { data: null, summary: "Tâche préparée.", sourceLinks: [] }; } }]);
  const result = await orchestrateAssistantRequest({ request: { id: "request-2", text: "Crée une tâche", context }, plan: { requestId: "request-2", steps: [{ id: "step-2", toolName: "task.create", capability: "task-creation", input: {}, isConfirmed: false }] }, registry });
  assert.equal(result.status, "confirmation-required");
  assert.equal(executed, false);
});

test("un outil ne peut pas franchir une frontière de module non déclarée", async () => {
  const registry = new AssistantToolRegistry([{ name: "mail.read", description: "Lecture Mail", capabilities: ["information-retrieval"], modules: ["mail"], risk: "read", execute: async () => ({ data: null, summary: "Mail lu.", sourceLinks: [] }) }]);
  const result = await orchestrateAssistantRequest({ request: { id: "request-3", text: "Lis mes mails", context }, plan: { requestId: "request-3", steps: [{ id: "step-3", toolName: "mail.read", capability: "information-retrieval", input: {}, isConfirmed: true }] }, registry });
  assert.equal(result.status, "failed");
});
