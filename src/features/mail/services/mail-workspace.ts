import "server-only";

import { getMailProviders } from "@/features/mail/providers/provider-factory";
import type { MailMessage } from "@/features/mail/types/mail";

export async function getMailWorkspaceMessages(): Promise<MailMessage[]> {
  const messageGroups = await Promise.all(
    getMailProviders().map(async (provider) => {
      const status = await provider.getConnectionStatus();
      return status.state === "connected" ? provider.listMessages() : [];
    }),
  );

  return messageGroups
    .flat()
    .sort(
      (first, second) =>
        new Date(second.receivedAt).getTime() - new Date(first.receivedAt).getTime(),
    );
}
