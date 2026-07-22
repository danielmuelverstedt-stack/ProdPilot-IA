import "server-only";

import { google } from "googleapis";
import {
  getGoogleCalendarServerConfig,
  GOOGLE_CALENDAR_OAUTH_SCOPES,
  isGoogleCalendarEmailAllowed,
} from "@/features/calendar/server/google/google-calendar-config";
import { googleCalendarTokenRepository } from "@/features/calendar/server/google/local-google-calendar-token-repository";
import type {
  GoogleCalendarTokenKey,
  StoredGoogleCalendarTokens,
} from "@/features/calendar/server/google/google-calendar-token-repository";

export function createGoogleCalendarAuthorizationUrl(state: string): string {
  return createOAuthClient().generateAuthUrl({
    access_type: "offline",
    include_granted_scopes: true,
    prompt: "consent",
    scope: [...GOOGLE_CALENDAR_OAUTH_SCOPES],
    state,
  });
}

export async function exchangeGoogleCalendarAuthorizationCode(
  code: string,
  key: GoogleCalendarTokenKey,
): Promise<{ emailAddress: string; connectedAt: string }> {
  const config = getGoogleCalendarServerConfig();
  const client = createOAuthClient();
  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);

  const oauth = google.oauth2({ version: "v2", auth: client as never });
  const profile = await oauth.userinfo.get();
  const emailAddress = profile.data.email?.trim().toLowerCase();
  if (!emailAddress || profile.data.verified_email !== true || !isGoogleCalendarEmailAllowed(emailAddress, config)) {
    await safelyRevoke(client);
    throw new Error("Ce compte Google n’est pas autorisé par la politique serveur.");
  }
  if (!tokens.refresh_token) {
    await safelyRevoke(client);
    throw new Error("Google n’a pas fourni de jeton de renouvellement. Révoquez l’accès puis recommencez la connexion.");
  }

  const connectedAt = new Date().toISOString();
  await googleCalendarTokenRepository.save({
    key,
    emailAddress,
    connectedAt,
    lastSuccessfulSyncAt: null,
    lastError: null,
    tokens: toStoredTokens(tokens),
  });
  return { emailAddress, connectedAt };
}

export async function getAuthorizedGoogleCalendarClient(key: GoogleCalendarTokenKey) {
  const config = getGoogleCalendarServerConfig();
  const record = await googleCalendarTokenRepository.get(key);
  if (!record?.tokens.refreshToken || !isGoogleCalendarEmailAllowed(record.emailAddress, config)) {
    throw new Error("Google Calendrier n’est pas connecté pour ce compte.");
  }

  const client = createOAuthClient();
  client.setCredentials({
    access_token: record.tokens.accessToken,
    refresh_token: record.tokens.refreshToken,
    expiry_date: record.tokens.expiryDate,
    scope: record.tokens.scope,
    token_type: record.tokens.tokenType,
  });
  client.on("tokens", (tokens) => {
    void googleCalendarTokenRepository.updateTokens(key, toStoredTokens(tokens)).catch(() => undefined);
  });
  try {
    await client.getAccessToken();
    await googleCalendarTokenRepository.updateTokens(key, toStoredTokens(client.credentials));
  } catch {
    await googleCalendarTokenRepository.updateError(key, "La session Google a expiré ou a été révoquée. Reconnectez ce compte.");
    throw new Error("La session Google a expiré ou a été révoquée. Reconnectez ce compte.");
  }
  return client;
}

export async function testGoogleCalendarConnection(key: GoogleCalendarTokenKey): Promise<{ emailAddress: string }> {
  const record = await googleCalendarTokenRepository.get(key);
  if (!record) throw new Error("Google Calendrier n’est pas connecté pour ce compte.");
  const auth = await getAuthorizedGoogleCalendarClient(key);
  try {
    const oauth = google.oauth2({ version: "v2", auth: auth as never });
    const profile = await oauth.userinfo.get();
    const emailAddress = profile.data.email?.trim().toLowerCase();
    if (!emailAddress || emailAddress !== record.emailAddress.toLowerCase()) {
      throw new Error("L’identité Google reçue ne correspond pas au compte sélectionné.");
    }
    await googleCalendarTokenRepository.updateError(key, null);
    return { emailAddress };
  } catch (error) {
    const message = error instanceof Error && error.message.includes("correspond pas")
      ? error.message
      : "La session Google a expiré ou a été révoquée. Reconnectez ce compte.";
    await googleCalendarTokenRepository.updateError(key, message);
    throw new Error(message);
  }
}

export async function disconnectGoogleCalendarAccount(key: GoogleCalendarTokenKey): Promise<void> {
  const record = await googleCalendarTokenRepository.get(key);
  if (!record) return;
  try {
    const client = createOAuthClient();
    client.setCredentials({ access_token: record.tokens.accessToken, refresh_token: record.tokens.refreshToken });
    await safelyRevoke(client);
  } finally {
    await googleCalendarTokenRepository.delete(key);
  }
}

function createOAuthClient() {
  const config = getGoogleCalendarServerConfig();
  return new google.auth.OAuth2(config.clientId, config.clientSecret, config.redirectUri);
}

function toStoredTokens(tokens: GoogleLibraryCredentials): StoredGoogleCalendarTokens {
  return {
    accessToken: tokens.access_token ?? undefined,
    refreshToken: tokens.refresh_token ?? undefined,
    expiryDate: tokens.expiry_date ?? undefined,
    scope: tokens.scope ?? undefined,
    tokenType: tokens.token_type ?? undefined,
  };
}

async function safelyRevoke(client: ReturnType<typeof createOAuthClient>): Promise<void> {
  try {
    const token = client.credentials.refresh_token ?? client.credentials.access_token;
    if (token) await client.revokeToken(token);
  } catch {
    // La suppression locale du compte ciblé reste obligatoire.
  }
}

interface GoogleLibraryCredentials {
  access_token?: string | null;
  refresh_token?: string | null;
  expiry_date?: number | null;
  scope?: string;
  token_type?: string | null;
}
