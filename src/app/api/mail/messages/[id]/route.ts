import { getMailProvider } from "@/features/mail/providers/provider-factory";
import { apiError, apiJson, getSafeMailError } from "@/features/mail/server/mail-api-response";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const message = await getMailProvider("google").getMessage(id);
    return message ? apiJson({ message }) : apiError("Le message demandé est introuvable.", 404);
  } catch (error) {
    const safe = getSafeMailError(error);
    return apiError(safe.message, safe.status);
  }
}
