import type { MailProviderType } from "@/features/mail/types/mail";

export interface MailProviderDefinition {
  type: MailProviderType;
  label: string;
  shortLabel: string;
  description: string;
  availability: "available" | "planned" | "demonstration";
  capabilities: {
    read: boolean;
    search: boolean;
    drafts: boolean;
    attachments: boolean;
  };
}

export const MAIL_PROVIDER_CATALOG: Record<MailProviderType, MailProviderDefinition> = {
  google: {
    type: "google",
    label: "Google Workspace",
    shortLabel: "Google",
    description: "Gmail via une connexion OAuth sécurisée côté serveur.",
    availability: "available",
    capabilities: { read: true, search: true, drafts: true, attachments: true },
  },
  microsoft: {
    type: "microsoft",
    label: "Microsoft 365",
    shortLabel: "Microsoft",
    description: "Connexion Outlook prévue via Microsoft Graph.",
    availability: "planned",
    capabilities: { read: false, search: false, drafts: false, attachments: false },
  },
  imap: {
    type: "imap",
    label: "Messagerie IMAP",
    shortLabel: "IMAP",
    description: "Connecteur générique prévu pour une phase ultérieure.",
    availability: "planned",
    capabilities: { read: false, search: false, drafts: false, attachments: false },
  },
  mock: {
    type: "mock",
    label: "Compte de démonstration",
    shortLabel: "Démonstration",
    description: "Données locales sans connexion à un service externe.",
    availability: "demonstration",
    capabilities: { read: true, search: true, drafts: false, attachments: true },
  },
};

export function getMailProviderDefinition(type: MailProviderType): MailProviderDefinition {
  return MAIL_PROVIDER_CATALOG[type];
}

export function getMailProviderReconnectHref(type: MailProviderType, accountId: string): string | null {
  return type === "google" ? `/api/auth/google?accountId=${encodeURIComponent(accountId)}` : null;
}
