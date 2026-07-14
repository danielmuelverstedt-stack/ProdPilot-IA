import "server-only";

import { getMailProviderForAccount } from "@/features/mail/providers/provider-factory";
import { mailAccountRepository } from "@/features/mail/server/accounts/local-mail-account-repository";
import { searchMailMessages } from "@/features/mail/services/mail-search";
import type { ListMessagesOptions, MailSearchCriteria } from "@/features/mail/types/mail";

/** Point d’entrée unique pour la messagerie et les futures fonctions IA liées aux e-mails. */
export async function getActiveMailContext() {
  const account = await mailAccountRepository.getActive();
  return {
    account,
    provider: getMailProviderForAccount(account),
  };
}

export async function searchActiveMailMessages(criteria: MailSearchCriteria) {
  const { account, provider } = await getActiveMailContext();
  if (account.status !== "connected") return { account, messages: [] };
  const messages = await provider.searchMessages({ ...criteria, accountId: account.id, provider: account.provider });
  return { account, messages: searchMailMessages(messages, criteria) };
}

export async function listActiveMailMessages(options?: ListMessagesOptions) {
  const { account, provider } = await getActiveMailContext();
  if (account.status !== "connected") return { account, messages: [] };
  try {
    const messages = await provider.listMessages({
      ...options,
      limit: Math.min(
        options?.limit ?? account.settings.maximumMessagesRetrieved,
        account.settings.maximumMessagesRetrieved,
      ),
      unreadOnly: options?.unreadOnly ?? account.settings.unreadMessagesOnly,
    });
    await mailAccountRepository.markSynchronization(account.id, new Date().toISOString());
    return {
      account,
      messages: account.settings.includeAttachmentMetadata
        ? messages
        : messages.map((message) => ({ ...message, attachments: [] })),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "La lecture des messages a échoué.";
    await mailAccountRepository.markConnectionError(account.id, message);
    throw error;
  }
}
