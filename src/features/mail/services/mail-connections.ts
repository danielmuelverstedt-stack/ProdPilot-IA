import "server-only";

import { isMailAccountSettings } from "@/features/mail/config/mail-account-defaults";
import { getMailProviderForAccount } from "@/features/mail/providers/provider-factory";
import { mailAccountRepository } from "@/features/mail/server/accounts/local-mail-account-repository";
import type { CreateMailAccountInput } from "@/features/mail/server/accounts/mail-account-repository";
import type { MailAccount } from "@/features/mail/types/mail";

export async function getMailAccounts(): Promise<MailAccount[]> {
  const accounts = await mailAccountRepository.list();
  return Promise.all(accounts.map(async (account) => {
    if (account.mode === "demo") return account;
    try {
      const connection = await getMailProviderForAccount(account).getConnectionStatus(account.id);
      return {
        ...account,
        status: connection.state,
        emailAddress: connection.emailAddress ?? account.emailAddress,
        connectedAt: connection.connectedAt ?? account.connectedAt,
        lastSuccessfulSyncAt: connection.lastSuccessfulSyncAt ?? account.lastSuccessfulSyncAt,
        error: connection.error ?? null,
      };
    } catch {
      return {
        ...account,
        status: "error" as const,
        error: "L’état de la connexion n’a pas pu être vérifié.",
      };
    }
  }));
}

export async function addMailAccount(input: CreateMailAccountInput): Promise<MailAccount> {
  return mailAccountRepository.add({
    provider: input.provider,
    emailAddress: normalizeEmail(input.emailAddress),
    displayName: normalizeDisplayName(input.displayName),
  });
}

export async function renameMailAccount(
  accountId: string,
  displayName: string,
): Promise<MailAccount> {
  return mailAccountRepository.rename(accountId, normalizeDisplayName(displayName));
}

export async function updateMailAccountSettings(
  accountId: string,
  displayName: string,
  settings: unknown,
): Promise<MailAccount> {
  if (!isMailAccountSettings(settings)) {
    throw new Error("Les paramètres du compte de messagerie sont invalides.");
  }
  return mailAccountRepository.updateSettings(
    accountId,
    normalizeDisplayName(displayName),
    settings,
  );
}

export async function activateMailAccount(accountId: string): Promise<MailAccount> {
  return mailAccountRepository.activate(accountId);
}

export async function testMailAccount(accountId: string): Promise<MailAccount> {
  const account = await getRequiredAccount(accountId);
  const provider = getMailProviderForAccount(account);
  try {
    const status = await provider.testConnection();
    if (status.state !== "connected") {
      throw new Error(status.error ?? "La connexion de ce compte n’est pas disponible.");
    }
    return mailAccountRepository.markConnectionTest(accountId, new Date().toISOString());
  } catch (error) {
    const message = error instanceof Error ? error.message : "Le test de connexion a échoué.";
    await mailAccountRepository.markConnectionError(accountId, message);
    throw new Error(message);
  }
}

export async function synchronizeMailAccount(accountId: string): Promise<MailAccount> {
  const account = await getRequiredAccount(accountId);
  if (account.mode !== "oauth") {
    throw new Error("Seul un compte réellement connecté peut être synchronisé.");
  }
  const provider = getMailProviderForAccount(account);
  try {
    const connection = await provider.getConnectionStatus(account.id);
    if (connection.state !== "connected") {
      throw new Error(connection.error ?? "Ce compte doit être reconnecté avant la synchronisation.");
    }
    await provider.listMessages({
      limit: account.settings.maximumMessagesRetrieved,
      unreadOnly: account.settings.unreadMessagesOnly,
    });
    return mailAccountRepository.markSynchronization(accountId, new Date().toISOString());
  } catch (error) {
    const message = error instanceof Error ? error.message : "La synchronisation a échoué.";
    await mailAccountRepository.markConnectionError(accountId, message);
    throw new Error(message);
  }
}

export async function disconnectMailAccount(accountId: string): Promise<void> {
  const account = await getRequiredAccount(accountId);
  await getMailProviderForAccount(account).disconnect();
  await mailAccountRepository.delete(accountId);
}

export async function getGoogleAccountForOAuth(accountId: string): Promise<MailAccount> {
  const account = await getRequiredAccount(accountId);
  if (account.provider !== "google") {
    throw new Error("Le compte ciblé n’est pas un compte Google Workspace.");
  }
  return account;
}

export async function connectGoogleMailAccount(input: {
  accountId: string;
  emailAddress: string;
  connectedAt: string;
}): Promise<MailAccount> {
  return mailAccountRepository.connectGoogle(input);
}

async function getRequiredAccount(accountId: string): Promise<MailAccount> {
  if (!/^[-a-zA-Z0-9]{1,100}$/.test(accountId)) {
    throw new Error("L’identifiant du compte de messagerie est invalide.");
  }
  const account = await mailAccountRepository.get(accountId);
  if (!account) throw new Error("Le compte de messagerie est introuvable.");
  return account;
}

function normalizeDisplayName(value: string): string {
  const displayName = value.trim();
  if (!displayName || displayName.length > 80) {
    throw new Error("Le nom du compte doit contenir entre 1 et 80 caractères.");
  }
  return displayName;
}

function normalizeEmail(value: string): string {
  const emailAddress = value.trim().toLowerCase();
  if (emailAddress.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailAddress)) {
    throw new Error("L’adresse e-mail du compte est invalide.");
  }
  return emailAddress;
}
