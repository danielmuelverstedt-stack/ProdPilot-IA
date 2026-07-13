import { AppShell } from "@/components/layout/AppShell";
import { MachineDetail } from "@/features/machines/components/MachineDetail";
export default async function MachinePage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <AppShell activeSection="machines" headerTitle="Détail machine"><MachineDetail id={id} /></AppShell>; }
