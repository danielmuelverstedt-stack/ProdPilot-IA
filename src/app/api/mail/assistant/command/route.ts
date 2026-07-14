import { apiError, apiJson, getSafeMailError, isTrustedSameOriginRequest } from "@/features/mail/server/mail-api-response";
import { executeMailAssistantText } from "@/features/mail-assistant/services/mail-assistant-session-service";

export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!isTrustedSameOriginRequest(request)) return apiError("La commande est refusée.", 403);
  let body: { sessionId?: unknown; text?: unknown };
  try { body = await request.json() as typeof body; } catch { return apiError("La commande est invalide.", 400); }
  if (typeof body.sessionId !== "string" || typeof body.text !== "string" || !body.text.trim() || body.text.length > 2_000) return apiError("La commande est incomplète ou trop longue.", 400);
  try { return apiJson({ session: await executeMailAssistantText(body.sessionId, body.text.trim()) }); }
  catch (error) { const safe = getSafeMailError(error); return apiError(safe.message, safe.status); }
}
