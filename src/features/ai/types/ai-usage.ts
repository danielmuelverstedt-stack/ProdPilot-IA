import type { AiBudgetPolicy, AiCurrency, AiOperationType } from "@/features/ai/types/ai";

export type AiUsagePeriodPreset = "today" | "last_7_days" | "current_month" | "custom";
export type AiBudgetStatus = "normal" | "attention" | "almost_reached" | "blocked" | "pricing_unavailable";

export interface AiUsageQuery {
  period: AiUsagePeriodPreset;
  dateFrom?: string;
  dateTo?: string;
  operation?: AiOperationType | "all";
  model?: string;
  accountId?: string;
  userId?: string;
}

export interface AiBudgetAlert {
  id: string;
  level: "information" | "warning" | "critical";
  message: string;
}

export interface AiUsageSummary {
  period: { from: string; to: string };
  requestsToday: number;
  requestsThisMonth: number;
  operations: Record<AiOperationType, number>;
  blockedRequests: number;
  cacheHits: number;
  cacheHitPercentage: number;
  inputTokens: number;
  cachedInputTokens: number;
  outputTokens: number;
  totalTokens: number;
  errors: number;
  financial: {
    configured: boolean;
    currency: AiCurrency;
    estimatedPeriodCost: number | null;
    estimatedTodayCost: number | null;
    estimatedMonthCost: number | null;
    estimatedCacheSavings: number | null;
    averageAnalysisCost: number | null;
    averageReplyCost: number | null;
    averageRewriteCost: number | null;
  };
  budget: {
    policy: AiBudgetPolicy;
    status: AiBudgetStatus;
    estimatedUsed: number | null;
    estimatedRemaining: number | null;
    percentage: number | null;
    overrideActive: boolean;
  };
  alerts: AiBudgetAlert[];
  availableFilters: { models: string[]; accounts: string[]; users: string[] };
  lastSuccessfulCallAt: string | null;
  lastSafeErrorCategory: string | null;
}
