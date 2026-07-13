"use client";

import { useEffect, useState } from "react";
import { MailWorkspace } from "@/features/mail/components/MailWorkspace";
import type { MailConnectionStatus, MailMessage } from "@/features/mail/types/mail";

type LoaderState =
  | { kind: "loading" }
  | { kind: "connection-required" }
  | { kind: "error"; message: string }
  | { kind: "ready"; messages: MailMessage[]; source: "google" | "mock" };

export function MailWorkspaceLoader({ mockMessages }: { mockMessages: MailMessage[] }) {
  const [state, setState] = useState<LoaderState>({ kind: "loading" });

  useEffect(() => { void loadMessages(); }, []);

  async function loadMessages() {
    setState({ kind: "loading" });
    try {
      const connectionResponse = await fetch("/api/mail/connection", { cache: "no-store" });
      const connectionResult = await connectionResponse.json() as { connection?: MailConnectionStatus; message?: string };
      if (!connectionResponse.ok || !connectionResult.connection) throw new Error(connectionResult.message ?? "L’état de la connexion Gmail est indisponible.");
      if (connectionResult.connection.state !== "connected") {
        setState(connectionResult.connection.state === "error"
          ? { kind: "error", message: connectionResult.connection.error ?? "La connexion Gmail doit être vérifiée." }
          : { kind: "connection-required" });
        return;
      }
      const messagesResponse = await fetch("/api/mail/messages?limit=25", { cache: "no-store" });
      const messagesResult = await messagesResponse.json() as { messages?: MailMessage[]; message?: string };
      if (!messagesResponse.ok || !messagesResult.messages) throw new Error(messagesResult.message ?? "Les messages Gmail n’ont pas pu être chargés.");
      setState({ kind: "ready", messages: messagesResult.messages, source: "google" });
    } catch (error) {
      setState({ kind: "error", message: error instanceof Error ? error.message : "Une erreur inattendue est survenue." });
    }
  }

  if (state.kind === "loading") return <WorkspaceState title="Chargement des messages Gmail…" description="Connexion sécurisée à Google Workspace en cours." loading />;
  if (state.kind === "connection-required") return <WorkspaceState title="Connexion Google Workspace requise" description="Connectez le compte autorisé dans Réglages pour consulter les messages reçus depuis hier." actions={<><a href="/reglages/connexions/messagerie" className="rounded-xl bg-[var(--app-primary)] px-4 py-3 text-sm font-semibold text-white">Ouvrir les réglages</a><FallbackButton onClick={() => setState({ kind: "ready", messages: mockMessages, source: "mock" })} /></>} />;
  if (state.kind === "error") return <WorkspaceState title="Impossible de charger Gmail" description={state.message} actions={<><button onClick={() => void loadMessages()} className="rounded-xl bg-[var(--app-primary)] px-4 py-3 text-sm font-semibold text-white">Réessayer</button><FallbackButton onClick={() => setState({ kind: "ready", messages: mockMessages, source: "mock" })} /></>} />;
  if (state.messages.length === 0) return <WorkspaceState title="Aucun message récent" description="Aucun message reçu depuis hier ne correspond aux critères actuels." actions={<button onClick={() => void loadMessages()} className="rounded-xl border border-[var(--app-border)] bg-white px-4 py-3 text-sm font-semibold">Actualiser</button>} />;
  return <MailWorkspace initialMessages={state.messages} source={state.source} />;
}

function WorkspaceState({ title, description, actions, loading = false }: { title: string; description: string; actions?: React.ReactNode; loading?: boolean }) {
  return <section className="mt-8 rounded-3xl border border-dashed border-[var(--app-border)] bg-white px-6 py-14 text-center"><div className={`mx-auto mb-4 size-10 rounded-full border-4 border-slate-200 ${loading ? "animate-spin border-t-[var(--app-primary)]" : "bg-slate-100"}`} /><h2 className="text-xl font-semibold">{title}</h2><p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">{description}</p>{actions && <div className="mt-6 flex flex-wrap justify-center gap-2">{actions}</div>}</section>;
}

function FallbackButton({ onClick }: { onClick: () => void }) { return <button onClick={onClick} className="rounded-xl border border-[var(--app-border)] bg-white px-4 py-3 text-sm font-semibold">Utiliser les données de démonstration</button>; }
