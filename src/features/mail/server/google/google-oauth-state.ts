import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import {
  getGoogleServerConfig,
  GOOGLE_OAUTH_STATE_MAX_AGE_SECONDS,
} from "@/features/mail/server/google/google-config";
import type { MailOwnerContext } from "@/features/mail/server/accounts/mail-owner-context";

interface GoogleOAuthStatePayload extends MailOwnerContext {
  version: 1;
  accountId: string;
  nonce: string;
  issuedAt: number;
  expiresAt: number;
}

export function createGoogleOAuthState(
  accountId: string,
  nonce: string,
  owner: MailOwnerContext,
  now = Date.now(),
): string {
  assertStateValue(accountId, "identifiant de compte");
  assertStateValue(nonce, "nonce");
  const payload: GoogleOAuthStatePayload = {
    version: 1,
    accountId,
    nonce,
    ...owner,
    issuedAt: now,
    expiresAt: now + GOOGLE_OAUTH_STATE_MAX_AGE_SECONDS * 1000,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

export function verifyGoogleOAuthState(
  state: string,
  expectedNonce: string,
  owner: MailOwnerContext,
  now = Date.now(),
): GoogleOAuthStatePayload {
  const [encoded, signature, extra] = state.split(".");
  if (!encoded || !signature || extra) throw new Error("L’état OAuth Google est invalide.");
  const expectedSignature = sign(encoded);
  if (!safeEqual(signature, expectedSignature)) throw new Error("L’état OAuth Google a été altéré.");

  let payload: unknown;
  try {
    payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
  } catch {
    throw new Error("L’état OAuth Google est invalide.");
  }
  if (!isStatePayload(payload)) throw new Error("L’état OAuth Google est invalide.");
  if (payload.expiresAt < now || payload.issuedAt > now + 30_000) {
    throw new Error("L’autorisation Google a expiré. Recommencez la connexion.");
  }
  if (!safeEqual(payload.nonce, expectedNonce)) throw new Error("La vérification CSRF Google a échoué.");
  if (payload.userId !== owner.userId || payload.companyId !== owner.companyId) {
    throw new Error("Le contexte du compte Google est invalide.");
  }
  return payload;
}

function sign(value: string): string {
  const secret = getGoogleServerConfig().clientSecret;
  return createHmac("sha256", secret).update(`prodpilot-google-oauth-state:v1:${value}`).digest("base64url");
}

function safeEqual(first: string, second: string): boolean {
  const firstBuffer = Buffer.from(first);
  const secondBuffer = Buffer.from(second);
  return firstBuffer.length === secondBuffer.length && timingSafeEqual(firstBuffer, secondBuffer);
}

function isStatePayload(value: unknown): value is GoogleOAuthStatePayload {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Record<string, unknown>;
  return item.version === 1
    && typeof item.accountId === "string"
    && /^[-a-zA-Z0-9]{1,100}$/.test(item.accountId)
    && typeof item.nonce === "string"
    && item.nonce.length >= 20
    && typeof item.userId === "string"
    && typeof item.companyId === "string"
    && typeof item.issuedAt === "number"
    && typeof item.expiresAt === "number";
}

function assertStateValue(value: string, label: string): void {
  if (!/^[-a-zA-Z0-9_]{1,200}$/.test(value)) throw new Error(`Le ${label} OAuth Google est invalide.`);
}
