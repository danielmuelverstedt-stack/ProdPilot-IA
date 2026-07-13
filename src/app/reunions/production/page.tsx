import { AppShell } from "@/components/layout/AppShell";
import { MeetingWorkflow } from "@/features/meetings/components/MeetingWorkflow";
export default function ProductionMeetingPage() { return <AppShell activeSection="meetings" headerTitle="Réunion Production"><MeetingWorkflow type="Production" /></AppShell>; }
