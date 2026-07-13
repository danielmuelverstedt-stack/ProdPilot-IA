import "server-only";

export const GOOGLE_OAUTH_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.compose",
] as const;

export const GOOGLE_LOCAL_REDIRECT_URI = "http://localhost:3000/api/auth/google/callback";
export const GOOGLE_FIRST_ALLOWED_EMAIL = "daniel.muelverstedt@tkmi.be";
export const GOOGLE_OAUTH_STATE_COOKIE = "prodpilot_google_oauth_state";

export interface GoogleServerConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  allowedEmail: string;
}

export function getGoogleServerConfig(): GoogleServerConfig {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  const redirectUri = process.env.GOOGLE_REDIRECT_URI?.trim();
  const allowedEmail = process.env.GOOGLE_ALLOWED_EMAIL?.trim().toLowerCase();

  if (!clientId || !clientSecret || !redirectUri || !allowedEmail) {
    throw new Error("La configuration Google Workspace est incomplète.");
  }
  if (redirectUri !== GOOGLE_LOCAL_REDIRECT_URI) {
    throw new Error(`GOOGLE_REDIRECT_URI doit être ${GOOGLE_LOCAL_REDIRECT_URI}.`);
  }
  if (allowedEmail !== GOOGLE_FIRST_ALLOWED_EMAIL) {
    throw new Error(`GOOGLE_ALLOWED_EMAIL doit être ${GOOGLE_FIRST_ALLOWED_EMAIL} pour cette première version.`);
  }

  return { clientId, clientSecret, redirectUri, allowedEmail };
}

export function isGoogleConfigured(): boolean {
  try {
    getGoogleServerConfig();
    return true;
  } catch {
    return false;
  }
}
