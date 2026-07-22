import "server-only";

export const GOOGLE_CALENDAR_OAUTH_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/calendar.events",
] as const;

export const GOOGLE_CALENDAR_LOCAL_REDIRECT_URI = "http://localhost:3000/api/auth/google-calendar/callback";
export const GOOGLE_CALENDAR_OAUTH_STATE_COOKIE = "prodpilot_google_calendar_oauth_nonce";
export const GOOGLE_CALENDAR_OAUTH_STATE_MAX_AGE_SECONDS = 10 * 60;

const GOOGLE_CLIENT_ID_SUFFIX = ".apps.googleusercontent.com";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface GoogleCalendarServerConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  allowedEmail: string;
}

export type GoogleCalendarConfigurationStatus =
  | { isValid: true }
  | { isValid: false; error: string };

export class GoogleCalendarConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GoogleCalendarConfigurationError";
  }
}

/** Réutilise le même projet Google Cloud que Mail (GOOGLE_CLIENT_ID/SECRET/ALLOWED_EMAIL) avec une URI de redirection dédiée au Calendrier. */
export function getGoogleCalendarServerConfig(): GoogleCalendarServerConfig {
  const clientId = getRequiredVariable("GOOGLE_CLIENT_ID");
  const clientSecret = getRequiredVariable("GOOGLE_CLIENT_SECRET");
  const redirectUri = getRequiredVariable("GOOGLE_CALENDAR_REDIRECT_URI");
  const allowedEmail = getRequiredVariable("GOOGLE_ALLOWED_EMAIL").toLowerCase();

  if (!clientId.endsWith(GOOGLE_CLIENT_ID_SUFFIX) || containsWhitespace(clientId)) {
    throw new GoogleCalendarConfigurationError(
      "GOOGLE_CLIENT_ID est invalide. Utilisez l’identifiant d’un client OAuth Google de type Application Web.",
    );
  }
  if (containsLineBreak(clientSecret)) {
    throw new GoogleCalendarConfigurationError(
      "GOOGLE_CLIENT_SECRET est invalide. Vérifiez la valeur copiée dans votre fichier .env.local.",
    );
  }
  if (redirectUri !== GOOGLE_CALENDAR_LOCAL_REDIRECT_URI) {
    throw new GoogleCalendarConfigurationError(
      `GOOGLE_CALENDAR_REDIRECT_URI doit correspondre exactement à ${GOOGLE_CALENDAR_LOCAL_REDIRECT_URI}.`,
    );
  }
  if (!EMAIL_PATTERN.test(allowedEmail)) {
    throw new GoogleCalendarConfigurationError(
      "GOOGLE_ALLOWED_EMAIL doit contenir une adresse e-mail valide.",
    );
  }

  return { clientId, clientSecret, redirectUri, allowedEmail };
}

export function getGoogleCalendarConfigurationStatus(): GoogleCalendarConfigurationStatus {
  try {
    getGoogleCalendarServerConfig();
    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof GoogleCalendarConfigurationError
        ? error.message
        : "La configuration Google Calendrier n’a pas pu être validée.",
    };
  }
}

export function isGoogleCalendarEmailAllowed(
  emailAddress: string,
  config = getGoogleCalendarServerConfig(),
): boolean {
  return emailAddress.trim().toLowerCase() === config.allowedEmail;
}

function getRequiredVariable(
  name: "GOOGLE_CLIENT_ID" | "GOOGLE_CLIENT_SECRET" | "GOOGLE_CALENDAR_REDIRECT_URI" | "GOOGLE_ALLOWED_EMAIL",
): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new GoogleCalendarConfigurationError(
      `Variable ${name} manquante. Configurez votre fichier .env.local.`,
    );
  }
  return value;
}

function containsWhitespace(value: string): boolean {
  return /\s/.test(value);
}

function containsLineBreak(value: string): boolean {
  return /[\r\n]/.test(value);
}
