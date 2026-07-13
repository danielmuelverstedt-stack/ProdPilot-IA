import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { createGoogleAuthorizationUrl } from "@/features/mail/server/google/google-auth";
import { GOOGLE_OAUTH_STATE_COOKIE } from "@/features/mail/server/google/google-config";

export const runtime = "nodejs";

export async function GET() {
  try {
    const state = randomBytes(32).toString("base64url");
    const response = NextResponse.redirect(createGoogleAuthorizationUrl(state));
    response.cookies.set(GOOGLE_OAUTH_STATE_COOKIE, state, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 10 * 60,
      path: "/",
    });
    return response;
  } catch {
    return NextResponse.redirect(new URL("/reglages/connexions/messagerie?google=error&reason=configuration", "http://localhost:3000"));
  }
}
