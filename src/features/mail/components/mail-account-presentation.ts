import { MAIL_PROVIDER_CATALOG } from "@/features/mail/config/mail-provider-catalog";
import type { MailAccount, MailProviderType } from "@/features/mail/types/mail";

export const mailProviderLabels: Record<MailProviderType, string> = {
  google: MAIL_PROVIDER_CATALOG.google.label,
  microsoft: MAIL_PROVIDER_CATALOG.microsoft.label,
  imap: MAIL_PROVIDER_CATALOG.imap.label,
  mock: MAIL_PROVIDER_CATALOG.mock.label,
};

export function getMailAccountStatus(account: MailAccount) {
  if (account.mode === "demo") return badge("Mode démonstration", "info");
  if (["microsoft", "imap"].includes(account.provider) || account.status === "unavailable") {
    return badge("Bientôt disponible", "warning");
  }
  const error = account.error?.toLocaleLowerCase("fr") ?? "";
  if (error.includes("configuration")) return badge("Configuration manquante", "warning");
  if (error.includes("expir")) return badge("Connexion expirée", "danger");
  if (account.status === "disconnected" || account.status === "error") {
    return badge("Reconnexion nécessaire", "danger");
  }
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

export const mailDateFormatter = new Intl.DateTimeFormat("fr-BE", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "Europe/Brussels",
});

export function formatMailDate(value: string | null): string {
  return value ? mailDateFormatter.format(new Date(value)) : "Jamais";
}
