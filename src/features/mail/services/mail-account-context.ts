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
  const messages = await provider.listMessages(options);
  if (account.mode === "demo" && process.env.NODE_ENV !== "production") {
    await mailAccountRepository.markSynchronization(account.id, new Date().toISOString());
  }
  return { account, messages };
}
