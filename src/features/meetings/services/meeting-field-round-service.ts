import { updateDemoData } from "@/features/demo/services/demo-repository";
import type { MeetingFieldPoint } from "@/features/demo/types/demo";

export type MeetingFieldPointInput = Pick<MeetingFieldPoint, "participantContactId" | "authorContactId" | "text" | "comments" | "actionIds" | "machineIds" | "workOrderIds" | "priorityDossierIds">;

export function saveMeetingFieldPoint(meetingId: string, input: MeetingFieldPointInput, pointId?: string): string {
  const now = new Date().toISOString();
  const id = pointId ?? `${meetingId}-RT-${Date.now().toString(36)}`;
  updateDemoData((draft) => {
    const meeting = draft.meetings.find((item) => item.id === meetingId);
    if (!meeting || !input.text.trim()) return;
    const existing = meeting.fieldPoints.find((item) => item.id === id);
    if (existing) Object.assign(existing, input, { text: input.text.trim(), comments: input.comments.trim(), updatedAt: now });
    else meeting.fieldPoints.push({ id, ...input, text: input.text.trim(), comments: input.comments.trim(), createdAt: now, updatedAt: now });
    if (!meeting.fieldRoundCompletedContactIds.includes(input.participantContactId)) meeting.fieldRoundCompletedContactIds.push(input.participantContactId);
    meeting.fieldRoundNoIssueContactIds = meeting.fieldRoundNoIssueContactIds.filter((contactId) => contactId !== input.participantContactId);
    for (const actionId of input.actionIds) if (!meeting.actionIds.includes(actionId)) meeting.actionIds.push(actionId);
  });
  return id;
}

export function markMeetingParticipantNoIssue(meetingId: string, contactId: string): void {
  updateDemoData((draft) => {
    const meeting = draft.meetings.find((item) => item.id === meetingId);
    if (!meeting) return;
    if (!meeting.fieldRoundCompletedContactIds.includes(contactId)) meeting.fieldRoundCompletedContactIds.push(contactId);
    if (!meeting.fieldRoundNoIssueContactIds.includes(contactId)) meeting.fieldRoundNoIssueContactIds.push(contactId);
  });
}

export function deleteMeetingFieldPoint(meetingId: string, pointId: string): void {
  updateDemoData((draft) => {
    const meeting = draft.meetings.find((item) => item.id === meetingId);
    if (!meeting) return;
    const removed = meeting.fieldPoints.find((item) => item.id === pointId);
    meeting.fieldPoints = meeting.fieldPoints.filter((item) => item.id !== pointId);
    if (removed && !meeting.fieldPoints.some((item) => item.participantContactId === removed.participantContactId)) meeting.fieldRoundCompletedContactIds = meeting.fieldRoundCompletedContactIds.filter((id) => id !== removed.participantContactId);
  });
}
