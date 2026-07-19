import { apiError, apiJson, getSafeMailError, isTrustedSameOriginRequest } from "@/features/mail/server/mail-api-response";
import {
  ensureProdPilotLabels,
  executeMailManagementAction,
  getMailManagementOverview,
  undoMailManagementAction,
} from "@/features/mail-management/services/mail-management-service";
import type { MailManagementAction } from "@/features/mail-management/types/mail-management";

export const runtime = "nodejs";

export async function GET() {
  try {
    return apiJson(await getMailManagementOverview());
  } catch (error) {
    const safe = getSafeMailError(error);
    return apiError(safe.message, safe.status, safe.code);
  }
}

export async function POST(request: Request) {
  if (!isTrustedSameOriginRequest(request)) return apiError("La requête Mail n’est pas autorisée.", 403, "MAIL_PERMISSION_DENIED");
  try {
    const body: unknown = await request.json();
    if (!isRecord(body) || typeof body.operation !== "string") return apiError("La requête Mail est invalide.", 400);
    if (body.operation === "bootstrap") return apiJson({ labels: await ensureProdPilotLabels() });
    if (body.operation === "undo") {
      if (typeof body.activityId !== "string") return apiError("L’action à annuler est invalide.", 400);
      return apiJson({ result: await undoMailManagementAction(body.activityId) });
    }
    if (body.operation !== "execute" || !isAction(body.action) || !Array.isArray(body.messageIds) || !body.messageIds.every((id) => typeof id === "string")) {
      return apiError("L’action Mail demandée est invalide.", 400);
    }
    return apiJson({ result: await executeMailManagementAction({
      action: body.action,
      messageIds: body.messageIds,
      target: body.target === "thread" ? "thread" : "message",
      confirmed: body.confirmed === true,
      source: body.source === "ai" ? "ai" : "user",
      automatic: body.automatic === true,
      reason: typeof body.reason === "string" ? body.reason : undefined,
      aiConfidence: typeof body.aiConfidence === "number" ? body.aiConfidence : undefined,
    }) });
  } catch (error) {
    const safe = getSafeMailError(error);
    return apiError(safe.message, safe.status, safe.code);
  }
}

function isAction(value: unknown): value is MailManagementAction {
  return ["to_process", "waiting", "processed", "archive", "restore", "mark_read", "mark_unread"].includes(String(value));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
