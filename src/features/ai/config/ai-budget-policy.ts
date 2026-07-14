import type { AiBudgetPolicy } from "@/features/ai/types/ai";

export const DEFAULT_AI_BUDGET_POLICY: AiBudgetPolicy = {
  monthlyBudgetAmount: 10,
  monthlyWarningAmount: 5,
  monthlyHardStopAmount: 10,
  dailyRequestLimit: 50,
  perUserDailyRequestLimit: 50,
  perMessageAnalysisLimit: 10,
  perDraftRewriteLimit: 20,
  allowAdministratorOverride: false,
  administratorOverrideActive: false,
  currencyDisplay: "EUR",
};

const MAXIMUM_SAFE_REQUEST_LIMIT = 10_000;
const MAXIMUM_SAFE_AMOUNT = 1_000_000;

export function normalizeAiBudgetPolicy(value: AiBudgetPolicy): AiBudgetPolicy {
  const hardStop = clampAmount(value.monthlyHardStopAmount, DEFAULT_AI_BUDGET_POLICY.monthlyHardStopAmount);
  return {
    monthlyBudgetAmount: Math.min(clampAmount(value.monthlyBudgetAmount, hardStop), hardStop),
    monthlyWarningAmount: Math.min(clampAmount(value.monthlyWarningAmount, DEFAULT_AI_BUDGET_POLICY.monthlyWarningAmount), hardStop),
    monthlyHardStopAmount: hardStop,
    dailyRequestLimit: clampLimit(value.dailyRequestLimit, DEFAULT_AI_BUDGET_POLICY.dailyRequestLimit),
    perUserDailyRequestLimit: clampLimit(value.perUserDailyRequestLimit, DEFAULT_AI_BUDGET_POLICY.perUserDailyRequestLimit),
    perMessageAnalysisLimit: clampLimit(value.perMessageAnalysisLimit, DEFAULT_AI_BUDGET_POLICY.perMessageAnalysisLimit),
    perDraftRewriteLimit: clampLimit(value.perDraftRewriteLimit, DEFAULT_AI_BUDGET_POLICY.perDraftRewriteLimit),
    allowAdministratorOverride: value.allowAdministratorOverride === true,
    administratorOverrideActive: value.allowAdministratorOverride === true && value.administratorOverrideActive === true,
    currencyDisplay: value.currencyDisplay === "USD" ? "USD" : "EUR",
  };
}

function clampLimit(value: number, fallback: number) {
  return Number.isInteger(value) && value > 0 ? Math.min(value, MAXIMUM_SAFE_REQUEST_LIMIT) : fallback;
}

function clampAmount(value: number, fallback: number) {
  return Number.isFinite(value) && value > 0 ? Math.min(value, MAXIMUM_SAFE_AMOUNT) : fallback;
}
