import { apiError, apiJson, getSafeMailError } from "@/features/mail/server/mail-api-response";
import { getActiveMailContext } from "@/features/mail/services/mail-account-context";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: RouteContext<"/api/mail/messages/[id]">) {
  const { id } = await params;
  try {
    const { account, provider } = await getActiveMailContext();
    const result = await provider.getMessage(id);
    const message = result && !account.settings.includeAttachmentMetadata
      ? { ...result, attachments: [] }
      : result;
    return message
      ? apiJson({ message })
      : apiError("Le message demandé est introuvable pour le compte actif.", 404);
  } catch (error) {
    const safe = getSafeMailError(error);
    return apiError(safe.message, safe.status);
  }
}
