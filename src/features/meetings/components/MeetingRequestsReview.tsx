"use client";

import Link from "next/link";
import { useState } from "react";
import { formatEuropeanDate, secondaryButton, StatusPill } from "@/components/ui/ModuleUi";
import { ActionFormDialog } from "@/features/actions/components/ActionFormDialog";
import type { ActionContextLink, InternalRequest } from "@/features/demo/types/demo";

function buildContextLink(request: InternalRequest): ActionContextLink {
  return { module: "request", id: request.id, label: request.id, href: `/suivi/${request.id}` };
}

/**
 * Étape « Demandes des départements » de la réunion Production : les demandes actives (Centre de
 * demandes), avec la possibilité de créer une action liée à la fois à la demande et à la réunion
 * — comme les étapes « Cinq projets critiques » et « OF planifiés par machine » — jusque-là purement
 * consultative (simple liste de textes, sans action possible).
 */
export function MeetingRequestsReview({ requests, origine, onActionCreated }: { requests: InternalRequest[]; origine: string; onActionCreated: (id: string, responsable: string) => void }) {
  const [actionTarget, setActionTarget] = useState<InternalRequest | null>(null);
  if (!requests.length) return <p className="mt-4 text-sm text-slate-600">Aucune demande active pour le moment.</p>;
  return <div className="mt-4 grid gap-3">
    {actionTarget ? <ActionFormDialog origine={origine} contextLink={buildContextLink(actionTarget)} onClose={() => setActionTarget(null)} onCreated={onActionCreated} /> : null}
    {requests.map((request) => <article key={request.id} className="rounded-xl border border-[var(--app-border)] p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <Link href={`/suivi/${request.id}`} className="font-semibold text-[var(--app-primary)]">{request.id} · {request.title}</Link>
          <p className="mt-1 text-xs text-slate-500">{request.requester} → {request.responsible} · échéance {formatEuropeanDate(request.dueDate)}</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <StatusPill tone={request.priority === "Bloquante" || request.priority === "Urgente" ? "danger" : "warning"}>{request.priority}</StatusPill>
          <StatusPill tone={request.status === "Terminée" ? "success" : "info"}>{request.status}</StatusPill>
        </div>
      </div>
      <p className="mt-2 text-sm text-slate-600">{request.description}</p>
      <button type="button" className={`${secondaryButton} mt-2 h-7 px-2.5 text-xs`} onClick={() => setActionTarget(request)}>+ Action liée</button>
    </article>)}
  </div>;
}
