import { AppShell } from "@/components/layout/AppShell";
import { MeetingHistory } from "@/features/meetings/components/MeetingHistory";
export default function HistoryPage() { return <AppShell activeSection="meetings" headerTitle="Historique des réunions"><MeetingHistory /></AppShell>; }
