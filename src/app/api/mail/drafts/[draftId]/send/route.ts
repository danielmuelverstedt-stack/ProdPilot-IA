import { apiError, apiJson, getSafeMailError, isTrustedSameOriginRequest } from "@/features/mail/server/mail-api-response";
import { getActiveMailContext } from "@/features/mail/services/mail-account-context";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ draftId: string }> }) {
  if (!isTrustedSameOriginRequest(request)) return apiError("La requête d’envoi est refusée.", 403);
  const { draftId } = await params;
  if (!draftId || draftId.length > 200) return apiError("L’identifiant du brouillon est invalide.", 400);
  let body: { confirmed?: unknown };
  try { body = await request.json() as { confirmed?: unknown }; } catch { return apiError("La demande d’envoi est invalide.", 400); }
  if (body.confirmed !== true) return apiError("L’envoi nécessite une confirmation explicite après relecture du brouillon.", 400);
  try {
    const { account, provider } = await getActiveMailContext();
    if (!account.settings.sendingEnabled) return apiError("L’envoi n’est pas autorisé pour ce compte. Activez-le dans Réglages → Connexions → Messagerie.", 403);
    const result = await provider.sendDraft(draftId);
    return apiJson({ sent: true, ...result });
  } catch (error) {
    const safe = getSafeMailError(error);
    return apiError(safe.message, safe.status);
  }
}
