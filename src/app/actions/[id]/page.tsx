import { AppShell } from "@/components/layout/AppShell";
import { ActionDetail } from "@/features/actions/components/ActionDetail";

export default async function ActionPage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <AppShell activeSection="actions" headerTitle="Détail de l’action"><ActionDetail id={id} /></AppShell>; }
