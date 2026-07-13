import "server-only";

import { GoogleMailProvider } from "@/features/mail/providers/google/google-mail-provider";
import { MicrosoftMailProvider } from "@/features/mail/providers/microsoft/microsoft-mail-provider";
import type { MailProvider } from "@/features/mail/services/mail-provider";
import type {
  MailAccount,
  MailProviderType,
} from "@/features/mail/types/mail";

const providers: Record<MailProviderType, MailProvider> = {
  google: new GoogleMailProvider(),
  microsoft: new MicrosoftMailProvider(),
};

export function getMailProvider(
  accountOrType: Pick<MailAccount, "provider"> | MailProviderType,
): MailProvider {
  const providerType =
    typeof accountOrType === "string"
      ? accountOrType
      : accountOrType.provider;

  return providers[providerType];
}

export function getMailProviders(): MailProvider[] {
  return Object.values(providers);
}
