import { apiError, apiJson, getSafeMailError } from "@/features/mail/server/mail-api-response";
import { getActiveMailContext } from "@/features/mail/services/mail-account-context";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: RouteContext<"/api/mail/messages/[id]">) {
  const { id } = await params;
  try {
    const { provider } = await getActiveMailContext();
    const message = await provider.getMessage(id);
    return message
      ? apiJson({ message })
      : apiError("Le message demandé est introuvable pour le compte actif.", 404);
  } catch (error) {
    const safe = getSafeMailError(error);
    return apiError(safe.message, safe.status);
  }
}
