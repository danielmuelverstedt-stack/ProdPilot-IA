import type { MailConversation, MailMessage } from "@/features/mail/types/mail";

export function buildMailConversation(messages: readonly MailMessage[]): MailConversation | null {
  if (!messages.length) return null;
  const sorted = messages.toSorted((first, second) => first.receivedAt.localeCompare(second.receivedAt));
  return {
    id: `conversation-${sorted[0].threadId}`,
    threadId: sorted[0].threadId,
    accountId: sorted[0].accountId,
    participants: uniqueParticipants(sorted),
    messages: sorted,
    quotedMessageIds: [],
    updatedAt: sorted.at(-1)?.receivedAt ?? sorted[0].receivedAt,
    memoryStatus: "prepared",
  };
}

function uniqueParticipants(messages: readonly MailMessage[]) {
  const participants = messages.flatMap((message) => [message.from, ...message.to, ...message.cc]);
  return [...new Map(participants.map((participant) => [participant.email.toLocaleLowerCase(), participant])).values()];
}
