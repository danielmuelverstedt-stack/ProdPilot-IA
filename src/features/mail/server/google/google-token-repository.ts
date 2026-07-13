import "server-only";

import type { MailProviderType } from "@/features/mail/types/mail";

export interface GoogleTokenKey {
  userId: string;
  companyId: string;
  accountId: string;
  provider: Extract<MailProviderType, "google">;
}

export interface StoredGoogleTokens {
  accessToken?: string;
  refreshToken?: string;
  scope?: string;
  tokenType?: string;
  expiryDate?: number;
}

export interface GoogleConnectionRecord {
  key: GoogleTokenKey;
  emailAddress: string;
  connectedAt: string;
  lastSuccessfulSyncAt: string | null;
  lastError: string | null;
  tokens: StoredGoogleTokens;
}

export interface GoogleTokenRepository {
  get(key: GoogleTokenKey): Promise<GoogleConnectionRecord | null>;
  save(record: GoogleConnectionRecord): Promise<void>;
  updateTokens(key: GoogleTokenKey, tokens: StoredGoogleTokens): Promise<void>;
  updateSynchronization(key: GoogleTokenKey, lastSuccessfulSyncAt: string): Promise<void>;
  updateError(key: GoogleTokenKey, message: string | null): Promise<void>;
  delete(key: GoogleTokenKey): Promise<void>;
}
