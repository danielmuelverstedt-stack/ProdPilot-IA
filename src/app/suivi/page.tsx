import { AppShell } from "@/components/layout/AppShell";
import { RequestsModule } from "@/features/requests/components/RequestsModule";
export default function RequestsPage() { return <AppShell activeSection="tracking" headerTitle="Suivi"><RequestsModule /></AppShell>; }
