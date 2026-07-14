import type { MailNotification, MailNotificationType } from "@/features/mail/types/mail";

export function createMailNotification(
  accountId: string,
  type: MailNotificationType,
  message: string,
  now = new Date(),
): MailNotification {
  const presentation = notificationPresentation[type];
  return {
    id: `mail-notification-${accountId}-${now.getTime()}`,
    accountId,
    type,
    title: presentation.title,
    message,
    createdAt: now.toISOString(),
    severity: presentation.severity,
  };
}

const notificationPresentation: Record<MailNotificationType, Pick<MailNotification, "title" | "severity">> = {
  new_mail: { title: "Nouveau message", severity: "information" },
  synchronization: { title: "Synchronisation terminée", severity: "information" },
  connection_lost: { title: "Connexion interrompue", severity: "warning" },
  provider_error: { title: "Fournisseur indisponible", severity: "error" },
  draft_saved: { title: "Brouillon enregistré", severity: "information" },
  future_ai_completed: { title: "Analyse préparée", severity: "information" },
};
