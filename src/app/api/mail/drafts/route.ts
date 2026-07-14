import { apiError, apiJson, getSafeMailError, isTrustedSameOriginRequest } from "@/features/mail/server/mail-api-response";
import { getActiveMailContext } from "@/features/mail/services/mail-account-context";
import type { CreateMailDraftInput } from "@/features/mail/types/mail";

export const runtime = "nodejs";

interface DraftRequestBody {
  confirmed?: unknown;
  to?: unknown;
  cc?: unknown;
  bcc?: unknown;
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
  const to = parseEmails(body.to, true);
  const cc = parseEmails(body.cc ?? [], false);
  const bcc = parseEmails(body.bcc ?? [], false);
  if (!to || !cc || !bcc || typeof body.subject !== "string" || typeof body.bodyText !== "string") return apiError("Les informations du brouillon sont incomplètes ou invalides.", 400);
  if ((body.replyToMessageId !== undefined && typeof body.replyToMessageId !== "string") || (body.replyToThreadId !== undefined && typeof body.replyToThreadId !== "string")) return apiError("Les métadonnées de réponse sont invalides.", 400);

  const input: CreateMailDraftInput = {
    to: to.map((email) => ({ email })),
    cc: cc.map((email) => ({ email })),
    bcc: bcc.map((email) => ({ email })),
    subject: body.subject.trim(),
    bodyText: body.bodyText,
    replyToMessageId: body.replyToMessageId,
    replyToThreadId: body.replyToThreadId,
  };
  try {
    const { account, provider } = await getActiveMailContext();
    if (account.mode !== "oauth") return apiError("Un compte de démonstration ne crée pas de brouillon externe.", 409);
    const draft = await provider.createDraft(input);
    return apiJson({ draft }, 201);
  } catch (error) {
    const safe = getSafeMailError(error);
    return apiError(safe.message, safe.status);
  }
}

function parseEmails(value: unknown, required: boolean): string[] | null {
  const entries = typeof value === "string" ? [value] : value;
  if (!Array.isArray(entries) || entries.length > 20 || (required && entries.length === 0)) return null;
  const normalized = entries.map((item) => typeof item === "string" ? item.trim().toLowerCase() : "");
  return normalized.every((item) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item) && !/[\r\n]/.test(item)) ? normalized : null;
}
