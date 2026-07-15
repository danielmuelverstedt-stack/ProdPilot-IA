import type { MailMemorySettings } from "@/features/mail-memory/types/mail-memory";

export const MAIL_MEMORY_DATABASE_NAME = "prodpilot-mail-memory";
export const MAIL_MEMORY_DATABASE_VERSION = 1;
export const MAIL_MEMORY_BACKUP_VERSION = 1;

export const MAIL_MEMORY_DEFAULTS: MailMemorySettings = {
  enabled: true,
  indexSynchronizedMails: true,
  storeCleanedMessageText: true,
  keepSourceLinks: true,
  storeAnalyses: true,
  storeSessionHistory: true,
  storeContactPreferences: true,
  storeDecisions: true,
  mailRetentionDays: 180,
  analysisRetentionDays: 90,
  sessionRetentionDays: 365,
  auditRetentionDays: 180,
  maximumLocalSizeMb: 250,
  automaticCleanup: true,
  offlineAccess: true,
  showSourceLinks: true,
  aiEscalationMode: "local_first",
  preferLocalResults: true,
  askBeforeExpensiveAiCall: true,
  lastBackupAt: null,
};

export const MAIL_MEMORY_STORE_NAMES = [
  "mailMessages", "mailThreads", "mailAnalyses", "mailEntities", "mailDecisions",
  "commitments", "replyProposals", "draftReferences", "assistantSessions",
  "assistantCommands", "assistantAuditEvents", "internalActions", "followUps",
  "meetingRequests", "contactPreferences", "sourceLinks", "synchronizationState",
  "usageMetrics",
] as const;
