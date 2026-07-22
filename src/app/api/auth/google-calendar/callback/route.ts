import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  disconnectGoogleCalendarAccount,
  exchangeGoogleCalendarAuthorizationCode,
} from "@/features/calendar/server/google/google-calendar-auth";
import { getGoogleCalendarTokenKey } from "@/features/calendar/server/google/google-calendar-account-key";
import { GOOGLE_CALENDAR_OAUTH_STATE_COOKIE } from "@/features/calendar/server/google/google-calendar-config";
import { verifyGoogleCalendarOAuthState } from "@/features/calendar/server/google/google-calendar-oauth-state";
import { getCurrentCalendarOwnerContext } from "@/features/calendar/server/accounts/calendar-owner-context";
import { connectGoogleCalendarAccount } from "@/features/calendar/services/calendar-connections";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const state = request.nextUrl.searchParams.get("state");
  const code = request.nextUrl.searchParams.get("code");
  const oauthError = request.nextUrl.searchParams.get("error");
  const expectedNonce = request.cookies.get(GOOGLE_CALENDAR_OAUTH_STATE_COOKIE)?.value;
  let target = "/reglages/connexions/calendrier?google=error&reason=oauth";

  if (!oauthError && code && state && expectedNonce) {
    try {
      const payload = verifyGoogleCalendarOAuthState(state, expectedNonce, getCurrentCalendarOwnerContext());
      const key = getGoogleCalendarTokenKey(payload.accountId);
      const result = await exchangeGoogleCalendarAuthorizationCode(code, key);
      try {
        await connectGoogleCalendarAccount({ accountId: payload.accountId, emailAddress: result.emailAddress, connectedAt: result.connectedAt });
      } catch (error) {
        await disconnectGoogleCalendarAccount(key);
        throw error;
      }
      target = "/reglages/connexions/calendrier?google=connected";
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (message.includes("autorisé")) target = "/reglages/connexions/calendrier?google=error&reason=account";
      else if (message.includes("état") || message.includes("CSRF") || message.includes("expiré")) target = "/reglages/connexions/calendrier?google=error&reason=state";
      else target = "/reglages/connexions/calendrier?google=error&reason=token";
    }
  } else if (!oauthError) {
    target = "/reglages/connexions/calendrier?google=error&reason=state";
  }

  const response = NextResponse.redirect(new URL(target, request.url));
  response.cookies.set(GOOGLE_CALENDAR_OAUTH_STATE_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    path: "/",
  });
  return response;
}
