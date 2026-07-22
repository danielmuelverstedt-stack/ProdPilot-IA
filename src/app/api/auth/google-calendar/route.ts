import { randomBytes, randomUUID } from "node:crypto";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createGoogleCalendarAuthorizationUrl } from "@/features/calendar/server/google/google-calendar-auth";
import {
  GOOGLE_CALENDAR_OAUTH_STATE_COOKIE,
  GOOGLE_CALENDAR_OAUTH_STATE_MAX_AGE_SECONDS,
} from "@/features/calendar/server/google/google-calendar-config";
import { createGoogleCalendarOAuthState } from "@/features/calendar/server/google/google-calendar-oauth-state";
import { getCurrentCalendarOwnerContext } from "@/features/calendar/server/accounts/calendar-owner-context";
import { getGoogleCalendarAccountForOAuth } from "@/features/calendar/services/calendar-connections";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const requestedAccountId = request.nextUrl.searchParams.get("accountId");
    if (requestedAccountId) await getGoogleCalendarAccountForOAuth(requestedAccountId);
    const accountId = requestedAccountId ?? `calendar-account-${randomUUID()}`;
    const nonce = randomBytes(32).toString("base64url");
    const state = createGoogleCalendarOAuthState(accountId, nonce, getCurrentCalendarOwnerContext());
    const response = NextResponse.redirect(createGoogleCalendarAuthorizationUrl(state));
    response.cookies.set(GOOGLE_CALENDAR_OAUTH_STATE_COOKIE, nonce, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: GOOGLE_CALENDAR_OAUTH_STATE_MAX_AGE_SECONDS,
      path: "/",
    });
    return response;
  } catch {
    return NextResponse.redirect(new URL("/reglages/connexions/calendrier?google=error&reason=configuration", request.url));
  }
}
