import "server-only";

import { GoogleMailProvider } from "@/features/mail/providers/google/google-mail-provider";
import { MockMailProvider } from "@/features/mail/providers/mock/mock-mail-provider";
import { UnavailableMailProvider } from "@/features/mail/providers/unavailable-mail-provider";
import type { MailProvider } from "@/features/mail/services/mail-provider";
import type { MailAccount } from "@/features/mail/types/mail";

export function getMailProviderForAccount(account: MailAccount): MailProvider {
  if (account.mode === "demo" || account.provider === "mock") {
    return new MockMailProvider(account);
  }
  if (account.provider === "google") return new GoogleMailProvider(account);
  return new UnavailableMailProvider(account.provider);
}
