import type { MeetingSendChannelType } from "@/features/demo/types/demo";

export interface MeetingSendChannelDefinition {
  type: MeetingSendChannelType;
  label: string;
  shortLabel: string;
  description: string;
  availability: "available" | "planned";
}

/**
 * Catalogue des canaux d'envoi du document de préparation (et du compte rendu) d'une réunion, même
 * forme que `MAIL_PROVIDER_CATALOG` (`src/features/mail/config/mail-provider-catalog.ts`) : déclare
 * un canal même avant qu'il soit implémenté (« prévu »), pour que l'interface reste stable quand un
 * nouveau canal est ajouté.
 */
export const MEETING_SEND_CHANNEL_CATALOG: Record<MeetingSendChannelType, MeetingSendChannelDefinition> = {
  email: {
    type: "email",
    label: "E-mail",
    shortLabel: "E-mail",
    description: "Brouillon Gmail à relire et envoyer manuellement.",
    availability: "available",
  },
  print: {
    type: "print",
    label: "Impression / PDF",
    shortLabel: "Impression",
    description: "Aperçu imprimable ; utilisez « Enregistrer en PDF » dans la boîte d'impression du navigateur.",
    availability: "available",
  },
  teams: {
    type: "teams",
    label: "Microsoft Teams",
    shortLabel: "Teams",
    description: "Partage direct dans un canal Teams, prévu pour une phase ultérieure.",
    availability: "planned",
  },
};

export function getMeetingSendChannelDefinition(type: MeetingSendChannelType): MeetingSendChannelDefinition {
  return MEETING_SEND_CHANNEL_CATALOG[type];
}
