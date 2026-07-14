import "server-only";

import type { AiProvider } from "@/features/ai/services/ai-provider";
import { getOpenAiConfigurationStatus } from "@/features/ai/config/openai-config";
import { MockAiProvider } from "@/features/ai/providers/mock/mock-ai-provider";

export async function resolveAiProvider(): Promise<{
  provider: AiProvider;
  status: ReturnType<typeof getOpenAiConfigurationStatus>;
}> {
  const status = getOpenAiConfigurationStatus();
  if (!status.configured) return { provider: new MockAiProvider(), status };
  const { OpenAiProvider } = await import("@/features/ai/providers/openai/openai-ai-provider");
  return { provider: new OpenAiProvider(), status };
}
