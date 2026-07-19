import "server-only";

import { getMailProviderForAccount } from "@/features/mail/providers/provider-factory";
import { mailAccountRepository } from "@/features/mail/server/accounts/local-mail-account-repository";
import { searchMailMessages } from "@/features/mail/services/mail-search";
import { readMailMessageCache, writeMailMessageCache } from "@/features/mail/services/mail-message-cache";
import type { ListMessagesOptions, MailSearchCriteria, MailSynchronizationSummary } from "@/features/mail/types/mail";

const MAIL_CACHE_TTL_MS = 60_000;

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
  if (account.status !== "connected" && account.mode !== "oauth") return { account, messages: [] };
  const messages = await provider.searchMessages({ ...criteria, accountId: account.id, provider: account.provider });
  return { account, messages: searchMailMessages(messages, criteria) };
}

export async function listActiveMailMessages(options?: ListMessagesOptions) {
  const { account, provider } = await getActiveMailContext();
  if (account.status !== "connected" && account.mode !== "oauth") return { account, messages: [], synchronization: null };
  const cacheKey = JSON.stringify({
    retrieveAll: options?.retrieveAll === true,
    limit: options?.retrieveAll ? null : options?.limit ?? account.settings.maximumMessagesRetrieved,
    unreadOnly: options?.unreadOnly ?? account.settings.unreadMessagesOnly,
    category: options?.category ?? null,
  });
  if (!options?.forceRefresh) {
    const cached = readMailMessageCache(account.id, cacheKey);
    if (cached) return { account, messages: cached.messages, synchronization: { ...cached.synchronization, cache: "hit" as const } };
  }
  try {
    const startedAt = Date.now();
    const messages = await provider.listMessages({
      ...options,
      limit: options?.retrieveAll
        ? undefined
        : Math.min(options?.limit ?? account.settings.maximumMessagesRetrieved, account.settings.maximumMessagesRetrieved),
      unreadOnly: options?.unreadOnly ?? account.settings.unreadMessagesOnly,
    });
    const statistics = options?.retrieveAll ? await provider.getMailboxStatistics() : null;
    const completedAt = new Date().toISOString();
    const synchronization: MailSynchronizationSummary = {
      synchronizedMessages: messages.length,
      detectedMessages: statistics?.inboxMessages ?? null,
      isComplete: statistics ? messages.length === statistics.inboxMessages : false,
      pageCount: statistics ? Math.max(1, Math.ceil(statistics.inboxMessages / 500)) : 1,
      durationMs: Date.now() - startedAt,
      completedAt,
      cache: "miss",
    };
    const synchronizedAccount = await mailAccountRepository.markSynchronization(account.id, completedAt);
    const visibleMessages = account.settings.includeAttachmentMetadata ? messages : messages.map((message) => ({ ...message, attachments: [] }));
    writeMailMessageCache({ accountId: account.id, key: cacheKey, messages: visibleMessages, synchronization }, MAIL_CACHE_TTL_MS);
    return {
      account: synchronizedAccount,
      messages: visibleMessages,
      synchronization,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "La lecture des messages a échoué.";
    await mailAccountRepository.markConnectionError(account.id, message);
    throw error;
  }
}
