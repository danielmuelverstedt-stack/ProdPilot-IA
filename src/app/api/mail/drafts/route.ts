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
  bodyHtml?: unknown;
  inlineImages?: unknown;
  attachments?: unknown;
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
  const richContent = parseRichContent(body.bodyHtml, body.inlineImages, body.attachments);
  if (!richContent) return apiError("Le contenu enrichi du brouillon est invalide ou trop volumineux.", 400);
  if ((body.replyToMessageId !== undefined && typeof body.replyToMessageId !== "string") || (body.replyToThreadId !== undefined && typeof body.replyToThreadId !== "string")) return apiError("Les métadonnées de réponse sont invalides.", 400);

  const input: CreateMailDraftInput = {
    to: to.map((email) => ({ email })),
    cc: cc.map((email) => ({ email })),
    bcc: bcc.map((email) => ({ email })),
    subject: body.subject.trim(),
    bodyText: body.bodyText,
    bodyHtml: richContent.bodyHtml,
    inlineImages: richContent.inlineImages,
    attachments: richContent.attachments,
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

function parseRichContent(bodyHtml: unknown, inlineImages: unknown, attachments: unknown): Pick<CreateMailDraftInput, "bodyHtml" | "inlineImages" | "attachments"> | null {
  if (bodyHtml === undefined && inlineImages === undefined && attachments === undefined) return {};
  const imageValues = inlineImages ?? [];
  const attachmentValues = attachments ?? [];
  if (typeof bodyHtml !== "string" || bodyHtml.length > 300_000 || !Array.isArray(imageValues) || imageValues.length > 30 || !Array.isArray(attachmentValues) || attachmentValues.length > 3) return null;
  let totalBytes = 0;
  const parsed: NonNullable<CreateMailDraftInput["inlineImages"]> = [];
  for (const value of imageValues) {
    if (!value || typeof value !== "object") return null;
    const image = value as Record<string, unknown>;
    if (typeof image.contentId !== "string" || !/^[a-zA-Z0-9._-]{1,80}$/.test(image.contentId) || typeof image.filename !== "string" || !/^[a-zA-Z0-9._-]{1,100}$/.test(image.filename) || !["image/jpeg", "image/png", "image/webp"].includes(String(image.mimeType)) || typeof image.base64 !== "string" || !/^[a-zA-Z0-9+/=\r\n]+$/.test(image.base64)) return null;
    totalBytes += Math.ceil(image.base64.replace(/\s/g, "").length * 0.75);
    if (totalBytes > 8_000_000) return null;
    parsed.push(image as unknown as NonNullable<CreateMailDraftInput["inlineImages"]>[number]);
  }
  const parsedAttachments: NonNullable<CreateMailDraftInput["attachments"]> = [];
  for (const value of attachmentValues) {
    if (!value || typeof value !== "object") return null;
    const attachment = value as Record<string, unknown>;
    if (attachment.mimeType !== "application/pdf" || typeof attachment.filename !== "string" || !/^[a-zA-Z0-9._-]{1,100}$/.test(attachment.filename) || typeof attachment.base64 !== "string" || !/^[a-zA-Z0-9+/=\r\n]+$/.test(attachment.base64)) return null;
    totalBytes += Math.ceil(attachment.base64.replace(/\s/g, "").length * 0.75);
    if (totalBytes > 12_000_000) return null;
    parsedAttachments.push(attachment as unknown as NonNullable<CreateMailDraftInput["attachments"]>[number]);
  }
  return { bodyHtml, inlineImages: parsed, attachments: parsedAttachments };
}

function parseEmails(value: unknown, required: boolean): string[] | null {
  const entries = typeof value === "string" ? [value] : value;
  if (!Array.isArray(entries) || entries.length > 20 || (required && entries.length === 0)) return null;
  const normalized = entries.map((item) => typeof item === "string" ? item.trim().toLowerCase() : "");
  return normalized.every((item) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item) && !/[\r\n]/.test(item)) ? normalized : null;
}
