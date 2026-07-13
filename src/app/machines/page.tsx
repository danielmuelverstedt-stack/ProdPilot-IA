import { AppShell } from "@/components/layout/AppShell";
import { MachinesModule } from "@/features/machines/components/MachinesModule";
export default function MachinesPage() { return <AppShell activeSection="machines" headerTitle="Parc Machines"><MachinesModule /></AppShell>; }
