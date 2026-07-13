import "server-only";

import {
  getMailProvider,
  getMailProviders,
} from "@/features/mail/providers/provider-factory";
import type {
  MailConnectionSummary,
  MailProviderType,
} from "@/features/mail/types/mail";

async function toConnectionSummary(
  providerType: MailProviderType,
): Promise<MailConnectionSummary> {
  const provider = getMailProvider(providerType);
  const status = await provider.getConnectionStatus();

  return {
    ...status,
    providerName: provider.name,
    description: provider.description,
    isMock: provider.isMock,
  };
}

export async function getMailConnectionSummaries(): Promise<
  MailConnectionSummary[]
> {
  return Promise.all(
    getMailProviders().map((provider) => toConnectionSummary(provider.type)),
  );
}

export async function connectMailProvider(
  providerType: MailProviderType,
): Promise<MailConnectionSummary> {
  const provider = getMailProvider(providerType);

  if (!provider.isAvailable) {
    throw new Error(
      `La connexion ${provider.name} n’est pas encore disponible.`,
    );
  }

  await provider.connect();
  return toConnectionSummary(providerType);
}

export async function disconnectMailProvider(
  providerType: MailProviderType,
): Promise<MailConnectionSummary> {
  const provider = getMailProvider(providerType);
  await provider.disconnect();
  return toConnectionSummary(providerType);
}
