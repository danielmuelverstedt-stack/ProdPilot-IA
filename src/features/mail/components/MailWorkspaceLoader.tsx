"use client";

import { useEffect, useState } from "react";
import { MailWorkspace } from "@/features/mail/components/MailWorkspace";
import { MailConnectionRequiredState, MailEmptyState, MailErrorState, MailLoadingState } from "@/features/mail/components/MailWorkspaceState";
import type { MailAccount, MailMessage, MailSynchronizationSummary } from "@/features/mail/types/mail";
import type { MailActivityEntry, MailProviderLabel } from "@/features/mail-management/types/mail-management";

type LoaderState =
  | { kind: "loading" }
  | { kind: "connection-required"; account: MailAccount }
  | { kind: "error"; message: string; code: string; status: number }
  | { kind: "ready"; account: MailAccount; messages: MailMessage[]; synchronization: MailSynchronizationSummary | null; canModifyMail: boolean; labels: MailProviderLabel[]; activity: MailActivityEntry[] };

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

      const messagesResponse = await fetch("/api/mail/messages?all=true", { cache: "no-store" });
      const messagesResult = await messagesResponse.json() as ApiMailResult & { messages?: MailMessage[]; synchronization?: MailSynchronizationSummary | null };
      if (!messagesResponse.ok || !messagesResult.messages) {
        setState({
          kind: "error",
          message: getApiMessage(messagesResult, "Les messages du compte actif n’ont pas pu être chargés."),
          code: messagesResult.error?.code ?? "MAIL_CONNECTION_ERROR",
          status: messagesResponse.status,
        });
        return;
      }
      const managementResponse = await fetch("/api/mail/management", { cache: "no-store" });
      const managementResult = await managementResponse.json() as ApiMailResult & {
        permission?: { canModifyMail: boolean; reconnectRequired: boolean };
        labels?: MailProviderLabel[];
        activity?: MailActivityEntry[];
      };
      if (!managementResponse.ok) {
        setState({ kind: "error", message: getApiMessage(managementResult, "La gestion Gmail n’a pas pu être chargée."), code: managementResult.error?.code ?? "MAIL_CONNECTION_ERROR", status: managementResponse.status });
        return;
      }
      setState({
        kind: "ready",
        account: connectionResult.account,
        messages: messagesResult.messages,
        synchronization: messagesResult.synchronization ?? null,
        canModifyMail: managementResult.permission?.canModifyMail ?? false,
        labels: managementResult.labels ?? [],
        activity: managementResult.activity ?? [],
      });
    } catch (error) {
      setState({ kind: "error", message: error instanceof Error ? error.message : "Une erreur inattendue est survenue.", code: "MAIL_INTERNAL_ERROR", status: 500 });
    }
  }

  if (state.kind === "loading") return <MailLoadingState />;
  if (state.kind === "connection-required") return <MailConnectionRequiredState accountName={state.account.displayName} error={state.account.error} />;
  if (state.kind === "error") return <MailErrorState message={state.message} code={state.code} status={state.status} onRetry={() => void loadMessages()} />;
  if (state.messages.length === 0) return <MailEmptyState accountName={state.account.displayName} onRefresh={() => void loadMessages()} />;
  return <MailWorkspace initialMessages={state.messages} initialSynchronization={state.synchronization} account={state.account} canModifyMail={state.canModifyMail} initialLabels={state.labels} initialActivity={state.activity} />;
}

interface ApiMailResult { message?: string; error?: { code?: string; message?: string } }
function getApiMessage(result: ApiMailResult, fallback: string) { return result.error?.message ?? result.message ?? fallback; }
