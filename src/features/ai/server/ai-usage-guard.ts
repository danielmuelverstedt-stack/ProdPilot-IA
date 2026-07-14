import "server-only";

import { estimateAiUsageCost } from "@/features/ai/services/ai-cost-estimation";
import { AiServiceError, type AiBudgetPolicy, type AiOperationType, type AiPricingEntry, type AiUsageMetadata } from "@/features/ai/types/ai";
import { aiUsageRepository } from "@/features/ai/server/repositories/local-ai-usage-repository";

const DEFAULT_SERVER_DAILY_LIMIT = 50;

export async function enforceAiUsageLimit(input: {
  userId: string;
  companyId: string;
  isAdministrator: boolean;
  messageReference: string;
  operation: AiOperationType;
  model: string;
  budgetPolicy: AiBudgetPolicy;
  pricingRegistry: AiPricingEntry[];
  projectedUsage: AiUsageMetadata;
}) {
  if (!aiUsageRepository.isOperational()) throw blocked("Le dépôt d’utilisation IA sécurisé n’est pas configuré pour cet environnement. Aucun appel OpenAI n’a été effectué.", "budget_blocked");
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const monthEntries = await aiUsageRepository.listSince(monthStart);
  const providerAttempts = monthEntries.filter((entry) => entry.provider === "openai" && entry.cacheStatus !== "hit" && (entry.providerRequestAttempted ?? entry.success));
  const successfulCalls = providerAttempts.filter((entry) => entry.success);
  const todayCalls = providerAttempts.filter((entry) => entry.createdAt >= dayStart);
  const serverDailyLimit = parseLimit(process.env.OPENAI_DAILY_REQUEST_LIMIT, DEFAULT_SERVER_DAILY_LIMIT);
  const companyLimit = Math.min(serverDailyLimit, input.budgetPolicy.dailyRequestLimit);
  const userLimit = Math.min(serverDailyLimit, input.budgetPolicy.perUserDailyRequestLimit);
  if (todayCalls.filter((entry) => entry.companyId === input.companyId).length >= companyLimit) throw blocked("La limite quotidienne interne de l’entreprise est atteinte. Utilisez le mode déterministe ou réessayez demain.", "rate_limit");
  if (todayCalls.filter((entry) => entry.userId === input.userId).length >= userLimit) throw blocked("Votre limite quotidienne interne est atteinte. Utilisez le mode déterministe ou réessayez demain.", "rate_limit");

  const sameReference = providerAttempts.filter((entry) => entry.messageReference === input.messageReference && entry.operation === input.operation);
  if (input.operation === "mail_analysis" && sameReference.length >= input.budgetPolicy.perMessageAnalysisLimit) throw blocked("La limite d’analyses pour ce message est atteinte. Réutilisez l’analyse en cache ou le mode déterministe.", "rate_limit");
  if (input.operation === "mail_rewrite" && sameReference.length >= input.budgetPolicy.perDraftRewriteLimit) throw blocked("La limite de réécritures pour ce brouillon est atteinte. Poursuivez la modification manuellement.", "rate_limit");

  const historicalEstimates = successfulCalls.map((entry) => estimateAiUsageCost({
      model: entry.model,
      usage: { inputTokens: entry.inputTokens, cachedInputTokens: entry.cachedInputTokens, outputTokens: entry.outputTokens, totalTokens: entry.totalTokens },
      pricingRegistry: input.pricingRegistry,
      currency: input.budgetPolicy.currencyDisplay,
      occurredAt: entry.createdAt,
    }));
  const projectedCost = estimateAiUsageCost({ model: input.model, usage: input.projectedUsage, pricingRegistry: input.pricingRegistry, currency: input.budgetPolicy.currencyDisplay, occurredAt: now.toISOString() });
  if (projectedCost !== null && historicalEstimates.every((estimate) => estimate !== null)) {
    const estimatedMonthCost = historicalEstimates.reduce<number>((total, estimate) => total + (estimate ?? 0), 0);
    const override = input.isAdministrator && input.budgetPolicy.allowAdministratorOverride && input.budgetPolicy.administratorOverrideActive;
    if (estimatedMonthCost + projectedCost >= input.budgetPolicy.monthlyHardStopAmount && !override) throw blocked("Le prochain appel pourrait dépasser le plafond mensuel interne. Aucun appel OpenAI n’a été effectué ; le mode déterministe reste disponible.", "budget_blocked");
  }
}

function blocked(message: string, code: "rate_limit" | "budget_blocked") { return new AiServiceError({ code, message, recoverable: true, status: 429 }); }
function parseLimit(value: string | undefined, fallback: number) { const parsed = Number(value); return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback; }
