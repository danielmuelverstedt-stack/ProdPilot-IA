import "server-only";

import { randomUUID } from "node:crypto";
import { aiUsageRepository } from "@/features/ai/server/repositories/local-ai-usage-repository";
import { estimateAiUsageCost } from "@/features/ai/services/ai-cost-estimation";
import type { AiBudgetPolicy, AiError, AiOperationType, AiPricingEntry, AiProviderType, AiUsageMetadata, AiUsageRecord } from "@/features/ai/types/ai";

export async function recordSafeAiUsage(input: {
  operation: AiOperationType; provider: AiProviderType; model: string; accountId: string; companyId: string; userId: string; messageReference: string;
  usage: AiUsageMetadata | null; durationMs: number; providerRequestAttempted: boolean; cacheStatus: AiUsageRecord["cacheStatus"]; success: boolean; errorCode: AiError["code"] | null;
  budgetPolicy: AiBudgetPolicy; pricingRegistry: AiPricingEntry[];
}) {
  const createdAt = new Date().toISOString();
  const estimated = estimateAiUsageCost({ model: input.model, usage: input.usage, pricingRegistry: input.pricingRegistry, currency: input.budgetPolicy.currencyDisplay, occurredAt: createdAt });
  await aiUsageRepository.record({
    id: randomUUID(), operation: input.operation, provider: input.provider, model: input.model,
    accountId: input.accountId, companyId: input.companyId, userId: input.userId, messageReference: input.messageReference,
    inputTokens: input.usage?.inputTokens ?? null, cachedInputTokens: input.usage?.cachedInputTokens ?? null,
    outputTokens: input.usage?.outputTokens ?? null, totalTokens: input.usage?.totalTokens ?? null,
    durationMs: input.durationMs, providerRequestAttempted: input.providerRequestAttempted, cacheStatus: input.cacheStatus, success: input.success, errorCode: input.errorCode,
    estimatedCost: input.cacheStatus === "hit" ? 0 : estimated,
    estimatedCostAvoided: input.cacheStatus === "hit" ? estimated : 0,
    estimatedCostCurrency: estimated === null ? null : input.budgetPolicy.currencyDisplay,
    createdAt,
  });
}
