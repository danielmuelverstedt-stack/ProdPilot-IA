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

const GOOGLE_CLIENT_ID_SUFFIX = ".apps.googleusercontent.com";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface GoogleServerConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  allowedEmail: string;
}

export type GoogleConfigurationStatus =
  | { isValid: true }
  | { isValid: false; error: string };

export class GoogleConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GoogleConfigurationError";
  }
}

export function getGoogleServerConfig(): GoogleServerConfig {
  const clientId = getRequiredVariable("GOOGLE_CLIENT_ID");
  const clientSecret = getRequiredVariable("GOOGLE_CLIENT_SECRET");
  const redirectUri = getRequiredVariable("GOOGLE_REDIRECT_URI");
  const allowedEmail = getRequiredVariable("GOOGLE_ALLOWED_EMAIL").toLowerCase();

  if (!clientId.endsWith(GOOGLE_CLIENT_ID_SUFFIX) || containsWhitespace(clientId)) {
    throw new GoogleConfigurationError(
      "GOOGLE_CLIENT_ID est invalide. Utilisez l’identifiant d’un client OAuth Google de type Application Web.",
    );
  }
  if (containsLineBreak(clientSecret)) {
    throw new GoogleConfigurationError(
      "GOOGLE_CLIENT_SECRET est invalide. Vérifiez la valeur copiée dans votre fichier .env.local.",
    );
  }
  if (redirectUri !== GOOGLE_LOCAL_REDIRECT_URI) {
    throw new GoogleConfigurationError(
      `GOOGLE_REDIRECT_URI doit correspondre exactement à ${GOOGLE_LOCAL_REDIRECT_URI}.`,
    );
  }
  if (!EMAIL_PATTERN.test(allowedEmail)) {
    throw new GoogleConfigurationError(
      "GOOGLE_ALLOWED_EMAIL doit contenir une adresse e-mail valide.",
    );
  }

  return { clientId, clientSecret, redirectUri, allowedEmail };
}

export function getGoogleConfigurationStatus(): GoogleConfigurationStatus {
  try {
    getGoogleServerConfig();
    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof GoogleConfigurationError
        ? error.message
        : "La configuration Google Workspace n’a pas pu être validée.",
    };
  }
}

export function isGoogleEmailAllowed(
  emailAddress: string,
  config = getGoogleServerConfig(),
): boolean {
  return emailAddress.trim().toLowerCase() === config.allowedEmail;
}

function getRequiredVariable(
  name:
    | "GOOGLE_CLIENT_ID"
    | "GOOGLE_CLIENT_SECRET"
    | "GOOGLE_REDIRECT_URI"
    | "GOOGLE_ALLOWED_EMAIL",
): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new GoogleConfigurationError(
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
