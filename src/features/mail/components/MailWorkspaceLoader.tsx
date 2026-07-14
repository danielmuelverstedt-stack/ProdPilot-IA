"use client";

import { useEffect, useState } from "react";
import { MailWorkspace } from "@/features/mail/components/MailWorkspace";
import { MailConnectionRequiredState, MailEmptyState, MailErrorState, MailLoadingState } from "@/features/mail/components/MailWorkspaceState";
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

      const messagesResponse = await fetch("/api/mail/messages", { cache: "no-store" });
      const messagesResult = await messagesResponse.json() as { messages?: MailMessage[]; message?: string };
      if (!messagesResponse.ok || !messagesResult.messages) {
        throw new Error(messagesResult.message ?? "Les messages du compte actif n’ont pas pu être chargés.");
      }
      setState({ kind: "ready", account: connectionResult.account, messages: messagesResult.messages });
    } catch (error) {
      setState({ kind: "error", message: error instanceof Error ? error.message : "Une erreur inattendue est survenue." });
    }
  }

  if (state.kind === "loading") return <MailLoadingState />;
  if (state.kind === "connection-required") return <MailConnectionRequiredState accountName={state.account.displayName} error={state.account.error} />;
  if (state.kind === "error") return <MailErrorState message={state.message} onRetry={() => void loadMessages()} />;
  if (state.messages.length === 0) return <MailEmptyState accountName={state.account.displayName} onRefresh={() => void loadMessages()} />;
  return <MailWorkspace initialMessages={state.messages} account={state.account} />;
}
