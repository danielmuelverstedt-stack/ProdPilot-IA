import "server-only";

import { listActiveMailMessages } from "@/features/mail/services/mail-account-context";
import type { MailMessage } from "@/features/mail/types/mail";

export async function getMailWorkspaceMessages(): Promise<MailMessage[]> {
  try {
    const { account, messages } = await listActiveMailMessages();
    if (account.status !== "connected") return [];
    return messages.sort(
      (first, second) =>
        new Date(second.receivedAt).getTime() - new Date(first.receivedAt).getTime(),
    );
  } catch {
    return [];
  }
}
