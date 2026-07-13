import { AppShell } from "@/components/layout/AppShell";
import { WorkOrderDetail } from "@/features/work-orders/components/WorkOrderDetail";

export default async function WorkOrderPage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <AppShell activeSection="work-orders" headerTitle="Détail OF"><WorkOrderDetail id={id} /></AppShell>; }
