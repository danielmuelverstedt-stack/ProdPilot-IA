import { getSafeAiError } from "@/features/ai/server/ai-api-response";
import { testOpenAiConnection } from "@/features/ai/services/openai-connection-test";
import { parseAiBudgetPolicy, parseAiPricingRegistry } from "@/features/ai/validation/ai-budget-input";
import { apiError, apiJson, isTrustedSameOriginRequest } from "@/features/mail/server/mail-api-response";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isTrustedSameOriginRequest(request)) return apiError("La requête de test OpenAI est refusée.", 403);
  let value: unknown;
  try { value = await request.json(); } catch { return apiError("La configuration du test OpenAI est invalide.", 400); }
  if (!isRecord(value)) return apiError("La configuration du test OpenAI est invalide.", 400);
  const budgetPolicy = parseAiBudgetPolicy(value.budgetPolicy);
  const pricingRegistry = parseAiPricingRegistry(value.pricingRegistry);
  if (!budgetPolicy || !pricingRegistry) return apiError("La configuration du budget IA est invalide.", 400);
  try { return apiJson(await testOpenAiConnection({ budgetPolicy, pricingRegistry })); }
  catch (error) { const safe = getSafeAiError(error); return apiError(safe.message, safe.status); }
}

function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
