import "server-only";

import { createHash } from "node:crypto";
import { getOpenAiConfigurationStatus } from "@/features/ai/config/openai-config";
import { OpenAiProvider } from "@/features/ai/providers/openai/openai-ai-provider";
import { enforceAiUsageLimit } from "@/features/ai/server/ai-usage-guard";
import { recordSafeAiUsage } from "@/features/ai/services/ai-usage-recorder";
import { AiServiceError, type AiBudgetPolicy, type AiPricingEntry } from "@/features/ai/types/ai";
import { getCurrentMailOwnerContext } from "@/features/mail/server/accounts/mail-owner-context";

export async function testOpenAiConnection(input: { budgetPolicy: AiBudgetPolicy; pricingRegistry: AiPricingEntry[] }) {
  const status = getOpenAiConfigurationStatus();
  if (!status.configured) return { state: "not_configured" as const, message: status.message, model: status.model, usage: null };
  const owner = getCurrentMailOwnerContext();
  const reference = createHash("sha256").update(`${owner.companyId}:openai-connection-test`).digest("hex");
  const common = { operation: "connection_test" as const, provider: "openai" as const, model: status.model, accountId: "openai-configuration", companyId: owner.companyId, userId: owner.userId, messageReference: reference, budgetPolicy: input.budgetPolicy, pricingRegistry: input.pricingRegistry };
  try {
    await enforceAiUsageLimit({ ...owner, messageReference: reference, operation: "connection_test", model: status.model, budgetPolicy: input.budgetPolicy, pricingRegistry: input.pricingRegistry, projectedUsage: { inputTokens: 20, cachedInputTokens: 0, outputTokens: 32, totalTokens: 52 } });
  } catch (error) {
    const detail = error instanceof AiServiceError ? error.detail : unavailable().detail;
    await recordSafeAiUsage({ ...common, usage: null, durationMs: 0, providerRequestAttempted: false, cacheStatus: "not_applicable", success: false, errorCode: detail.code });
    throw error;
  }
  const startedAt = Date.now();
  try {
    const result = await new OpenAiProvider().testConnection();
    await recordSafeAiUsage({ ...common, model: result.model, usage: result.usage, durationMs: Date.now() - startedAt, providerRequestAttempted: true, cacheStatus: "not_applicable", success: true, errorCode: null });
    return { state: "success" as const, message: "Connexion OpenAI réussie.", model: result.model, usage: result.usage };
  } catch (error) {
    const detail = error instanceof AiServiceError ? error.detail : unavailable().detail;
    await recordSafeAiUsage({ ...common, usage: null, durationMs: Date.now() - startedAt, providerRequestAttempted: true, cacheStatus: "not_applicable", success: false, errorCode: detail.code });
    throw error;
  }
}

function unavailable() { return new AiServiceError({ code: "provider_unavailable", message: "Le service OpenAI est temporairement indisponible.", recoverable: true, status: 502 }); }
