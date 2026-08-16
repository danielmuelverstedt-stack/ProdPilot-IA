"use client";

import { useEffect, useState } from "react";
import { useDemoData } from "@/features/demo/services/demo-repository";
import { MailDraftSendPanel } from "@/features/meetings/components/MailDraftSendPanel";
import { MeetingMachinePlanningLoader } from "@/features/meetings/components/MeetingMachinePlanningLoader";
import { buildMeetingPreparationDocument } from "@/features/meetings/services/meeting-preparation-document";
import { resolveParticipantEmails } from "@/features/meetings/services/meeting-recap-email";
import type { Meeting, ProductionAction, WorkOrder } from "@/features/demo/types/demo";
import type { MeetingMachineReviewGroup } from "@/features/meetings/services/meeting-machine-review";
import { useMachinePhotos } from "@/features/machines/services/machine-photo-store";
import { useSettings } from "@/features/settings/components/SettingsProvider";
import { buildMeetingPlanningPdf, type GeneratedMailAttachment } from "@/features/meetings/services/meeting-planning-pdf";

const PREPARATION_OPERATIONS_PER_MACHINE = 3;

export function MeetingPreparationEmailSender(props: { meeting: Meeting; type: "QRQC" | "Production"; actionsToReview: ProductionAction[]; criticalWorkOrders: WorkOrder[]; onSent: () => void }) {
  if (props.type === "QRQC") return <PreparationEmailContent {...props} machinePlanning={[]} />;
  return <MeetingMachinePlanningLoader limit={PREPARATION_OPERATIONS_PER_MACHINE}>{(groups) => <PreparationEmailContent {...props} machinePlanning={groups} />}</MeetingMachinePlanningLoader>;
}

function PreparationEmailContent({ meeting, type, actionsToReview, criticalWorkOrders, onSent, machinePlanning }: { meeting: Meeting; type: "QRQC" | "Production"; actionsToReview: ProductionAction[]; criticalWorkOrders: WorkOrder[]; onSent: () => void; machinePlanning: MeetingMachineReviewGroup[] }) {
  const data = useDemoData();
  const machinePhotos = useMachinePhotos();
  const [pdfState, setPdfState] = useState<{ attachment: GeneratedMailAttachment | null; error: boolean; photos: Record<string, string> | null; planning: MeetingMachineReviewGroup[] | null; date: string | null }>({ attachment: null, error: false, photos: null, planning: null, date: null });
  const { resolved, unresolved } = resolveParticipantEmails(meeting.participants, data.contacts);
  const { settings } = useSettings();
  const machineNames = Object.fromEntries(settings.production.machines.map((item) => [item.id, item.displayName]));
  const { subject, bodyText, bodyHtml, inlineImages } = buildMeetingPreparationDocument(meeting, type, actionsToReview, criticalWorkOrders, data.contacts, data.maintenanceProblems, machineNames);
  useEffect(() => {
    if (type !== "Production") return;
    let active = true;
    const date = new Intl.DateTimeFormat("fr-BE", { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Brussels" }).format(new Date(meeting.date));
    void buildMeetingPlanningPdf("Réunion Production", date, machinePlanning, machinePhotos)
      .then((attachment) => { if (active) setPdfState({ attachment, error: false, photos: machinePhotos, planning: machinePlanning, date: meeting.date }); })
      .catch(() => { if (active) setPdfState({ attachment: null, error: true, photos: machinePhotos, planning: machinePlanning, date: meeting.date }); });
    return () => { active = false; };
  }, [meeting.date, machinePhotos, machinePlanning, type]);
  const pdfIsCurrent = pdfState.photos === machinePhotos && pdfState.planning === machinePlanning && pdfState.date === meeting.date;
  if (type === "Production" && pdfIsCurrent && pdfState.error) return <p className="mt-4 text-sm text-red-700">Le PDF du planning n’a pas pu être généré. Le brouillon n’est pas proposé afin d’éviter un e-mail incomplet.</p>;
  if (type === "Production" && (!pdfIsCurrent || !pdfState.attachment)) return <p className="mt-4 text-sm text-slate-500">Génération du PDF du planning…</p>;
  return <MailDraftSendPanel label="Envoyer la préparation par e-mail" resolved={resolved} unresolved={unresolved} subject={subject} bodyText={bodyText} bodyHtml={bodyHtml} inlineImages={inlineImages} attachments={pdfState.attachment ? [pdfState.attachment] : []} draftKey={`meeting-preparation-${meeting.id}`} onSent={onSent} className="mt-4 border-t border-[var(--app-border)] pt-4" />;
}
