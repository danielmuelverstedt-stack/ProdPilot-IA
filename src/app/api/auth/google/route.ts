import { randomBytes, randomUUID } from "node:crypto";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createGoogleAuthorizationUrl } from "@/features/mail/server/google/google-auth";
import {
  GOOGLE_OAUTH_STATE_COOKIE,
  GOOGLE_OAUTH_STATE_MAX_AGE_SECONDS,
} from "@/features/mail/server/google/google-config";
import { createGoogleOAuthState } from "@/features/mail/server/google/google-oauth-state";
import { getCurrentMailOwnerContext } from "@/features/mail/server/accounts/mail-owner-context";
import { getGoogleAccountForOAuth } from "@/features/mail/services/mail-connections";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const requestedAccountId = request.nextUrl.searchParams.get("accountId");
    if (requestedAccountId) await getGoogleAccountForOAuth(requestedAccountId);
    const accountId = requestedAccountId ?? `mail-account-${randomUUID()}`;
    const nonce = randomBytes(32).toString("base64url");
    const state = createGoogleOAuthState(accountId, nonce, getCurrentMailOwnerContext());
    const response = NextResponse.redirect(createGoogleAuthorizationUrl(state));
    response.cookies.set(GOOGLE_OAUTH_STATE_COOKIE, nonce, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: GOOGLE_OAUTH_STATE_MAX_AGE_SECONDS,
      path: "/",
    });
    return response;
  } catch {
    return NextResponse.redirect(
      new URL("/reglages/connexions/messagerie?google=error&reason=configuration", request.url),
    );
  }
}
