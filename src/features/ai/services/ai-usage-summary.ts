import type { AiBudgetPolicy, AiOperationType, AiPricingEntry, AiUsageRecord } from "@/features/ai/types/ai";
import type { AiBudgetAlert, AiBudgetStatus, AiUsageQuery, AiUsageSummary } from "@/features/ai/types/ai-usage";
import { estimateAiUsageCost, hasValidatedPricing } from "@/features/ai/services/ai-cost-estimation";

const OPERATIONS: AiOperationType[] = ["mail_analysis", "mail_reply", "mail_rewrite", "connection_test"];

export function summarizeAiUsage(entries: AiUsageRecord[], query: AiUsageQuery, policy: AiBudgetPolicy, pricing: AiPricingEntry[], now = new Date()): AiUsageSummary {
  const period = resolvePeriod(query, now);
  const month = { from: startOfMonth(now).toISOString(), to: endOfDay(now).toISOString() };
  const today = { from: startOfDay(now).toISOString(), to: endOfDay(now).toISOString() };
  const scoped = filterEntries(entries, query).filter((entry) => inPeriod(entry, period));
  const monthEntries = entries.filter((entry) => inPeriod(entry, month));
  const filteredMonthEntries = filterEntries(entries, query).filter((entry) => inPeriod(entry, month));
  const todayEntries = filterEntries(entries, query).filter((entry) => inPeriod(entry, today));
  const priced = scoped.map((entry) => withDynamicCost(entry, pricing, policy.currencyDisplay));
  const pricedMonth = monthEntries.map((entry) => withDynamicCost(entry, pricing, policy.currencyDisplay));
  const pricedToday = todayEntries.map((entry) => withDynamicCost(entry, pricing, policy.currencyDisplay));
  const monthCalls = providerCalls(pricedMonth);
  const pricingConfigured = hasValidatedPricing(pricing, policy.currencyDisplay) && monthCalls.every((entry) => entry.estimatedCost !== null);
  const monthCost = pricingConfigured ? sumCost(pricedMonth, "estimatedCost") : null;
  const periodCost = pricingConfigured ? sumCost(priced, "estimatedCost") : null;
  const todayCost = pricingConfigured ? sumCost(pricedToday, "estimatedCost") : null;
  const cacheSavings = pricingConfigured ? sumCost(priced, "estimatedCostAvoided") : null;
  const status = getBudgetStatus(policy, monthCost, pricingConfigured);
  return {
    period,
    requestsToday: providerCalls(todayEntries).length,
    requestsThisMonth: providerCalls(filteredMonthEntries).length,
    operations: Object.fromEntries(OPERATIONS.map((operation) => [operation, providerCalls(scoped).filter((entry) => entry.operation === operation).length])) as Record<AiOperationType, number>,
    blockedRequests: scoped.filter((entry) => entry.errorCode === "budget_blocked" || entry.errorCode === "rate_limit").length,
    cacheHits: scoped.filter((entry) => entry.cacheStatus === "hit").length,
    cacheHitPercentage: percentage(scoped.filter((entry) => entry.cacheStatus === "hit").length, providerCalls(scoped).length + scoped.filter((entry) => entry.cacheStatus === "hit").length),
    inputTokens: sumTokens(scoped, "inputTokens"), cachedInputTokens: sumTokens(scoped, "cachedInputTokens"), outputTokens: sumTokens(scoped, "outputTokens"), totalTokens: sumTokens(scoped, "totalTokens"),
    errors: scoped.filter((entry) => !entry.success).length,
    financial: {
      configured: pricingConfigured, currency: policy.currencyDisplay,
      estimatedPeriodCost: periodCost, estimatedTodayCost: todayCost, estimatedMonthCost: monthCost, estimatedCacheSavings: cacheSavings,
      averageAnalysisCost: averageCost(priced, "mail_analysis"), averageReplyCost: averageCost(priced, "mail_reply"), averageRewriteCost: averageCost(priced, "mail_rewrite"),
    },
    budget: { policy, status, estimatedUsed: monthCost, estimatedRemaining: monthCost === null ? null : Math.max(0, policy.monthlyHardStopAmount - monthCost), percentage: monthCost === null ? null : percentage(monthCost, policy.monthlyHardStopAmount), overrideActive: policy.allowAdministratorOverride && policy.administratorOverrideActive },
    alerts: buildAlerts(scoped, policy, monthCost, pricingConfigured),
    availableFilters: { models: unique(entries.map((entry) => entry.model)), accounts: unique(entries.map((entry) => entry.accountId)), users: unique(entries.map((entry) => entry.userId)) },
    lastSuccessfulCallAt: entries.filter((entry) => entry.success && entry.provider === "openai" && entry.cacheStatus !== "hit").at(-1)?.createdAt ?? null,
    lastSafeErrorCategory: entries.filter((entry) => !entry.success).at(-1)?.errorCode ?? null,
  };
}

