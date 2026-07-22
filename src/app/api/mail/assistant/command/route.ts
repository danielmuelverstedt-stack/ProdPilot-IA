import { apiError, apiJson, getSafeMailError, isTrustedSameOriginRequest } from "@/features/mail/server/mail-api-response";
import { executeMailAssistantText } from "@/features/mail-assistant/services/mail-assistant-session-service";
import { parseComposeTemplate, parseMailAiConfiguration, parseProductionContext } from "@/features/ai/validation/mail-ai-input";
import { getSafeAiError } from "@/features/ai/server/ai-api-response";

export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!isTrustedSameOriginRequest(request)) return apiError("La commande est refusée.", 403);
  let body: { sessionId?: unknown; text?: unknown; configuration?: unknown; productionContext?: unknown; template?: unknown };
  try { body = await request.json() as typeof body; } catch { return apiError("La commande est invalide.", 400); }
  if (typeof body.sessionId !== "string" || typeof body.text !== "string" || !body.text.trim() || body.text.length > 2_000) return apiError("La commande est incomplète ou trop longue.", 400);
  const configuration = body.configuration === undefined ? null : parseMailAiConfiguration(body.configuration);
  if (body.configuration !== undefined && !configuration) return apiError("La configuration IA de la conversation est invalide.", 400);
  const productionContext = parseProductionContext(body.productionContext);
  if (productionContext === undefined) return apiError("Le contexte de production transmis est invalide.", 400);
  const template = parseComposeTemplate(body.template);
  if (template === undefined) return apiError("Le modèle de mail transmis est invalide.", 400);
  try { return apiJson({ session: await executeMailAssistantText(body.sessionId, body.text.trim(), configuration, request.signal, productionContext, template) }); }
  catch (error) {
    const safe = error instanceof Error && error.name === "AiServiceError" ? getSafeAiError(error) : getSafeMailError(error);
    return apiError(safe.message, safe.status);
  }
}
