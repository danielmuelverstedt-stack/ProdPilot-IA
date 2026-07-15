import { MailAssistantWorkspace } from "@/features/mail-assistant/components/MailAssistantWorkspace";
import { getActiveMailContext } from "@/features/mail/services/mail-account-context";

export const dynamic = "force-dynamic";

export default async function MailAssistantPage() {
  const { account } = await getActiveMailContext();
  return <MailAssistantWorkspace initialAccount={{ id: account.id, provider: account.provider, displayName: account.displayName, emailAddress: account.emailAddress, mode: account.mode, organizationId: account.organizationId ?? null, lastSyncAt: account.lastSuccessfulSyncAt }}/>;
}
