import type { CreateMailDraftInput, MailDraft, MailDraftRevision, MailProviderType } from "@/features/mail/types/mail";

export function createMailDraftWorkingCopy(
  accountId: string,
  provider: MailProviderType,
  input: CreateMailDraftInput,
  now = new Date(),
): MailDraft {
  const timestamp = now.toISOString();
  return {
    id: `working-${accountId}-${now.getTime()}`,
    accountId,
    provider,
    to: input.to,
    cc: input.cc ?? [],
    bcc: input.bcc ?? [],
    subject: input.subject,
    bodyText: input.bodyText,
    createdAt: timestamp,
    updatedAt: timestamp,
    status: "draft",
    threadId: input.replyToThreadId,
    source: "user",
    hasUnsavedChanges: true,
    version: 1,
  };
}

export function reviseMailDraft(draft: MailDraft, bodyText: string, now = new Date()): {
  draft: MailDraft;
  revision: MailDraftRevision;
} {
  const version = (draft.version ?? 1) + 1;
  return {
    draft: { ...draft, bodyText, updatedAt: now.toISOString(), hasUnsavedChanges: true, version },
    revision: { id: `${draft.id}-v${version}`, draftId: draft.id, version, bodyText, createdAt: now.toISOString(), source: "user" },
  };
}
