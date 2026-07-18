"use client";

import { useEffect, useState } from "react";
import { MailWorkspace } from "@/features/mail/components/MailWorkspace";
import { MailConnectionRequiredState, MailEmptyState, MailErrorState, MailLoadingState } from "@/features/mail/components/MailWorkspaceState";
import type { MailAccount, MailMessage } from "@/features/mail/types/mail";

type LoaderState =
  | { kind: "loading" }
  | { kind: "connection-required"; account: MailAccount }
  | { kind: "error"; message: string; code: string; status: number }
  | { kind: "ready"; account: MailAccount; messages: MailMessage[] };

export function MailWorkspaceLoader() {
  const [state, setState] = useState<LoaderState>({ kind: "loading" });

  useEffect(() => { void loadMessages(); }, []);

  async function loadMessages() {
    setState({ kind: "loading" });
    try {
      const connectionResponse = await fetch("/api/mail/connection", { cache: "no-store" });
      const connectionResult = await connectionResponse.json() as ApiMailResult & { account?: MailAccount };
      if (!connectionResponse.ok || !connectionResult.account) {
        throw new Error(connectionResult.message ?? "Le compte actif est indisponible.");
      }
      if (connectionResult.account.status !== "connected" && connectionResult.account.mode !== "oauth") {
        setState({ kind: "connection-required", account: connectionResult.account });
        return;
      }

      const messagesResponse = await fetch("/api/mail/messages", { cache: "no-store" });
      const messagesResult = await messagesResponse.json() as ApiMailResult & { messages?: MailMessage[] };
      if (!messagesResponse.ok || !messagesResult.messages) {
        setState({
          kind: "error",
          message: getApiMessage(messagesResult, "Les messages du compte actif n’ont pas pu être chargés."),
          code: messagesResult.error?.code ?? "MAIL_CONNECTION_ERROR",
          status: messagesResponse.status,
        });
        return;
      }
      setState({ kind: "ready", account: connectionResult.account, messages: messagesResult.messages });
    } catch (error) {
      setState({ kind: "error", message: error instanceof Error ? error.message : "Une erreur inattendue est survenue.", code: "MAIL_INTERNAL_ERROR", status: 500 });
    }
  }

  if (state.kind === "loading") return <MailLoadingState />;
  if (state.kind === "connection-required") return <MailConnectionRequiredState accountName={state.account.displayName} error={state.account.error} />;
  if (state.kind === "error") return <MailErrorState message={state.message} code={state.code} status={state.status} onRetry={() => void loadMessages()} />;
  if (state.messages.length === 0) return <MailEmptyState accountName={state.account.displayName} onRefresh={() => void loadMessages()} />;
  return <MailWorkspace initialMessages={state.messages} account={state.account} />;
}

interface ApiMailResult { message?: string; error?: { code?: string; message?: string } }
function getApiMessage(result: ApiMailResult, fallback: string) { return result.error?.message ?? result.message ?? fallback; }
