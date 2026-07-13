import { AppShell } from "@/components/layout/AppShell";
import { RequestDetail } from "@/features/requests/components/RequestDetail";
export default async function RequestPage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <AppShell activeSection="tracking" headerTitle="Détail de la demande"><RequestDetail id={id} /></AppShell>; }
