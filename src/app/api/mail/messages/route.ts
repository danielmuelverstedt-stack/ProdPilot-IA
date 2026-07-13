import type { NextRequest } from "next/server";
import { apiError, apiJson, getSafeMailError } from "@/features/mail/server/mail-api-response";
import { listActiveMailMessages } from "@/features/mail/services/mail-account-context";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const rawLimit = request.nextUrl.searchParams.get("limit");
  const limit = rawLimit === null ? 25 : Number(rawLimit);
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    return apiError("Le nombre de messages doit être compris entre 1 et 100.", 400);
  }
  try {
    const { account, messages } = await listActiveMailMessages({ limit });
    return apiJson({ account, messages });
  } catch (error) {
    const safe = getSafeMailError(error);
    return apiError(safe.message, safe.status);
  }
}
