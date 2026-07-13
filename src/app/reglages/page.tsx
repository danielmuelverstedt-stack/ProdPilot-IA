import { AppShell } from "@/components/layout/AppShell";
import { SettingsCenter } from "@/features/settings/components/SettingsCenter";

export default function SettingsPage() { return <AppShell activeSection="settings" headerTitle="Réglages"><SettingsCenter /></AppShell>; }
