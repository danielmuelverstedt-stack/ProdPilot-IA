import type { AssistantTool } from "../types/assistant-core.ts";

export class AssistantToolRegistry {
  private readonly tools = new Map<string, AssistantTool>();

  constructor(tools: readonly AssistantTool[] = []) {
    tools.forEach((tool) => this.register(tool));
  }

  register(tool: AssistantTool): void {
    if (!tool.name.trim() || this.tools.has(tool.name)) throw new Error(`L’outil assistant « ${tool.name} » est invalide ou déjà enregistré.`);
    if (!tool.capabilities.length || !tool.modules.length) throw new Error(`L’outil assistant « ${tool.name} » doit déclarer ses capacités et modules.`);
    this.tools.set(tool.name, tool);
  }

  get(name: string): AssistantTool | null {
    return this.tools.get(name) ?? null;
  }

  list(): AssistantTool[] {
    return [...this.tools.values()];
  }
}
