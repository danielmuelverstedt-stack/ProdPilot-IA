import { AppShell } from "@/components/layout/AppShell";
import { MeetingWorkflow } from "@/features/meetings/components/MeetingWorkflow";
export default function QrqcPage() { return <AppShell activeSection="meetings" headerTitle="QRQC"><MeetingWorkflow type="QRQC" /></AppShell>; }
