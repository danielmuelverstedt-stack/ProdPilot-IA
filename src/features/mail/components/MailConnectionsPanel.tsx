"use client";

import { useState } from "react";
import { MailProviderCard } from "@/features/mail/components/MailProviderCard";
import type {
  MailConnectionSummary,
  MailProviderType,
} from "@/features/mail/types/mail";

interface MailConnectionsPanelProps {
  initialConnections: MailConnectionSummary[];
}

interface ConnectionResponse {
  connection?: MailConnectionSummary;
  message?: string;
}

export function MailConnectionsPanel({
  initialConnections,
}: MailConnectionsPanelProps) {
  const [connections, setConnections] = useState(initialConnections);
  const [pendingProvider, setPendingProvider] =
    useState<MailProviderType | null>(null);
  const [notice, setNotice] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);

  async function updateConnection(
    provider: MailProviderType,
    action: "connect" | "disconnect",
  ) {
    setPendingProvider(provider);
    setNotice(null);

    try {
      const response = await fetch("/api/mail/connections", {
        method: action === "connect" ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });
      const result: ConnectionResponse = await response.json();

      if (!response.ok || !result.connection) {
        throw new Error(
          result.message ?? "La connexion n’a pas pu être mise à jour.",
        );
      }

      setConnections((current) =>
        current.map((connection) =>
          connection.provider === provider ? result.connection! : connection,
        ),
      );
      setNotice({
        tone: "success",
        message:
          action === "connect"
            ? `${result.connection.providerName} est connecté en mode démonstration.`
            : `${result.connection.providerName} est déconnecté.`,
      });
    } catch (error) {
      setNotice({
        tone: "error",
        message:
          error instanceof Error
            ? error.message
            : "Une erreur inattendue est survenue.",
      });
    } finally {
      setPendingProvider(null);
    }
  }

  return (
    <div className="mt-6">
      <div aria-live="polite" className="min-h-0">
        {notice ? (
          <p
            role={notice.tone === "error" ? "alert" : "status"}
            className={`mb-4 rounded-xl border px-4 py-3 text-sm ${
              notice.tone === "success"
                ? "border-[#b9dccc] bg-[#edf8f3] text-[#1d694b]"
                : "border-[#edc7c3] bg-[#fff2f0] text-[#8a332d]"
            }`}
          >
            {notice.message}
          </p>
        ) : null}
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {connections.map((connection) => (
          <MailProviderCard
            key={connection.provider}
            connection={connection}
            isPending={pendingProvider === connection.provider}
            onConnect={() => updateConnection(connection.provider, "connect")}
            onDisconnect={() =>
              updateConnection(connection.provider, "disconnect")
            }
          />
        ))}
      </div>
    </div>
  );
}
