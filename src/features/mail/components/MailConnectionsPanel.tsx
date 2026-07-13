"use client";

import { useState, type FormEvent } from "react";
import type { MailAccount, MailProviderType } from "@/features/mail/types/mail";

interface MailConnectionsPanelProps {
  initialAccounts: MailAccount[];
  initialNotice?: { tone: "success" | "error"; message: string };
}

interface AccountsResponse {
  accounts?: MailAccount[];
  message?: string;
}

type AccountAction = "activate" | "test" | "disconnect";

const providerLabels: Record<MailProviderType, string> = {
  google: "Google Workspace",
  microsoft: "Microsoft 365",
  mock: "Mock",
};

const dateFormatter = new Intl.DateTimeFormat("fr-BE", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "Europe/Brussels",
});

export function MailConnectionsPanel({ initialAccounts, initialNotice }: MailConnectionsPanelProps) {
  const [accounts, setAccounts] = useState(initialAccounts);
  const [isAdding, setIsAdding] = useState(false);
  const [provider, setProvider] = useState<MailProviderType>("mock");
  const [displayName, setDisplayName] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ tone: "success" | "error"; message: string } | null>(initialNotice ?? null);

  async function requestAccountUpdate(
    body: Record<string, unknown>,
    pending: string,
    successMessage: string,
  ) {
    setPendingKey(pending);
    setNotice(null);
    try {
      const response = await fetch("/api/mail/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await response.json() as AccountsResponse;
      if (!response.ok || !result.accounts) {
        throw new Error(result.message ?? "Le compte n’a pas pu être mis à jour.");
      }
      setAccounts(result.accounts);
      setNotice({ tone: "success", message: successMessage });
      return true;
    } catch (error) {
      setNotice({
        tone: "error",
        message: error instanceof Error ? error.message : "Une erreur inattendue est survenue.",
      });
      return false;
    } finally {
      setPendingKey(null);
    }
  }

  async function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const succeeded = await requestAccountUpdate(
      { action: "add", provider, displayName, emailAddress },
      "add",
      "Le compte de démonstration est connecté.",
    );
    if (succeeded) {
      setDisplayName("");
      setEmailAddress("");
      setIsAdding(false);
    }
  }

  async function handleRename(account: MailAccount) {
    const nextName = window.prompt("Nouveau nom du compte", account.displayName)?.trim();
    if (!nextName || nextName === account.displayName) return;
    await requestAccountUpdate(
      { action: "rename", accountId: account.id, displayName: nextName },
      `${account.id}:rename`,
      "Le compte a été renommé.",
    );
  }

  async function handleAction(account: MailAccount, action: AccountAction) {
    if (action === "disconnect" && !window.confirm(`Déconnecter « ${account.displayName} » ?`)) return;
    const messages: Record<AccountAction, string> = {
      activate: "Le compte actif a été mis à jour.",
      test: account.mode === "oauth"
        ? "Connexion Google testée avec succès."
        : "La connexion de démonstration fonctionne correctement.",
      disconnect: "Le compte a été déconnecté.",
    };
    await requestAccountUpdate(
      { action, accountId: account.id },
      `${account.id}:${action}`,
      messages[action],
    );
  }

  return (
    <div className="mt-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[#17211d]">Comptes connectés</h2>
          <p className="mt-1 text-sm text-[#64736c]">
            Le compte actif alimente Mails et constituera l’unique contexte des futures fonctions IA.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href="/api/auth/google" className="inline-flex min-h-11 items-center rounded-xl bg-[#195c45] px-4 text-sm font-semibold text-white hover:bg-[#104432]">
            Connecter Google Workspace
          </a>
          <button
            type="button"
            onClick={() => setIsAdding((current) => !current)}
            className="min-h-11 rounded-xl border border-[#cbd7d1] bg-white px-4 text-sm font-semibold text-[#40554b]"
          >
            {isAdding ? "Fermer" : "Ajouter un compte de démonstration"}
          </button>
        </div>
      </div>

      {isAdding ? (
        <form onSubmit={handleAdd} className="mt-5 grid gap-4 rounded-2xl border border-[#d7e2dd] bg-white p-5 sm:grid-cols-2">
          <label className="text-sm font-medium text-[#33473e]">
            Fournisseur
            <select
              value={provider}
              onChange={(event) => setProvider(event.target.value as MailProviderType)}
              className="mt-1 min-h-11 w-full rounded-xl border border-[#cad7d1] bg-white px-3"
            >
              <option value="mock">Mock</option>
              <option value="microsoft">Microsoft 365</option>
            </select>
          </label>
          <label className="text-sm font-medium text-[#33473e]">
            Nom du compte
            <input required maxLength={80} value={displayName} onChange={(event) => setDisplayName(event.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-[#cad7d1] px-3" placeholder="Production" />
          </label>
          <label className="text-sm font-medium text-[#33473e] sm:col-span-2">
            Adresse e-mail
            <input required type="email" maxLength={254} value={emailAddress} onChange={(event) => setEmailAddress(event.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-[#cad7d1] px-3" placeholder="production@exemple.fr" />
          </label>
          <div className="flex flex-wrap gap-2 sm:col-span-2">
            <button disabled={pendingKey !== null} className="min-h-11 rounded-xl bg-[#195c45] px-4 text-sm font-semibold text-white disabled:opacity-50">
              {pendingKey === "add" ? "Connexion…" : "Connecter"}
            </button>
            <button type="button" onClick={() => setIsAdding(false)} className="min-h-11 rounded-xl border border-[#cbd7d1] px-4 text-sm font-semibold">Annuler</button>
          </div>
          <p className="text-xs text-[#64736c] sm:col-span-2">
            Cette étape crée uniquement un compte local de démonstration. Utilisez le bouton Google Workspace pour ouvrir OAuth.
          </p>
        </form>
      ) : null}

      <div aria-live="polite">
        {notice ? (
          <p role={notice.tone === "error" ? "alert" : "status"} className={`mt-4 rounded-xl border px-4 py-3 text-sm ${notice.tone === "success" ? "border-[#b9dccc] bg-[#edf8f3] text-[#1d694b]" : "border-red-200 bg-red-50 text-red-800"}`}>
            {notice.message}
          </p>
        ) : null}
      </div>

      <div className="mt-5 hidden overflow-x-auto rounded-2xl border border-[#dfe6e2] bg-white md:block">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="border-b border-[#e7ece9] bg-[#f7f9f8] text-xs uppercase tracking-wide text-[#64736c]">
            <tr><th className="p-4">Compte</th><th className="p-4">Fournisseur</th><th className="p-4">E-mail</th><th className="p-4">Statut</th><th className="p-4">Dernière synchronisation</th><th className="p-4">Compte actif</th><th className="p-4 text-right">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-[#edf0ee]">
            {accounts.map((account) => (
              <tr key={account.id}>
                <td className="p-4 font-semibold text-[#263b32]">{account.displayName}</td>
                <td className="p-4">{providerLabels[account.provider]}</td>
                <td className="p-4">{account.emailAddress}</td>
                <td className="p-4"><StatusBadge account={account} />{account.error ? <p className="mt-2 max-w-56 text-xs text-red-700">{account.error}</p> : null}</td>
                <td className="p-4">{formatDate(account.lastSuccessfulSyncAt)}</td>
                <td className="p-4">{account.isActive ? <span className="font-semibold text-[#1d694b]">Oui</span> : "Non"}</td>
                <td className="p-4"><AccountActions account={account} pendingKey={pendingKey} onRename={handleRename} onAction={handleAction} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-5 grid gap-4 md:hidden">
        {accounts.map((account) => (
          <article key={account.id} className="rounded-2xl border border-[#dfe6e2] bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold text-[#263b32]">{account.displayName}</h3><p className="mt-1 text-sm text-[#64736c]">{providerLabels[account.provider]}</p></div><StatusBadge account={account} /></div>
            {account.error ? <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-800">{account.error}</p> : null}
            <dl className="mt-4 grid gap-3 text-sm"><div><dt className="text-xs uppercase text-[#7a8982]">E-mail</dt><dd className="mt-1 break-all">{account.emailAddress}</dd></div><div><dt className="text-xs uppercase text-[#7a8982]">Dernière synchronisation</dt><dd className="mt-1">{formatDate(account.lastSuccessfulSyncAt)}</dd></div><div><dt className="text-xs uppercase text-[#7a8982]">Compte actif</dt><dd className="mt-1 font-semibold">{account.isActive ? "Oui" : "Non"}</dd></div></dl>
            <div className="mt-5"><AccountActions account={account} pendingKey={pendingKey} onRename={handleRename} onAction={handleAction} /></div>
          </article>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ account }: { account: MailAccount }) {
  const presentation = {
    connected: { label: "Connecté", className: "border-[#b9dccc] bg-[#edf8f3] text-[#1d694b]" },
    disconnected: { label: "Déconnecté", className: "border-slate-200 bg-slate-50 text-slate-600" },
    unavailable: { label: "Indisponible", className: "border-amber-200 bg-amber-50 text-amber-800" },
    error: { label: "Erreur", className: "border-red-200 bg-red-50 text-red-800" },
  }[account.status];
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${presentation.className}`}>{presentation.label}{account.mode === "demo" ? " · Démo" : ""}</span>;
}

function AccountActions({ account, pendingKey, onRename, onAction }: { account: MailAccount; pendingKey: string | null; onRename: (account: MailAccount) => void; onAction: (account: MailAccount, action: AccountAction) => void }) {
  const isPending = pendingKey !== null;
  const buttonClass = "min-h-9 rounded-lg border border-[#cbd7d1] bg-white px-2.5 text-xs font-semibold text-[#40554b] disabled:cursor-not-allowed disabled:opacity-45";
  return <div className="flex flex-wrap justify-end gap-2">{account.provider === "google" ? <a href={`/api/auth/google?accountId=${encodeURIComponent(account.id)}`} className={buttonClass}>{account.mode === "oauth" ? "Reconnecter" : "Connecter"}</a> : null}<button type="button" disabled={isPending} onClick={() => onRename(account)} className={buttonClass}>Renommer</button><button type="button" disabled={account.isActive || isPending} onClick={() => onAction(account, "activate")} className={buttonClass}>Activer</button><button type="button" disabled={isPending} onClick={() => onAction(account, "test")} className={buttonClass}>Tester</button><button type="button" disabled={isPending} onClick={() => onAction(account, "disconnect")} className={`${buttonClass} text-red-700`}>Déconnecter</button></div>;
}

function formatDate(value: string | null): string {
  return value ? dateFormatter.format(new Date(value)) : "Jamais";
}
