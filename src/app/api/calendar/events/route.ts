import type { NextRequest } from "next/server";
import { listActiveCalendarEventsBetween } from "@/features/calendar/services/calendar-account-context";
import { apiError, apiJson } from "@/features/mail/server/mail-api-response";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const start = request.nextUrl.searchParams.get("start");
  const end = request.nextUrl.searchParams.get("end");
  if (!start || !end || Number.isNaN(Date.parse(start)) || Number.isNaN(Date.parse(end))) {
    return apiError("La plage de dates demandée est invalide.", 400);
  }
  try {
    const { account, events } = await listActiveCalendarEventsBetween(start, end);
    return apiJson({ account, events });
  } catch (error) {
    return apiError(error instanceof Error ? error.message : "La lecture du calendrier a échoué.", 502);
  }
}
