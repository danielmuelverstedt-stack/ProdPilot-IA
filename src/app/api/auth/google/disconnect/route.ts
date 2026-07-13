import { disconnectGoogleAccount } from "@/features/mail/server/google/google-auth";
import { apiError, apiJson, isTrustedSameOriginRequest } from "@/features/mail/server/mail-api-response";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isTrustedSameOriginRequest(request)) return apiError("La requête de déconnexion est refusée.", 403);
  try {
    await disconnectGoogleAccount();
    return apiJson({ disconnected: true });
  } catch {
    return apiError("La déconnexion Google Workspace n’a pas pu être effectuée.", 500);
  }
}
