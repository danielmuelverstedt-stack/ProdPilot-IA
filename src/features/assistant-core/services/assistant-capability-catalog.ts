import { ASSISTANT_CAPABILITIES, type AssistantCapabilityId } from "../types/assistant-core.ts";

const capabilitySet = new Set<AssistantCapabilityId>(ASSISTANT_CAPABILITIES);

export function isAssistantCapability(value: string): value is AssistantCapabilityId {
  return capabilitySet.has(value as AssistantCapabilityId);
}

export function listAssistantCapabilities(): readonly AssistantCapabilityId[] {
  return ASSISTANT_CAPABILITIES;
}
