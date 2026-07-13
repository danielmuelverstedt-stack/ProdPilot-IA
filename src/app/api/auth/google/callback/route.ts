import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  disconnectGoogleAccount,
  exchangeGoogleAuthorizationCode,
} from "@/features/mail/server/google/google-auth";
import { getGoogleTokenKey } from "@/features/mail/server/google/google-account-key";
import { GOOGLE_OAUTH_STATE_COOKIE } from "@/features/mail/server/google/google-config";
import { verifyGoogleOAuthState } from "@/features/mail/server/google/google-oauth-state";
import { getCurrentMailOwnerContext } from "@/features/mail/server/accounts/mail-owner-context";
import { connectGoogleMailAccount } from "@/features/mail/services/mail-connections";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const state = request.nextUrl.searchParams.get("state");
  const code = request.nextUrl.searchParams.get("code");
  const oauthError = request.nextUrl.searchParams.get("error");
  const expectedNonce = request.cookies.get(GOOGLE_OAUTH_STATE_COOKIE)?.value;
  let target = "/reglages/connexions/messagerie?google=error&reason=oauth";

  if (!oauthError && code && state && expectedNonce) {
    try {
      const payload = verifyGoogleOAuthState(
        state,
        expectedNonce,
        getCurrentMailOwnerContext(),
      );
      const key = getGoogleTokenKey(payload.accountId);
      const result = await exchangeGoogleAuthorizationCode(code, key);
      try {
        await connectGoogleMailAccount({
          accountId: payload.accountId,
          emailAddress: result.emailAddress,
          connectedAt: result.connectedAt,
        });
      } catch (error) {
        await disconnectGoogleAccount(key);
        throw error;
      }
      target = "/reglages/connexions/messagerie?google=connected";
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (message.includes("autorisé")) target = "/reglages/connexions/messagerie?google=error&reason=account";
      else if (message.includes("état") || message.includes("CSRF") || message.includes("expiré")) {
        target = "/reglages/connexions/messagerie?google=error&reason=state";
      } else target = "/reglages/connexions/messagerie?google=error&reason=token";
    }
  } else if (!oauthError) {
    target = "/reglages/connexions/messagerie?google=error&reason=state";
  }

  const response = NextResponse.redirect(new URL(target, request.url));
  response.cookies.set(GOOGLE_OAUTH_STATE_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    path: "/",
  });
  return response;
}
