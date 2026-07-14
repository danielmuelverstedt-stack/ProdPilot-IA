"use client";

import { useState } from "react";
import { MailAccountCard, type MailAccountAction } from "@/features/mail/components/MailAccountCard";
import { MailAccountSettingsDialog } from "@/features/mail/components/MailAccountSettingsDialog";
import { MailActiveAccountSummary } from "@/features/mail/components/MailActiveAccountSummary";
import { MailDemoAccountDialog } from "@/features/mail/components/MailDemoAccountDialog";
import { MailDialog } from "@/features/mail/components/MailDialog";
import { MailProviderChooser } from "@/features/mail/components/MailProviderChooser";
import type { MailAccount, MailAccountSettings } from "@/features/mail/types/mail";

interface MailConnectionsPanelProps {
  initialAccounts: MailAccount[];
  initialNotice?: { tone: "success" | "error"; message: string };
}

interface AccountsResponse { accounts?: MailAccount[]; message?: string }

export function MailConnectionsPanel({ initialAccounts, initialNotice }: MailConnectionsPanelProps) {
  const [accounts, setAccounts] = useState(initialAccounts);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [notice, setNotice] = useState(initialNotice ?? null);
  const [demoDialogOpen, setDemoDialogOpen] = useState(false);
  const [microsoftDialogOpen, setMicrosoftDialogOpen] = useState(false);
  const [settingsAccount, setSettingsAccount] = useState<MailAccount | null>(null);
  const activeAccount = accounts.find((account) => account.isActive);

  async function update(body: Record<string, unknown>, pending: string, successMessage: string) {
    setPendingKey(pending);
    setNotice(null);
    try {
      const response = await fetch("/api/mail/connections", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const result = await response.json() as AccountsResponse;
      if (!response.ok || !result.accounts) throw new Error(result.message ?? "Le compte n’a pas pu être mis à jour.");
      setAccounts(result.accounts);
      setNotice({ tone: "success" as const, message: successMessage });
      return true;
    } catch (error) {
      setNotice({ tone: "error" as const, message: error instanceof Error ? error.message : "Une erreur inattendue est survenue." });
      return false;
    } finally { setPendingKey(null); }
  }

  async function addDemo(displayName: string, emailAddress: string) {
    return update({ action: "add", provider: "mock", displayName, emailAddress }, "add", "Le compte de démonstration a été ajouté.");
  }

  async function saveSettings(account: MailAccount, displayName: string, settings: MailAccountSettings) {
    return update({ action: "settings", accountId: account.id, displayName, settings }, `${account.id}:settings`, "Les paramètres du compte ont été enregistrés.");
  }

  async function handleAction(account: MailAccount, action: MailAccountAction) {
    if (action === "disconnect" && !window.confirm(`Déconnecter « ${account.displayName} » ? Les autres comptes resteront disponibles.`)) return;
    const messages: Record<MailAccountAction, string> = {
      activate: "Le compte actif a été mis à jour.",
      synchronize: "La synchronisation est terminée.",
      test: account.mode === "demo" ? "Le compte de démonstration fonctionne correctement." : "La connexion a été testée avec succès.",
      disconnect: "Le compte a été déconnecté.",
    };
    await update({ action, accountId: account.id }, `${account.id}:${action}`, messages[action]);
  }

  return <div className="mt-6 space-y-8">
    <MailProviderChooser onAddDemo={() => setDemoDialogOpen(true)} onMicrosoftInfo={() => setMicrosoftDialogOpen(true)} />
    <MailActiveAccountSummary account={activeAccount} />
    <section aria-labelledby="connected-mail-accounts-title"><div><h2 id="connected-mail-accounts-title" className="text-lg font-semibold">Comptes connectés</h2><p className="mt-1 text-sm text-[#64736c]">Le compte actif alimente la messagerie et les futures fonctions IA.</p></div>
      <div aria-live="polite">{notice ? <p role={notice.tone === "error" ? "alert" : "status"} className={`mt-4 rounded-xl border px-4 py-3 text-sm ${notice.tone === "success" ? "border-[#b9dccc] bg-[#edf8f3] text-[#1d694b]" : "border-red-200 bg-red-50 text-red-800"}`}>{notice.message}</p> : null}</div>
      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{accounts.map((account) => <MailAccountCard key={account.id} account={account} pending={pendingKey !== null} onAction={handleAction} onSettings={setSettingsAccount} />)}</div>
    </section>
    <MailDemoAccountDialog open={demoDialogOpen} pending={pendingKey === "add"} onClose={() => setDemoDialogOpen(false)} onAdd={addDemo} />
    {settingsAccount ? <MailAccountSettingsDialog key={settingsAccount.id} account={settingsAccount} pending={pendingKey?.endsWith(":settings") ?? false} onClose={() => setSettingsAccount(null)} onSave={saveSettings} /> : null}
    <MailDialog open={microsoftDialogOpen} title="Microsoft 365" description="Cette intégration est visible pour préparer la future architecture multi-fournisseurs." onClose={() => setMicrosoftDialogOpen(false)}><p className="text-sm leading-6 text-[#40554b]">La connexion via Microsoft Graph sera ajoutée dans une prochaine version. Aucun compte Microsoft réel ne peut encore être connecté, testé ou synchronisé.</p><div className="mt-5 flex justify-end"><button type="button" onClick={() => setMicrosoftDialogOpen(false)} className="min-h-11 rounded-xl bg-[#195c45] px-4 text-sm font-semibold text-white">Compris</button></div></MailDialog>
  </div>;
}
