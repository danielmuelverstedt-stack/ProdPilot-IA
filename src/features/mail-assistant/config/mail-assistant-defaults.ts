import type { MailAssistantGroup } from "@/features/mail-assistant/types/mail-assistant";

export const MAIL_ASSISTANT_GROUP_LABELS: Record<MailAssistantGroup, string> = {
  now: "À traiter maintenant",
  reply: "Réponse nécessaire",
  action: "Action à créer",
  review: "À vérifier",
  information: "Information",
  no_action: "Aucune action recommandée",
  processed: "Traités",
};

export const MAIL_ASSISTANT_DEFAULTS = {
  maximumMessages: 25,
  noActionMinimumConfidence: 0.82,
  compactResponses: true,
  voiceEnabled: true,
  sendingEnabled: false as const,
  analysisOnlyAfterExplicitStart: true as const,
};
