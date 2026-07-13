import "server-only";

import { GoogleMailProvider } from "@/features/mail/providers/google/google-mail-provider";
import { MicrosoftMailProvider } from "@/features/mail/providers/microsoft/microsoft-mail-provider";
import { MockMailProvider } from "@/features/mail/providers/mock/mock-mail-provider";
import type { MailProvider } from "@/features/mail/services/mail-provider";
import type { MailAccount } from "@/features/mail/types/mail";

const microsoftProvider = new MicrosoftMailProvider();

export function getMailProviderForAccount(account: MailAccount): MailProvider {
  if (account.mode === "demo" || account.provider === "mock") {
    return new MockMailProvider(account);
  }
  return account.provider === "google" ? new GoogleMailProvider(account) : microsoftProvider;
}
