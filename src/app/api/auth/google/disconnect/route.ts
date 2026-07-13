import { apiError, apiJson, isTrustedSameOriginRequest } from "@/features/mail/server/mail-api-response";
import { disconnectMailAccount } from "@/features/mail/services/mail-connections";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isTrustedSameOriginRequest(request)) {
    return apiError("La requête de déconnexion est refusée.", 403);
  }
  let body: { accountId?: unknown };
  try {
    body = await request.json() as { accountId?: unknown };
  } catch {
    return apiError("Le contenu de la requête est invalide.", 400);
  }
  if (typeof body.accountId !== "string") {
    return apiError("L’identifiant du compte est invalide.", 400);
  }
  try {
    await disconnectMailAccount(body.accountId);
    return apiJson({ disconnected: true });
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : "La déconnexion Google Workspace a échoué.",
      400,
    );
  }
}
