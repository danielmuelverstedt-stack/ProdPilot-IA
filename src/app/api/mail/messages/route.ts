import type { NextRequest } from "next/server";
import { apiError, apiJson, getSafeMailError } from "@/features/mail/server/mail-api-response";
import { listActiveMailMessages } from "@/features/mail/services/mail-account-context";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const rawLimit = request.nextUrl.searchParams.get("limit");
  const limit = rawLimit === null ? undefined : Number(rawLimit);
  const retrieveAll = request.nextUrl.searchParams.get("all") === "true";
  const forceRefresh = request.nextUrl.searchParams.get("refresh") === "true";
  if (limit !== undefined && (!Number.isInteger(limit) || limit < 1 || limit > 100)) {
    return apiError("Le nombre de messages doit être compris entre 1 et 100.", 400);
  }
  try {
    const { account, messages, synchronization } = await listActiveMailMessages({ limit, retrieveAll, forceRefresh });
    return apiJson({ account, messages, synchronization });
  } catch (error) {
    const safe = getSafeMailError(error);
    return apiError(safe.message, safe.status, safe.code);
  }
}
