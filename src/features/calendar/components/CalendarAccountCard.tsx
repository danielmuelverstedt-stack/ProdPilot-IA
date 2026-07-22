"use client";

import { getCalendarAccountStatus, formatCalendarDate } from "@/features/calendar/components/calendar-account-presentation";
import { getCalendarProviderDefinition, getCalendarProviderReconnectHref } from "@/features/calendar/config/calendar-provider-catalog";
import type { CalendarAccount } from "@/features/calendar/types/calendar";

export type CalendarAccountAction = "activate" | "test" | "disconnect";

export function CalendarAccountCard({ account, pending, onAction }: {
  account: CalendarAccount;
  pending: boolean;
  onAction: (account: CalendarAccount, action: CalendarAccountAction) => void;
}) {
  const status = getCalendarAccountStatus(account);
  const provider = getCalendarProviderDefinition(account.provider);
  const reconnectHref = getCalendarProviderReconnectHref(account.provider, account.id);
  const button = "min-h-10 rounded-lg border border-[#cbd7d1] bg-white px-3 text-xs font-semibold text-[#40554b] disabled:cursor-not-allowed disabled:opacity-45";
  return <article className={`rounded-2xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md ${account.isActive ? "border-[#8fbea9] ring-1 ring-[#cce2d8]" : "border-[#dfe6e2]"}`}>
    <div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#edf6f2] font-bold text-[#195c45]">{provider.label.slice(0, 1)}</span><div className="min-w-0"><h3 className="truncate font-semibold">{account.displayName}</h3><p className="text-sm text-[#64736c]">{provider.label}</p></div></div>{account.isActive ? <span className="shrink-0 rounded-full border border-[#9fcbb7] bg-[#edf8f3] px-2.5 py-1 text-xs font-semibold text-[#1d694b]">Compte actif</span> : null}</div>
    <p className="mt-4 break-all text-sm font-medium text-[#33473e]">{account.emailAddress}</p>
    <div className="mt-3 flex flex-wrap gap-2"><span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${status.classes}`}>{status.label}</span><span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">{account.mode === "demo" ? "Données locales" : "Connexion réelle"}</span></div>
    {account.error ? <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs leading-5 text-red-800">{account.error}</p> : null}
    <p className="mt-4 text-sm text-[#64736c]">Dernière synchronisation : {formatCalendarDate(account.lastSuccessfulSyncAt)}</p>
    <div className="mt-5 flex flex-wrap gap-2">
      {!account.isActive ? <button type="button" disabled={pending} onClick={() => onAction(account, "activate")} className={button}>Activer</button> : null}
      <button type="button" disabled={pending} onClick={() => onAction(account, "test")} className={button}>Tester la connexion</button>
      {reconnectHref && account.mode === "oauth" && account.status !== "connected" ? <a href={reconnectHref} className={button}>Reconnecter</a> : null}
      {account.mode === "oauth" ? <button type="button" disabled={pending} onClick={() => onAction(account, "disconnect")} className={`${button} text-red-700`}>Déconnecter</button> : null}
    </div>
  </article>;
}
