import { getMailProvider } from "@/features/mail/providers/provider-factory";
import { apiError, apiJson, getSafeMailError, isTrustedSameOriginRequest } from "@/features/mail/server/mail-api-response";
import type { CreateMailDraftInput } from "@/features/mail/types/mail";

export const runtime = "nodejs";

interface DraftRequestBody {
  confirmed?: unknown;
  to?: unknown;
  subject?: unknown;
  bodyText?: unknown;
  replyToMessageId?: unknown;
  replyToThreadId?: unknown;
}

export async function POST(request: Request) {
  if (!isTrustedSameOriginRequest(request)) return apiError("La requête de création du brouillon est refusée.", 403);
  let body: DraftRequestBody;
  try { body = await request.json() as DraftRequestBody; } catch { return apiError("Le contenu du brouillon est invalide.", 400); }
  if (body.confirmed !== true) return apiError("La création du brouillon nécessite une confirmation explicite.", 400);
  if (typeof body.to !== "string" || typeof body.subject !== "string" || typeof body.bodyText !== "string") return apiError("Les informations du brouillon sont incomplètes.", 400);
  if ((body.replyToMessageId !== undefined && typeof body.replyToMessageId !== "string") || (body.replyToThreadId !== undefined && typeof body.replyToThreadId !== "string")) return apiError("Les métadonnées de réponse sont invalides.", 400);

  const input: CreateMailDraftInput = {
    to: [{ email: body.to.trim().toLowerCase() }],
    subject: body.subject.trim(),
    bodyText: body.bodyText,
    replyToMessageId: body.replyToMessageId,
    replyToThreadId: body.replyToThreadId,
  };
  try {
    const draft = await getMailProvider("google").createDraft(input);
    return apiJson({ draft }, 201);
  } catch (error) {
    const safe = getSafeMailError(error);
    return apiError(safe.message, safe.status);
  }
}
