"use client";

import { useState } from "react";
import { CalendarAccountCard, type CalendarAccountAction } from "@/features/calendar/components/CalendarAccountCard";
import type { CalendarAccount } from "@/features/calendar/types/calendar";

interface CalendarConnectionsPanelProps {
  initialAccounts: CalendarAccount[];
  initialNotice?: { tone: "success" | "error"; message: string };
}

interface AccountsResponse { accounts?: CalendarAccount[]; message?: string }

export function CalendarConnectionsPanel({ initialAccounts, initialNotice }: CalendarConnectionsPanelProps) {
  const [accounts, setAccounts] = useState(initialAccounts);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [notice, setNotice] = useState(initialNotice ?? null);

  async function update(body: Record<string, unknown>, pending: string, successMessage: string) {
    setPendingKey(pending);
    setNotice(null);
    try {
      const response = await fetch("/api/calendar/connections", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const result = await response.json() as AccountsResponse;
      if (!response.ok || !result.accounts) throw new Error(result.message ?? "Le compte n’a pas pu être mis à jour.");
      setAccounts(result.accounts);
      setNotice({ tone: "success" as const, message: successMessage });
    } catch (error) {
      setNotice({ tone: "error" as const, message: error instanceof Error ? error.message : "Une erreur inattendue est survenue." });
    } finally { setPendingKey(null); }
  }

  async function handleAction(account: CalendarAccount, action: CalendarAccountAction) {
    if (action === "disconnect" && !window.confirm(`Déconnecter « ${account.displayName} » ? Les autres comptes resteront disponibles.`)) return;
    const messages: Record<CalendarAccountAction, string> = {
      activate: "Le compte actif a été mis à jour.",
      test: account.mode === "demo" ? "Le compte de démonstration fonctionne correctement." : "La connexion a été testée avec succès.",
      disconnect: "Le compte a été déconnecté.",
    };
    await update({ action, accountId: account.id }, `${account.id}:${action}`, messages[action]);
  }

  return <div className="mt-6 space-y-8">
    <section className="rounded-2xl border border-[#d7e4de] bg-[#f7faf8] p-5"><h2 className="text-lg font-semibold">Connecter Google Calendar</h2><p className="mt-1 text-sm text-[#64736c]">Nécessite une connexion distincte de celle de Mail : vos droits Calendrier ne sont jamais accordés silencieusement en connectant votre messagerie.</p><a href="/api/auth/google-calendar" className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl bg-[#195c45] px-4 text-sm font-semibold text-white">Connecter Google Calendar</a></section>
    <section aria-labelledby="connected-calendar-accounts-title"><div><h2 id="connected-calendar-accounts-title" className="text-lg font-semibold">Comptes connectés</h2><p className="mt-1 text-sm text-[#64736c]">Le compte actif alimente l’agenda du jour de Mon Espace et l’assistant.</p></div>
      <div aria-live="polite">{notice ? <p role={notice.tone === "error" ? "alert" : "status"} className={`mt-4 rounded-xl border px-4 py-3 text-sm ${notice.tone === "success" ? "border-[#b9dccc] bg-[#edf8f3] text-[#1d694b]" : "border-red-200 bg-red-50 text-red-800"}`}>{notice.message}</p> : null}</div>
      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{accounts.map((account) => <CalendarAccountCard key={account.id} account={account} pending={pendingKey !== null} onAction={handleAction} />)}</div>
    </section>
  </div>;
}
