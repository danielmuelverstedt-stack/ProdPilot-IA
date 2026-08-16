"use client";

import { useState } from "react";
import { secondaryButton } from "@/components/ui/ModuleUi";
import { PlanningDialogShell } from "@/features/planning/components/PlanningDialogShell";
import { MeetingPreparationEmailSender } from "@/features/meetings/components/MeetingPreparationEmailSender";
import { MEETING_SEND_CHANNEL_CATALOG } from "@/features/meetings/config/meeting-send-channel-catalog";
import type { Meeting, ProductionAction, WorkOrder } from "@/features/demo/types/demo";

/**
 * Choix du canal d'envoi du document de préparation — mêmes canaux déclarés dans
 * `MEETING_SEND_CHANNEL_CATALOG` que ceux prévus pour le compte rendu plus tard. L'impression/PDF
 * remplace tout l'écran (`MeetingPrintView`) : ce n'est pas géré ici, `onOpenPrint` délègue au
 * parent (`MeetingWorkflow`) qui referme cette boîte de dialogue à sa place.
 */
export function MeetingSendPanel({ meeting, type, actionsToReview, criticalWorkOrders, onClose, onOpenPrint, onSent }: {
  meeting: Meeting;
  type: "QRQC" | "Production";
  actionsToReview: ProductionAction[];
  criticalWorkOrders: WorkOrder[];
  onClose: () => void;
  onOpenPrint: () => void;
  onSent: () => void;
}) {
  const [emailSelected, setEmailSelected] = useState(false);

  return <PlanningDialogShell
    title="Envoyer la préparation"
    description="Choisissez comment transmettre l'ordre du jour aux participants."
    onClose={onClose}
    actions={<button type="button" className={secondaryButton} onClick={onClose}>Fermer</button>}
  >
    <div className="grid gap-2">
      {Object.values(MEETING_SEND_CHANNEL_CATALOG).map((definition) => {
        if (definition.availability === "planned") {
          return <div key={definition.type} className="flex items-center justify-between rounded-xl border border-dashed border-[var(--app-border)] p-3 opacity-60">
            <div><p className="text-sm font-semibold">{definition.label}</p><p className="text-xs text-slate-500">{definition.description}</p></div>
            <span className="shrink-0 text-xs font-semibold text-slate-400">Bientôt disponible</span>
          </div>;
        }
        const active = definition.type === "email" && emailSelected;
        return <button
          key={definition.type}
          type="button"
          onClick={() => (definition.type === "print" ? onOpenPrint() : setEmailSelected(true))}
          className={`rounded-xl border p-3 text-left transition ${active ? "border-[color-mix(in_srgb,var(--app-primary)_45%,transparent)] bg-[color-mix(in_srgb,var(--app-primary)_6%,white)]" : "border-[var(--app-border)] hover:bg-slate-50"}`}
        >
          <p className="text-sm font-semibold">{definition.label}</p>
          <p className="text-xs text-slate-500">{definition.description}</p>
        </button>;
      })}
    </div>
    {emailSelected ? <MeetingPreparationEmailSender meeting={meeting} type={type} actionsToReview={actionsToReview} criticalWorkOrders={criticalWorkOrders} onSent={onSent} /> : null}
  </PlanningDialogShell>;
}
