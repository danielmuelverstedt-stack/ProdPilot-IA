import { connection } from "next/server";
import { AppShell } from "@/components/layout/AppShell";
import { getMailWorkspaceMessages } from "@/features/mail/services/mail-workspace";
import { WorkspaceDashboard } from "@/features/workspace/components/WorkspaceDashboard";

const dateFormatter = new Intl.DateTimeFormat("fr-BE", { weekday: "long", day: "2-digit", month: "long", year: "numeric", timeZone: "Europe/Brussels" });

export default async function HomePage() {
  await connection();
  const messages = await getMailWorkspaceMessages();
  return <AppShell activeSection="workspace" headerTitle="Mon Espace"><WorkspaceDashboard urgentMailCount={messages.filter((item) => item.category === "urgent").length} replyMailCount={messages.filter((item) => item.category === "reply_required").length} date={dateFormatter.format(new Date())} /></AppShell>;
}