function buildAlerts(entries: AiUsageRecord[], policy: AiBudgetPolicy, monthCost: number | null, pricingConfigured: boolean): AiBudgetAlert[] {
  const alerts: AiBudgetAlert[] = [];
  if (!pricingConfigured) alerts.push({ id: "pricing", level: "information", message: "Estimation financière non configurée." });
  if (monthCost !== null) {
    if (monthCost >= policy.monthlyHardStopAmount) alerts.push({ id: "hard-stop", level: "critical", message: "Le plafond mensuel interne est atteint : les appels OpenAI sont bloqués." });
    else if (monthCost >= policy.monthlyHardStopAmount * 0.8) alerts.push({ id: "hard-stop-80", level: "warning", message: "80 % du plafond mensuel interne sont atteints." });
    if (monthCost >= policy.monthlyWarningAmount && monthCost < policy.monthlyHardStopAmount) alerts.push({ id: "warning", level: "warning", message: "Le seuil d’avertissement mensuel interne est atteint." });
    else if (monthCost >= policy.monthlyBudgetAmount * 0.5 && monthCost < policy.monthlyWarningAmount) alerts.push({ id: "half", level: "information", message: "50 % du budget mensuel interne sont utilisés." });
  }
  const failures = entries.filter((entry) => !entry.success).length;
  if (failures >= 3) alerts.push({ id: "failures", level: "warning", message: "Plusieurs échecs IA ont été enregistrés sur la période." });
  const calls = providerCalls(entries).length;
  const hits = entries.filter((entry) => entry.cacheStatus === "hit").length;
  if (calls >= 10 && percentage(hits, calls + hits) < 10) alerts.push({ id: "cache", level: "information", message: "Le taux de réutilisation du cache est faible." });
  const coveredDays = new Set(entries.map((entry) => entry.createdAt.slice(0, 10))).size;
  if (coveredDays <= 1 && calls >= policy.dailyRequestLimit * 0.8) alerts.push({ id: "increase", level: "warning", message: "Le volume de requêtes est inhabituellement élevé aujourd’hui." });
  return alerts;
}

function getBudgetStatus(policy: AiBudgetPolicy, cost: number | null, pricing: boolean): AiBudgetStatus { if (!pricing || cost === null) return "pricing_unavailable"; if (cost >= policy.monthlyHardStopAmount) return "blocked"; if (cost >= policy.monthlyHardStopAmount * 0.8) return "almost_reached"; if (cost >= policy.monthlyWarningAmount || cost >= policy.monthlyBudgetAmount * 0.5) return "attention"; return "normal"; }
function withDynamicCost(entry: AiUsageRecord, registry: AiPricingEntry[], currency: AiBudgetPolicy["currencyDisplay"]): AiUsageRecord { const usage = { inputTokens: entry.inputTokens, cachedInputTokens: entry.cachedInputTokens, outputTokens: entry.outputTokens, totalTokens: entry.totalTokens }; const estimate = estimateAiUsageCost({ model: entry.model, usage, pricingRegistry: registry, currency, occurredAt: entry.createdAt }); return { ...entry, estimatedCost: entry.cacheStatus === "hit" ? 0 : estimate, estimatedCostAvoided: entry.cacheStatus === "hit" ? estimate : 0, estimatedCostCurrency: estimate === null ? null : currency }; }
function filterEntries(entries: AiUsageRecord[], query: AiUsageQuery) { return entries.filter((entry) => (!query.operation || query.operation === "all" || entry.operation === query.operation) && (!query.model || entry.model === query.model) && (!query.accountId || entry.accountId === query.accountId) && (!query.userId || entry.userId === query.userId)); }
function resolvePeriod(query: AiUsageQuery, now: Date) { if (query.period === "today") return { from: startOfDay(now).toISOString(), to: endOfDay(now).toISOString() }; if (query.period === "last_7_days") { const from = startOfDay(now); from.setDate(from.getDate() - 6); return { from: from.toISOString(), to: endOfDay(now).toISOString() }; } if (query.period === "custom" && query.dateFrom && query.dateTo) return { from: startOfDay(new Date(`${query.dateFrom}T00:00:00`)).toISOString(), to: endOfDay(new Date(`${query.dateTo}T00:00:00`)).toISOString() }; return { from: startOfMonth(now).toISOString(), to: endOfDay(now).toISOString() }; }
function providerCalls(entries: AiUsageRecord[]) { return entries.filter((entry) => entry.provider === "openai" && entry.cacheStatus !== "hit" && (entry.providerRequestAttempted ?? entry.success)); }
function inPeriod(entry: AiUsageRecord, period: { from: string; to: string }) { return entry.createdAt >= period.from && entry.createdAt <= period.to; }
function sumTokens(entries: AiUsageRecord[], key: "inputTokens" | "cachedInputTokens" | "outputTokens" | "totalTokens") { return entries.reduce((total, entry) => total + (entry[key] ?? 0), 0); }
function sumCost(entries: AiUsageRecord[], key: "estimatedCost" | "estimatedCostAvoided") { return Math.round(entries.reduce((total, entry) => total + (entry[key] ?? 0), 0) * 1_000_000) / 1_000_000; }
function averageCost(entries: AiUsageRecord[], operation: AiOperationType) { const values = entries.filter((entry) => entry.operation === operation && entry.estimatedCost !== null).map((entry) => entry.estimatedCost ?? 0); return values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length * 1_000_000) / 1_000_000 : null; }
function percentage(value: number, total: number) { return total > 0 ? Math.round(value / total * 100) : 0; }
function unique(values: string[]) { return [...new Set(values)].sort((left, right) => left.localeCompare(right)); }
function startOfDay(value: Date) { const result = new Date(value); result.setHours(0, 0, 0, 0); return result; }
function endOfDay(value: Date) { const result = new Date(value); result.setHours(23, 59, 59, 999); return result; }
function startOfMonth(value: Date) { return new Date(value.getFullYear(), value.getMonth(), 1); }
