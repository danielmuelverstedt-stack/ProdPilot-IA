import { aiUsageRepository } from "@/features/ai/server/repositories/local-ai-usage-repository";
import { summarizeAiUsage } from "@/features/ai/services/ai-usage-summary";
import type { AiOperationType } from "@/features/ai/types/ai";
import type { AiUsageQuery } from "@/features/ai/types/ai-usage";
import { parseAiBudgetPolicy, parseAiPricingRegistry } from "@/features/ai/validation/ai-budget-input";
import { apiError, apiJson, isTrustedSameOriginRequest } from "@/features/mail/server/mail-api-response";

export const runtime = "nodejs";
const OPERATIONS: Array<AiOperationType | "all"> = ["all", "mail_analysis", "mail_reply", "mail_rewrite", "mail_conversation", "connection_test"];

export async function POST(request: Request) {
  if (!isTrustedSameOriginRequest(request)) return apiError("La requête d’utilisation IA est refusée.", 403);
  let value: unknown;
  try { value = await request.json(); } catch { return apiError("Les filtres d’utilisation IA sont invalides.", 400); }
  if (!isRecord(value)) return apiError("Les filtres d’utilisation IA sont invalides.", 400);
  const budgetPolicy = parseAiBudgetPolicy(value.budgetPolicy);
  const pricingRegistry = parseAiPricingRegistry(value.pricingRegistry);
  const query = parseQuery(value.query);
  if (!budgetPolicy || !pricingRegistry || !query) return apiError("La configuration d’utilisation IA est invalide.", 400);
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const requestedStart = query.period === "custom" && query.dateFrom ? new Date(`${query.dateFrom}T00:00:00`) : query.period === "last_7_days" ? new Date(Date.now() - 6 * 86_400_000) : monthStart;
  const earliest = new Date(Math.min(monthStart.getTime(), requestedStart.getTime())).toISOString();
  return apiJson(summarizeAiUsage(await aiUsageRepository.listSince(earliest), query, budgetPolicy, pricingRegistry));
}

function parseQuery(value: unknown): AiUsageQuery | null {
  if (!isRecord(value) || !["today", "last_7_days", "current_month", "custom"].includes(String(value.period))) return null;
  if (value.operation !== undefined && !OPERATIONS.includes(value.operation as AiOperationType | "all")) return null;
  if (value.period === "custom" && (!isDate(value.dateFrom) || !isDate(value.dateTo) || String(value.dateFrom) > String(value.dateTo))) return null;
  const optional = [value.model, value.accountId, value.userId];
  if (optional.some((item) => item !== undefined && (typeof item !== "string" || item.length > 200))) return null;
  return { period: value.period as AiUsageQuery["period"], dateFrom: typeof value.dateFrom === "string" ? value.dateFrom : undefined, dateTo: typeof value.dateTo === "string" ? value.dateTo : undefined, operation: value.operation as AiUsageQuery["operation"], model: value.model as string | undefined, accountId: value.accountId as string | undefined, userId: value.userId as string | undefined };
}
function isDate(value: unknown) { return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T00:00:00`).getTime()); }
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
