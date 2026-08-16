import { updateDemoData } from "@/features/demo/services/demo-repository";
import type { MeetingRecapDocument } from "@/features/demo/types/demo";

export function initializeMeetingRecapDocument(meetingId: string, input: Pick<MeetingRecapDocument, "subject" | "mailBody" | "documentBody" | "recipientContactIds">): void {
  const now = new Date().toISOString();
  updateDemoData((draft) => {
    const meeting = draft.meetings.find((item) => item.id === meetingId);
    if (!meeting || meeting.recapDocument) return;
    meeting.recapDocument = { status: "À relire", generatedAt: now, updatedAt: now, ...input, includePdf: true, includeActions: false, includePreparation: false, sentVersions: [] };
  });
}

export function updateMeetingRecapDocument(meetingId: string, patch: Partial<Omit<MeetingRecapDocument, "sentVersions" | "generatedAt">>): void {
  updateDemoData((draft) => {
    const document = draft.meetings.find((item) => item.id === meetingId)?.recapDocument;
    if (document) Object.assign(document, patch, { updatedAt: new Date().toISOString() });
  });
}

export function recordMeetingRecapSent(meetingId: string, recipientEmails: string[], attachmentNames: string[]): void {
  updateDemoData((draft) => {
    const document = draft.meetings.find((item) => item.id === meetingId)?.recapDocument;
    if (!document) return;
    const sentAt = new Date().toISOString();
    document.status = "Envoyé";
    document.updatedAt = sentAt;
    document.sentVersions.push({ id: `CR-${Date.now().toString(36)}`, sentAt, recipientContactIds: [...document.recipientContactIds], recipientEmails: [...recipientEmails], subject: document.subject, mailBody: document.mailBody, documentBody: document.documentBody, attachmentNames: [...attachmentNames] });
  });
}
