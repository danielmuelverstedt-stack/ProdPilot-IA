import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { exchangeGoogleAuthorizationCode } from "@/features/mail/server/google/google-auth";
import { GOOGLE_OAUTH_STATE_COOKIE } from "@/features/mail/server/google/google-config";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const state = request.nextUrl.searchParams.get("state");
  const code = request.nextUrl.searchParams.get("code");
  const oauthError = request.nextUrl.searchParams.get("error");
  const expectedState = request.cookies.get(GOOGLE_OAUTH_STATE_COOKIE)?.value;
  let target = "/reglages/connexions/messagerie?google=error&reason=oauth";

  if (!oauthError && code && state && expectedState && state === expectedState) {
    try {
      await exchangeGoogleAuthorizationCode(code);
      target = "/reglages/connexions/messagerie?google=connected";
    } catch (error) {
      target = error instanceof Error && error.message.includes("n’est pas autorisé")
        ? "/reglages/connexions/messagerie?google=error&reason=account"
        : "/reglages/connexions/messagerie?google=error&reason=token";
    }
  } else if (!oauthError && (!state || !expectedState || state !== expectedState)) {
    target = "/reglages/connexions/messagerie?google=error&reason=state";
  }

  const response = NextResponse.redirect(new URL(target, request.url));
  response.cookies.set(GOOGLE_OAUTH_STATE_COOKIE, "", { httpOnly: true, sameSite: "lax", maxAge: 0, path: "/" });
  return response;
}
