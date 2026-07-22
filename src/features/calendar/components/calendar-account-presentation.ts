import type { CalendarAccount } from "@/features/calendar/types/calendar";

export function getCalendarAccountStatus(account: CalendarAccount) {
  if (account.mode === "demo") return badge("Mode démonstration", "info");
  const error = account.error?.toLocaleLowerCase("fr") ?? "";
  if (error.includes("configuration")) return badge("Configuration manquante", "warning");
  if (error.includes("expir")) return badge("Connexion expirée", "danger");
  if (account.status === "disconnected" || account.status === "error") return badge("Reconnexion nécessaire", "danger");
  return badge("Connecté", "success");
}

function badge(label: string, tone: "success" | "info" | "warning" | "danger") {
  const classes = {
    success: "border-[#b9dccc] bg-[#edf8f3] text-[#1d694b]",
    info: "border-blue-200 bg-blue-50 text-blue-800",
    warning: "border-amber-200 bg-amber-50 text-amber-800",
    danger: "border-red-200 bg-red-50 text-red-800",
  }[tone];
  return { label, classes };
}

export const calendarDateFormatter = new Intl.DateTimeFormat("fr-BE", { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Brussels" });

export function formatCalendarDate(value: string | null): string {
  return value ? calendarDateFormatter.format(new Date(value)) : "Jamais";
}
