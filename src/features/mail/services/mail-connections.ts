import "server-only";

import { getMailProviderForAccount } from "@/features/mail/providers/provider-factory";
import { mailAccountRepository } from "@/features/mail/server/accounts/local-mail-account-repository";
import type { CreateMailAccountInput } from "@/features/mail/server/accounts/mail-account-repository";
import type { MailAccount } from "@/features/mail/types/mail";

export async function getMailAccounts(): Promise<MailAccount[]> {
  return mailAccountRepository.list();
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

export async function activateMailAccount(accountId: string): Promise<MailAccount> {
  return mailAccountRepository.activate(accountId);
}

export async function testMailAccount(accountId: string): Promise<MailAccount> {
  const account = await getRequiredAccount(accountId);
  const provider = getMailProviderForAccount(account);
  const status = await provider.getConnectionStatus();
  if (status.state !== "connected") {
    throw new Error(status.error ?? "La connexion de ce compte n’est pas disponible.");
  }
  return mailAccountRepository.markConnectionTest(accountId, new Date().toISOString());
}

export async function disconnectMailAccount(accountId: string): Promise<void> {
  const account = await getRequiredAccount(accountId);
  await getMailProviderForAccount(account).disconnect();
  await mailAccountRepository.delete(accountId);
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
