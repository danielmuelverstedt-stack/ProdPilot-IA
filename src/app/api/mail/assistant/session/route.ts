import { apiError, apiJson, getSafeMailError, isTrustedSameOriginRequest } from "@/features/mail/server/mail-api-response";
import { startMailAssistantSession } from "@/features/mail-assistant/services/mail-assistant-session-service";

export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!isTrustedSameOriginRequest(request)) return apiError("La demande de démarrage de session est refusée.", 403);
  try { return apiJson({ session: await startMailAssistantSession() }, 201); }
  catch (error) { const safe = getSafeMailError(error); return apiError(safe.message, safe.status); }
}
