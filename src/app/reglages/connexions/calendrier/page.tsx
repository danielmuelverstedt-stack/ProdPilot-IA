import { connection } from "next/server";
import { AppShell } from "@/components/layout/AppShell";
import { CalendarConnectionsPanel } from "@/features/calendar/components/CalendarConnectionsPanel";
import { getGoogleCalendarConfigurationStatus } from "@/features/calendar/server/google/google-calendar-config";
import { getCalendarAccounts } from "@/features/calendar/services/calendar-connections";

interface CalendarSettingsPageProps {
  searchParams: Promise<{ google?: string; reason?: string }>;
}

export default async function CalendarSettingsPage({ searchParams }: CalendarSettingsPageProps) {
  await connection();
  const query = await searchParams;
  const accounts = await getCalendarAccounts();
  const initialNotice = getGoogleNotice(query.google, query.reason) ?? getGoogleConfigurationNotice();

  return (
    <AppShell activeSection="settings" headerTitle="Réglages">
      <div className="mx-auto max-w-7xl">
        <nav aria-label="Fil d’Ariane" className="text-sm text-[#64736c]"><ol className="flex flex-wrap items-center gap-2"><li>Réglages</li><li aria-hidden="true">/</li><li>Connexions</li><li aria-hidden="true">/</li><li className="font-medium text-[#263b32]" aria-current="page">Calendrier</li></ol></nav>
        <header className="mt-7 max-w-3xl"><p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#247052]">Centre de connexions</p><h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#17211d] sm:text-4xl">Calendrier</h1><p className="mt-4 text-base leading-7 text-[#64736c] sm:text-lg">Connectez votre agenda Google Calendar pour voir vos réunions du jour dans Mon Espace et en planifier de nouvelles depuis l’assistant.</p></header>
        <CalendarConnectionsPanel initialAccounts={accounts} initialNotice={initialNotice} />
      </div>
    </AppShell>
  );
}

function getGoogleConfigurationNotice() {
  const configuration = getGoogleCalendarConfigurationStatus();
  if (configuration.isValid) return undefined;
  return { tone: "error" as const, message: configuration.error };
}

function getGoogleNotice(google?: string, reason?: string) {
  if (google === "connected") return { tone: "success" as const, message: "Compte Google Calendar connecté et activé." };
  if (google !== "error") return undefined;
  const messages: Record<string, string> = {
    configuration: "Configuration Google Calendrier absente ou invalide. Vérifiez les variables serveur.",
    account: "Compte Google non autorisé par la politique serveur.",
    state: "Session OAuth invalide ou expirée. Recommencez la connexion.",
    token: "Autorisation refusée, révoquée ou incomplète. Reconnectez le compte.",
    oauth: "Autorisation Google annulée ou refusée.",
  };
  return { tone: "error" as const, message: messages[reason ?? "oauth"] ?? messages.oauth };
}
