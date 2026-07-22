import type { MailAccountSettings } from "@/features/mail/types/mail";

export const DEFAULT_MAIL_ACCOUNT_SETTINGS: Readonly<MailAccountSettings> = {
  preferredLanguage: "fr",
  defaultReplyTone: "professional",
  synchronizationPeriodMinutes: 15,
  maximumMessagesRetrieved: 25,
  unreadMessagesOnly: false,
  includeAttachmentMetadata: true,
  automaticDraftCreation: false,
  displayDensity: "comfortable",
  previewPaneEnabled: true,
  readingPanePosition: "bottom",
  conversationMode: "threaded",
  groupMessagesByThread: true,
  dateFormat: "dd/MM/yyyy",
  timeFormat: "24h",
  signature: "",
  replyBehavior: "reply",
  notifyOnNewMail: true,
  notifyOnSynchronization: false,
  notifyOnConnectionLoss: true,
  defaultFilter: "all",
  defaultSort: "newest",
  favoriteFolders: [],
  draftAutosaveEnabled: false,
  draftAutosaveDelaySeconds: 30,
  keepDraftHistory: true,
  sendingEnabled: false,
};

export function createDefaultMailAccountSettings(): MailAccountSettings {
  return { ...DEFAULT_MAIL_ACCOUNT_SETTINGS, favoriteFolders: [...DEFAULT_MAIL_ACCOUNT_SETTINGS.favoriteFolders] };
}

export function isMailAccountSettings(value: unknown): value is MailAccountSettings {
  if (!isRecord(value)) return false;
  return ["fr", "nl", "en"].includes(String(value.preferredLanguage))
    && ["professional", "concise", "warm", "neutral"].includes(String(value.defaultReplyTone))
    && isIntegerBetween(value.synchronizationPeriodMinutes, 5, 1_440)
    && isIntegerBetween(value.maximumMessagesRetrieved, 1, 100)
    && typeof value.unreadMessagesOnly === "boolean"
    && typeof value.includeAttachmentMetadata === "boolean"
    && typeof value.automaticDraftCreation === "boolean"
    && ["compact", "comfortable"].includes(String(value.displayDensity))
    && typeof value.previewPaneEnabled === "boolean"
    && ["hidden", "right", "bottom"].includes(String(value.readingPanePosition))
    && ["threaded", "individual"].includes(String(value.conversationMode))
    && typeof value.groupMessagesByThread === "boolean"
    && ["dd/MM/yyyy", "dd/MM/yy"].includes(String(value.dateFormat))
    && value.timeFormat === "24h"
    && typeof value.signature === "string" && value.signature.length <= 5_000
    && ["reply", "reply_all"].includes(String(value.replyBehavior))
    && typeof value.notifyOnNewMail === "boolean"
    && typeof value.notifyOnSynchronization === "boolean"
    && typeof value.notifyOnConnectionLoss === "boolean"
    && ["all", "unread", "urgent", "reply_required"].includes(String(value.defaultFilter))
    && ["newest", "oldest", "priority"].includes(String(value.defaultSort))
    && isStringArray(value.favoriteFolders, 20, 80)
    && typeof value.draftAutosaveEnabled === "boolean"
    && isIntegerBetween(value.draftAutosaveDelaySeconds, 5, 300)
    && typeof value.keepDraftHistory === "boolean"
    && typeof value.sendingEnabled === "boolean";
}

/** Complète les anciens réglages persistés sans perdre le compte associé. L'envoi reste désactivé par défaut : seule une action explicite de l'utilisateur dans Réglages peut l'activer. */
export function migrateMailAccountSettings(value: unknown): MailAccountSettings | null {
  if (!isRecord(value)) return null;
  const migrated = Object.fromEntries(
    Object.entries(DEFAULT_MAIL_ACCOUNT_SETTINGS).map(([key, fallback]) => [
      key,
      key === "sendingEnabled" ? value[key] === true : value[key] ?? fallback,
    ]),
  );
  return isMailAccountSettings(migrated) ? { ...migrated, favoriteFolders: [...migrated.favoriteFolders] } : null;
}

function isIntegerBetween(value: unknown, minimum: number, maximum: number): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= minimum && value <= maximum;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown, maximumItems: number, maximumLength: number): value is string[] {
  return Array.isArray(value)
    && value.length <= maximumItems
    && value.every((item) => typeof item === "string" && item.length <= maximumLength);
}
