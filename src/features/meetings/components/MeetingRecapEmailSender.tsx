"use client";

import { useDemoData } from "@/features/demo/services/demo-repository";
import { useSettings } from "@/features/settings/components/SettingsProvider";
import { MailDraftSendPanel } from "@/features/meetings/components/MailDraftSendPanel";
import { buildMeetingRecapEmail, resolveParticipantEmails } from "@/features/meetings/services/meeting-recap-email";
import type { Meeting, ProductionAction } from "@/features/demo/types/demo";

export function MeetingRecapEmailSender({ meeting, type, meetingActions }: { meeting: Meeting; type: "QRQC" | "Production"; meetingActions: ProductionAction[] }) {
  const data = useDemoData();
  const { settings } = useSettings();
  const { resolved, unresolved } = resolveParticipantEmails(meeting.participants, data.contacts);
  const { subject, bodyText } = buildMeetingRecapEmail(meeting, type, meetingActions, data.contacts, data.maintenanceProblems, Object.fromEntries(settings.production.machines.map((item) => [item.id, item.displayName])));
  return <MailDraftSendPanel label="Envoyer le récap par e-mail" resolved={resolved} unresolved={unresolved} subject={subject} bodyText={bodyText} draftKey={`meeting-recap-${meeting.id}`} className="mt-6 border-t border-emerald-200 pt-5" />;
}
