import type { AiCurrency, AiPricingEntry, AiUsageMetadata, AiUsageRecord } from "@/features/ai/types/ai";

export function estimateAiUsageCost(input: {
  model: string;
  usage: AiUsageMetadata | null;
  pricingRegistry: AiPricingEntry[];
  currency: AiCurrency;
  occurredAt: string;
}): number | null {
  if (!input.usage || input.usage.inputTokens === null || input.usage.outputTokens === null) return null;
  const price = findEffectivePrice(input.pricingRegistry, input.model, input.currency, input.occurredAt);
  if (!price) return null;
  const cached = Math.min(input.usage.cachedInputTokens ?? 0, input.usage.inputTokens);
  const uncached = Math.max(0, input.usage.inputTokens - cached);
  return roundCost((uncached * price.inputPricePerMillionTokens + cached * price.cachedInputPricePerMillionTokens + input.usage.outputTokens * price.outputPricePerMillionTokens) / 1_000_000);
}

export function hasValidatedPricing(registry: AiPricingEntry[], currency: AiCurrency) {
  return registry.some((entry) => entry.enabled && entry.currency === currency);
}

export function sumEstimatedCost(entries: AiUsageRecord[], currency: AiCurrency) {
  const matching = entries.filter((entry) => entry.estimatedCostCurrency === currency && entry.estimatedCost !== null && entry.estimatedCost !== undefined);
  return matching.length ? roundCost(matching.reduce((total, entry) => total + (entry.estimatedCost ?? 0), 0)) : null;
}

function findEffectivePrice(registry: AiPricingEntry[], model: string, currency: AiCurrency, occurredAt: string) {
  const date = occurredAt.slice(0, 10);
  return registry.filter((entry) => entry.enabled && entry.provider === "openai" && entry.model === model && entry.currency === currency && entry.effectiveDate <= date)
    .sort((left, right) => right.effectiveDate.localeCompare(left.effectiveDate))[0] ?? null;
}

function roundCost(value: number) { return Math.round(value * 1_000_000) / 1_000_000; }
