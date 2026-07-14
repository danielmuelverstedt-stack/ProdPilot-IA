import { normalizeAiBudgetPolicy } from "@/features/ai/config/ai-budget-policy";
import type { AiBudgetPolicy, AiPricingEntry } from "@/features/ai/types/ai";

export function parseAiBudgetPolicy(value: unknown): AiBudgetPolicy | null {
  if (!isRecord(value)) return null;
  const numberKeys = ["monthlyBudgetAmount", "monthlyWarningAmount", "monthlyHardStopAmount", "dailyRequestLimit", "perUserDailyRequestLimit", "perMessageAnalysisLimit", "perDraftRewriteLimit"] as const;
  if (!numberKeys.every((key) => typeof value[key] === "number" && Number.isFinite(value[key]) && Number(value[key]) > 0)) return null;
  if (typeof value.allowAdministratorOverride !== "boolean" || typeof value.administratorOverrideActive !== "boolean" || (value.currencyDisplay !== "EUR" && value.currencyDisplay !== "USD")) return null;
  return normalizeAiBudgetPolicy(value as unknown as AiBudgetPolicy);
}

export function parseAiPricingRegistry(value: unknown): AiPricingEntry[] | null {
  if (!Array.isArray(value) || value.length > 100) return null;
  const entries = value.filter(isRecord);
  if (entries.length !== value.length || !entries.every(isPricingEntry)) return null;
  return entries.map((entry) => ({
    id: String(entry.id), provider: "openai", model: String(entry.model).trim(),
    inputPricePerMillionTokens: Number(entry.inputPricePerMillionTokens),
    cachedInputPricePerMillionTokens: Number(entry.cachedInputPricePerMillionTokens),
    outputPricePerMillionTokens: Number(entry.outputPricePerMillionTokens),
    currency: entry.currency as "EUR" | "USD", effectiveDate: String(entry.effectiveDate),
    sourceNote: String(entry.sourceNote).trim(), enabled: entry.enabled === true,
  }));
}

function isPricingEntry(value: Record<string, unknown>) {
  return typeof value.id === "string" && value.id.length > 0 && value.id.length <= 120
    && value.provider === "openai"
    && typeof value.model === "string" && value.model.trim().length > 0 && value.model.length <= 200
    && [value.inputPricePerMillionTokens, value.cachedInputPricePerMillionTokens, value.outputPricePerMillionTokens].every((price) => typeof price === "number" && Number.isFinite(price) && price >= 0 && price <= 1_000_000)
    && (value.currency === "EUR" || value.currency === "USD")
    && typeof value.effectiveDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value.effectiveDate)
    && typeof value.sourceNote === "string" && value.sourceNote.trim().length > 0 && value.sourceNote.length <= 500
    && typeof value.enabled === "boolean";
}

function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
