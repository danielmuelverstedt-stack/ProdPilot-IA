import { AppShell } from "@/components/layout/AppShell";
import { MeetingsModule } from "@/features/meetings/components/MeetingsModule";
export default function MeetingsPage() { return <AppShell activeSection="meetings" headerTitle="Réunions"><MeetingsModule /></AppShell>; }
