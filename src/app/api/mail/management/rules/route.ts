import { apiError, apiJson, getSafeMailError, isTrustedSameOriginRequest } from "@/features/mail/server/mail-api-response";
import { getActiveMailContext } from "@/features/mail/services/mail-account-context";
import { mailRuleRepository } from "@/features/mail-management/server/mail-rule-repository";

export const runtime = "nodejs";

export async function GET() {
  try { const { account } = await getActiveMailContext(); return apiJson({ rules: await mailRuleRepository.list(account.id) }); }
  catch (error) { const safe = getSafeMailError(error); return apiError(safe.message, safe.status, safe.code); }
}

export async function POST(request: Request) {
  if (!isTrustedSameOriginRequest(request)) return apiError("La requête Mail n’est pas autorisée.", 403, "MAIL_PERMISSION_DENIED");
  try {
    const body: unknown = await request.json();
    if (!isRecord(body) || typeof body.operation !== "string") return apiError("La règle Mail est invalide.", 400);
    const { account } = await getActiveMailContext();
    if (body.operation === "toggle" && typeof body.id === "string" && typeof body.isActive === "boolean") {
      return apiJson({ rule: await mailRuleRepository.setActive(account.id, body.id, body.isActive) });
    }
    if (body.operation !== "add" || typeof body.name !== "string" || !isRecord(body.condition) || typeof body.condition.kind !== "string" || typeof body.condition.value !== "string" || typeof body.action !== "string") return apiError("La règle Mail est invalide.", 400);
    return apiJson({ rule: await mailRuleRepository.add(account.id, {
      name: body.name,
      condition: { kind: body.condition.kind as "sender_domain" | "sender" | "subject_contains" | "newsletter", value: body.condition.value },
      action: body.action as "keep_to_process" | "archive" | "mark_waiting",
      isActive: body.isActive !== false,
      priority: typeof body.priority === "number" ? body.priority : 50,
    }) });
  } catch (error) { const safe = getSafeMailError(error); return apiError(safe.message, safe.status, safe.code); }
}

function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
