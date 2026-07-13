import "server-only";

import { getMailProviderForAccount } from "@/features/mail/providers/provider-factory";
import { mailAccountRepository } from "@/features/mail/server/accounts/local-mail-account-repository";
import type { ListMessagesOptions } from "@/features/mail/types/mail";

/** Point d’entrée unique pour la messagerie et les futures fonctions IA liées aux e-mails. */
export async function getActiveMailContext() {
  const account = await mailAccountRepository.getActive();
  return {
    account,
    provider: getMailProviderForAccount(account),
  };
}

export async function listActiveMailMessages(options?: ListMessagesOptions) {
  const { account, provider } = await getActiveMailContext();
  if (account.status !== "connected") return { account, messages: [] };
  try {
    const messages = await provider.listMessages(options);
    await mailAccountRepository.markSynchronization(account.id, new Date().toISOString());
    return { account, messages };
  } catch (error) {
    const message = error instanceof Error ? error.message : "La lecture des messages a échoué.";
    await mailAccountRepository.markConnectionError(account.id, message);
    throw error;
  }
}
