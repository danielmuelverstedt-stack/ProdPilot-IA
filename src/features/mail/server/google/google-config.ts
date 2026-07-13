import "server-only";

export const GOOGLE_OAUTH_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.compose",
] as const;

export const GOOGLE_LOCAL_REDIRECT_URI = "http://localhost:3000/api/auth/google/callback";
export const GOOGLE_OAUTH_STATE_COOKIE = "prodpilot_google_oauth_nonce";
export const GOOGLE_OAUTH_STATE_MAX_AGE_SECONDS = 10 * 60;

export interface GoogleServerConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  allowedEmails: ReadonlySet<string>;
  allowedDomains: ReadonlySet<string>;
}

export function getGoogleServerConfig(): GoogleServerConfig {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  const redirectUri = process.env.GOOGLE_REDIRECT_URI?.trim();
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("La configuration Google Workspace est incomplète.");
  }
  if (redirectUri !== GOOGLE_LOCAL_REDIRECT_URI) {
    throw new Error(`GOOGLE_REDIRECT_URI doit être ${GOOGLE_LOCAL_REDIRECT_URI}.`);
  }

  const allowedEmails = parseList(process.env.GOOGLE_ALLOWED_EMAILS, normalizeEmail);
  const allowedDomains = parseList(process.env.GOOGLE_ALLOWED_DOMAINS, normalizeDomain);
  if (process.env.NODE_ENV === "production" && !allowedEmails.size && !allowedDomains.size) {
    throw new Error("Une politique GOOGLE_ALLOWED_EMAILS ou GOOGLE_ALLOWED_DOMAINS est requise en production.");
  }

  return { clientId, clientSecret, redirectUri, allowedEmails, allowedDomains };
}

export function isGoogleEmailAllowed(emailAddress: string, config = getGoogleServerConfig()): boolean {
  const email = normalizeEmail(emailAddress);
  if (config.allowedEmails.has(email)) return true;
  const domain = email.split("@")[1];
  if (domain && config.allowedDomains.has(domain)) return true;
  return process.env.NODE_ENV !== "production"
    && config.allowedEmails.size === 0
    && config.allowedDomains.size === 0;
}

export function isGoogleConfigured(): boolean {
  try {
    getGoogleServerConfig();
    return true;
  } catch {
    return false;
  }
}

function parseList(value: string | undefined, normalize: (item: string) => string): Set<string> {
  return new Set(
    (value ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .map(normalize),
  );
}

function normalizeEmail(value: string): string {
  const email = value.toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("GOOGLE_ALLOWED_EMAILS contient une adresse invalide.");
  }
  return email;
}

function normalizeDomain(value: string): string {
  const domain = value.toLowerCase().replace(/^@/, "");
  if (!/^[a-z0-9](?:[a-z0-9.-]{0,251}[a-z0-9])?$/.test(domain) || !domain.includes(".")) {
    throw new Error("GOOGLE_ALLOWED_DOMAINS contient un domaine invalide.");
  }
  return domain;
}
