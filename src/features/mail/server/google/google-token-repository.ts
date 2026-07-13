import "server-only";

export interface StoredGoogleTokens {
  accessToken?: string;
  refreshToken?: string;
  scope?: string;
  tokenType?: string;
  expiryDate?: number;
}

export interface GoogleConnectionRecord {
  emailAddress: string;
  connectedAt: string;
  lastSuccessfulSyncAt: string | null;
  lastError: string | null;
  tokens: StoredGoogleTokens;
}

export interface GoogleTokenRepository {
  get(): Promise<GoogleConnectionRecord | null>;
  save(record: GoogleConnectionRecord): Promise<void>;
  updateTokens(tokens: StoredGoogleTokens): Promise<void>;
  updateSynchronization(lastSuccessfulSyncAt: string): Promise<void>;
  updateError(message: string | null): Promise<void>;
  delete(): Promise<void>;
}
