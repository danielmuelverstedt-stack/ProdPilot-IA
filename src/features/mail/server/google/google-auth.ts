import "server-only";

import { google } from "googleapis";
import {
  getGoogleServerConfig,
  GOOGLE_OAUTH_SCOPES,
} from "@/features/mail/server/google/google-config";
import { googleTokenRepository } from "@/features/mail/server/google/local-google-token-repository";
import type { StoredGoogleTokens } from "@/features/mail/server/google/google-token-repository";

export function createGoogleAuthorizationUrl(state: string): string {
  const client = createOAuthClient();
  return client.generateAuthUrl({
    access_type: "offline",
    include_granted_scopes: true,
    prompt: "consent",
    scope: [...GOOGLE_OAUTH_SCOPES],
    state,
  });
}

export async function exchangeGoogleAuthorizationCode(code: string): Promise<string> {
  const config = getGoogleServerConfig();
  const client = createOAuthClient();
  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);

  const oauth = google.oauth2({ version: "v2", auth: client as never });
  const profile = await oauth.userinfo.get();
  const emailAddress = profile.data.email?.trim().toLowerCase();
  if (!emailAddress || profile.data.verified_email !== true || emailAddress !== config.allowedEmail) {
    await safelyRevoke(client);
    throw new Error("Ce compte Google n’est pas autorisé pour cette version.");
  }
  if (!tokens.refresh_token) {
    await safelyRevoke(client);
    throw new Error("Google n’a pas fourni de jeton de renouvellement. Révoquez l’accès puis recommencez la connexion.");
  }

  await googleTokenRepository.save({
    emailAddress,
    connectedAt: new Date().toISOString(),
    lastSuccessfulSyncAt: null,
    lastError: null,
    tokens: toStoredTokens(tokens),
  });
  return emailAddress;
}

export async function getAuthorizedGoogleClient() {
  const config = getGoogleServerConfig();
  const record = await googleTokenRepository.get();
  if (!record?.tokens.refreshToken || record.emailAddress.toLowerCase() !== config.allowedEmail) {
    throw new Error("Google Workspace n’est pas connecté.");
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
    void googleTokenRepository.updateTokens(toStoredTokens(tokens)).catch(() => undefined);
  });
  await client.getAccessToken();
  await googleTokenRepository.updateTokens(toStoredTokens(client.credentials));
  return client;
}

export async function disconnectGoogleAccount(): Promise<void> {
  const record = await googleTokenRepository.get();
  if (!record) return;
  try {
    const client = createOAuthClient();
    client.setCredentials({
      access_token: record.tokens.accessToken,
      refresh_token: record.tokens.refreshToken,
    });
    await safelyRevoke(client);
  } finally {
    await googleTokenRepository.delete();
  }
}

function createOAuthClient() {
  const config = getGoogleServerConfig();
  return new google.auth.OAuth2(config.clientId, config.clientSecret, config.redirectUri);
}

function toStoredTokens(tokens: GoogleLibraryCredentials): StoredGoogleTokens {
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
    await client.revokeCredentials();
  } catch {
    // La suppression locale reste obligatoire même si Google est temporairement indisponible.
  }
}

interface GoogleLibraryCredentials {
  access_token?: string | null;
  refresh_token?: string | null;
  expiry_date?: number | null;
  scope?: string;
  token_type?: string | null;
}
