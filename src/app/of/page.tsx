import { AppShell } from "@/components/layout/AppShell";
import { WorkOrdersModule } from "@/features/work-orders/components/WorkOrdersModule";

export default function WorkOrdersPage() { return <AppShell activeSection="work-orders" headerTitle="OF"><WorkOrdersModule /></AppShell>; }
