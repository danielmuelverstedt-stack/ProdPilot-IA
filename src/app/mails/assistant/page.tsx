import { AppShell } from "@/components/layout/AppShell";
import { MailAssistantWorkspace } from "@/features/mail-assistant/components/MailAssistantWorkspace";
import { getActiveMailContext } from "@/features/mail/services/mail-account-context";

export const dynamic = "force-dynamic";

export default async function MailAssistantPage() {
  const { account } = await getActiveMailContext();
  return <AppShell activeSection="mails" headerTitle="Assistant mails"><MailAssistantWorkspace initialAccount={account}/></AppShell>;
}
