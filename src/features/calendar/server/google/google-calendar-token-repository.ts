import "server-only";

export interface GoogleCalendarTokenKey {
  userId: string;
  companyId: string;
  accountId: string;
  provider: "google-calendar";
}

export interface StoredGoogleCalendarTokens {
  accessToken?: string;
  refreshToken?: string;
  scope?: string;
  tokenType?: string;
  expiryDate?: number;
}

export interface GoogleCalendarConnectionRecord {
  key: GoogleCalendarTokenKey;
  emailAddress: string;
  connectedAt: string;
  lastSuccessfulSyncAt: string | null;
  lastError: string | null;
  tokens: StoredGoogleCalendarTokens;
}

export interface GoogleCalendarTokenRepository {
  get(key: GoogleCalendarTokenKey): Promise<GoogleCalendarConnectionRecord | null>;
  save(record: GoogleCalendarConnectionRecord): Promise<void>;
  updateTokens(key: GoogleCalendarTokenKey, tokens: StoredGoogleCalendarTokens): Promise<void>;
  updateSynchronization(key: GoogleCalendarTokenKey, lastSuccessfulSyncAt: string): Promise<void>;
  updateError(key: GoogleCalendarTokenKey, message: string | null): Promise<void>;
  delete(key: GoogleCalendarTokenKey): Promise<void>;
}
