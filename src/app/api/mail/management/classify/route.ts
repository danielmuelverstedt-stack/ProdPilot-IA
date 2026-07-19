import { apiError, apiJson, getSafeMailError, isTrustedSameOriginRequest } from "@/features/mail/server/mail-api-response";
import { getActiveMailContext } from "@/features/mail/services/mail-account-context";
import { canAutomaticallyArchive, classifyMailForManagement, getMatchingMailRuleIds } from "@/features/mail-management/services/mail-classification-service";
import { mailRuleRepository } from "@/features/mail-management/server/mail-rule-repository";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isTrustedSameOriginRequest(request)) return apiError("La requête Mail n’est pas autorisée.", 403, "MAIL_PERMISSION_DENIED");
  try {
    const body: unknown = await request.json();
    if (!isRecord(body) || !Array.isArray(body.messageIds) || body.messageIds.length < 1 || body.messageIds.length > 50 || !body.messageIds.every((id) => typeof id === "string")) return apiError("L’échantillon de migration doit contenir entre 1 et 50 mails.", 400);
    const { account, provider } = await getActiveMailContext();
    const rules = await mailRuleRepository.list(account.id);
    const messages = await Promise.all(body.messageIds.map((id) => provider.getMessage(String(id))));
    if (messages.some((message) => message === null)) return apiError("Un mail de l’échantillon n’existe pas dans le compte actif.", 404);
    const usedRuleIds = new Set<string>();
    const proposals = messages.flatMap((message) => {
      if (!message) return [];
      const decision = classifyMailForManagement(message, rules);
      getMatchingMailRuleIds(message, rules).forEach((id) => usedRuleIds.add(id));
      return [{ messageId: message.id, subject: message.subject, decision, automaticArchiveAllowed: canAutomaticallyArchive(message, decision, rules) }];
    });
    await mailRuleRepository.markUsed(account.id, [...usedRuleIds], new Date().toISOString());
    return apiJson({ proposals, executionPerformed: false });
  } catch (error) { const safe = getSafeMailError(error); return apiError(safe.message, safe.status, safe.code); }
}

function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
