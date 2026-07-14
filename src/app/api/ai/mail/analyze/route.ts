import { analyzeActiveMail } from "@/features/ai/services/mail-ai-service";
import { getSafeAiError } from "@/features/ai/server/ai-api-response";
import { parseMailAiBaseRequest } from "@/features/ai/validation/mail-ai-input";
import { apiError, apiJson, isTrustedSameOriginRequest } from "@/features/mail/server/mail-api-response";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isTrustedSameOriginRequest(request)) return apiError("La requête d’analyse IA est refusée.", 403);
  let raw: unknown;
  try { raw = await request.json(); } catch { return apiError("La demande d’analyse IA est invalide.", 400); }
  const input = parseMailAiBaseRequest(raw);
  const controls = raw as { forceRefresh?: unknown; longContextConfirmed?: unknown };
  if (!input || typeof controls.forceRefresh !== "boolean" || typeof controls.longContextConfirmed !== "boolean") return apiError("La demande d’analyse IA est invalide.", 400);
  try { return apiJson(await analyzeActiveMail({ ...input, forceRefresh: controls.forceRefresh, longContextConfirmed: controls.longContextConfirmed })); }
  catch (error) { const safe = getSafeAiError(error); return apiError(safe.message, safe.status); }
}
