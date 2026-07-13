"use client";

import { useEffect, useState } from "react";
import { MailWorkspace } from "@/features/mail/components/MailWorkspace";
import type { MailAccount, MailMessage } from "@/features/mail/types/mail";

type LoaderState =
  | { kind: "loading" }
  | { kind: "connection-required"; account: MailAccount }
  | { kind: "error"; message: string }
  | { kind: "ready"; account: MailAccount; messages: MailMessage[] };

export function MailWorkspaceLoader() {
  const [state, setState] = useState<LoaderState>({ kind: "loading" });

  useEffect(() => { void loadMessages(); }, []);

  async function loadMessages() {
    setState({ kind: "loading" });
    try {
      const connectionResponse = await fetch("/api/mail/connection", { cache: "no-store" });
      const connectionResult = await connectionResponse.json() as { account?: MailAccount; message?: string };
      if (!connectionResponse.ok || !connectionResult.account) {
        throw new Error(connectionResult.message ?? "Le compte actif est indisponible.");
      }
      if (connectionResult.account.status !== "connected") {
        setState({ kind: "connection-required", account: connectionResult.account });
        return;
      }

      const messagesResponse = await fetch("/api/mail/messages?limit=25", { cache: "no-store" });
      const messagesResult = await messagesResponse.json() as { messages?: MailMessage[]; message?: string };
      if (!messagesResponse.ok || !messagesResult.messages) {
        throw new Error(messagesResult.message ?? "Les messages du compte actif n’ont pas pu être chargés.");
      }
      setState({ kind: "ready", account: connectionResult.account, messages: messagesResult.messages });
    } catch (error) {
      setState({ kind: "error", message: error instanceof Error ? error.message : "Une erreur inattendue est survenue." });
    }
  }

  if (state.kind === "loading") return <WorkspaceState title="Chargement des messages…" description="Lecture du compte de messagerie actif en cours." loading />;
  if (state.kind === "connection-required") return <WorkspaceState title="Le compte actif n’est pas connecté" description={`Activez ou testez un autre compte dans Réglages. Compte actuel : ${state.account.displayName}.`} actions={<a href="/reglages/connexions/messagerie" className="rounded-xl bg-[var(--app-primary)] px-4 py-3 text-sm font-semibold text-white">Ouvrir les réglages</a>} />;
  if (state.kind === "error") return <WorkspaceState title="Impossible de charger les messages" description={state.message} actions={<><button onClick={() => void loadMessages()} className="rounded-xl bg-[var(--app-primary)] px-4 py-3 text-sm font-semibold text-white">Réessayer</button><a href="/reglages/connexions/messagerie" className="rounded-xl border border-[var(--app-border)] bg-white px-4 py-3 text-sm font-semibold">Gérer les comptes</a></>} />;
  if (state.messages.length === 0) return <WorkspaceState title="Aucun message récent" description={`Aucun message n’est disponible pour « ${state.account.displayName} ».`} actions={<button onClick={() => void loadMessages()} className="rounded-xl border border-[var(--app-border)] bg-white px-4 py-3 text-sm font-semibold">Actualiser</button>} />;
  return <MailWorkspace initialMessages={state.messages} account={state.account} />;
}

function WorkspaceState({ title, description, actions, loading = false }: { title: string; description: string; actions?: React.ReactNode; loading?: boolean }) {
  return <section className="mt-8 rounded-3xl border border-dashed border-[var(--app-border)] bg-white px-6 py-14 text-center"><div className={`mx-auto mb-4 size-10 rounded-full border-4 border-slate-200 ${loading ? "animate-spin border-t-[var(--app-primary)]" : "bg-slate-100"}`} /><h2 className="text-xl font-semibold">{title}</h2><p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">{description}</p>{actions && <div className="mt-6 flex flex-wrap justify-center gap-2">{actions}</div>}</section>;
}
