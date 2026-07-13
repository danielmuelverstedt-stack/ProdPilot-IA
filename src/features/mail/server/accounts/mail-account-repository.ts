import "server-only";

import type { MailAccount, MailProviderType } from "@/features/mail/types/mail";

export interface CreateMailAccountInput {
  provider: MailProviderType;
  emailAddress: string;
  displayName: string;
}

export interface ConnectGoogleAccountInput {
  accountId: string;
  emailAddress: string;
  connectedAt: string;
}

export interface MailAccountRepository {
  list(): Promise<MailAccount[]>;
  get(accountId: string): Promise<MailAccount | null>;
  getActive(): Promise<MailAccount>;
  add(input: CreateMailAccountInput): Promise<MailAccount>;
  connectGoogle(input: ConnectGoogleAccountInput): Promise<MailAccount>;
  rename(accountId: string, displayName: string): Promise<MailAccount>;
  activate(accountId: string): Promise<MailAccount>;
  markConnectionTest(accountId: string, testedAt: string): Promise<MailAccount>;
  markSynchronization(accountId: string, synchronizedAt: string): Promise<MailAccount>;
  markConnectionError(accountId: string, message: string): Promise<MailAccount>;
  delete(accountId: string): Promise<void>;
}
