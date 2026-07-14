import { proposeActiveMailReply } from "@/features/ai/services/mail-ai-service";
import { getSafeAiError } from "@/features/ai/server/ai-api-response";
import { parseMailAiReplyRequest } from "@/features/ai/validation/mail-ai-input";
import { apiError, apiJson, isTrustedSameOriginRequest } from "@/features/mail/server/mail-api-response";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isTrustedSameOriginRequest(request)) return apiError("La requête de génération IA est refusée.", 403);
  let raw: unknown;
  try { raw = await request.json(); } catch { return apiError("La demande de réponse IA est invalide.", 400); }
  const input = parseMailAiReplyRequest(raw);
  if (!input) return apiError("La demande de réponse IA est invalide.", 400);
  try { return apiJson(await proposeActiveMailReply(input)); }
  catch (error) { const safe = getSafeAiError(error); return apiError(safe.message, safe.status); }
}
