"use client";

import { formatMailDate, getMailAccountStatus, mailProviderLabels } from "@/features/mail/components/mail-account-presentation";
import { getMailProviderDefinition, getMailProviderReconnectHref } from "@/features/mail/config/mail-provider-catalog";
import type { MailAccount } from "@/features/mail/types/mail";

export type MailAccountAction = "activate" | "synchronize" | "test" | "disconnect";

export function MailAccountCard({ account, pending, onAction, onSettings }: {
  account: MailAccount;
  pending: boolean;
  onAction: (account: MailAccount, action: MailAccountAction) => void;
  onSettings: (account: MailAccount) => void;
}) {
  const status = getMailAccountStatus(account);
  const provider = getMailProviderDefinition(account.provider);
  const reconnectHref = getMailProviderReconnectHref(account.provider, account.id);
  const canSynchronize = account.mode === "oauth" && provider.capabilities.read && account.status === "connected";
  const button = "min-h-10 rounded-lg border border-[#cbd7d1] bg-white px-3 text-xs font-semibold text-[#40554b] disabled:cursor-not-allowed disabled:opacity-45";
  return <article className={`rounded-2xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md ${account.isActive ? "border-[#8fbea9] ring-1 ring-[#cce2d8]" : "border-[#dfe6e2]"}`}>
    <div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#edf6f2] font-bold text-[#195c45]">{mailProviderLabels[account.provider].slice(0, 1)}</span><div className="min-w-0"><h3 className="truncate font-semibold">{account.displayName}</h3><p className="text-sm text-[#64736c]">{mailProviderLabels[account.provider]}</p></div></div>{account.isActive ? <span className="shrink-0 rounded-full border border-[#9fcbb7] bg-[#edf8f3] px-2.5 py-1 text-xs font-semibold text-[#1d694b]">Compte actif</span> : null}</div>
    <p className="mt-4 break-all text-sm font-medium text-[#33473e]">{account.emailAddress}</p>
    <div className="mt-3 flex flex-wrap gap-2"><span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${status.classes}`}>{status.label}</span><span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">{account.mode === "demo" ? "Données locales" : "Connexion réelle"}</span></div>
    {account.error ? <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs leading-5 text-red-800">{account.error}</p> : null}
    <dl className="mt-4 grid grid-cols-2 gap-3 text-sm"><Info label="Dernière synchronisation" value={formatMailDate(account.lastSuccessfulSyncAt)} /><Info label="Dernier test" value={formatMailDate(account.lastConnectionTestAt)} />{account.organizationId ? <Info label="Organisation" value={account.organizationId} /> : null}</dl>
    <div className="mt-5 flex flex-wrap gap-2">
      {!account.isActive ? <button type="button" disabled={pending} onClick={() => onAction(account, "activate")} className={button}>Activer</button> : null}
      <button type="button" disabled={pending || !canSynchronize} title={!canSynchronize ? "Une connexion Google réelle et active est requise." : undefined} onClick={() => onAction(account, "synchronize")} className={button}>Synchroniser</button>
      <button type="button" disabled={pending} onClick={() => onAction(account, "test")} className={button}>Tester la connexion</button>
      <button type="button" disabled={pending} onClick={() => onSettings(account)} className={button}>Renommer</button>
      <button type="button" disabled={pending} onClick={() => onSettings(account)} className={button}>Paramètres</button>
      {reconnectHref && account.mode === "oauth" && account.status !== "connected" ? <a href={reconnectHref} className={button}>Reconnecter</a> : null}
      <button type="button" disabled={pending} onClick={() => onAction(account, "disconnect")} className={`${button} text-red-700`}>Déconnecter</button>
    </div>
  </article>;
}

function Info({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-xs uppercase tracking-wide text-[#7a8982]">{label}</dt><dd className="mt-1 break-words text-[#33473e]">{value}</dd></div>;
}
