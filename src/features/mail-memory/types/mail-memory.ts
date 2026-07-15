import type { MailAddress, MailProviderType } from "@/features/mail/types/mail";

export type MailMemorySyncStatus = "local" | "synchronized" | "stale" | "deleted_at_source" | "error";
export type MemoryAuthority = "user_confirmed" | "source_fact" | "deterministic" | "validated_ai" | "unconfirmed_ai";
export type SourceAccessState = "available" | "authentication_required" | "unavailable" | "unknown";
export type SourceLinkType = "mail" | "thread" | "attachment" | "draft" | "calendar_event" | "meeting" | "action" | "external_document" | "work_order" | "machine" | "project";
export type MailMemoryStoreName =
  | "mailMessages" | "mailThreads" | "mailAnalyses" | "mailEntities"
  | "mailDecisions" | "commitments" | "replyProposals" | "draftReferences"
  | "assistantSessions" | "assistantCommands" | "assistantAuditEvents"
  | "internalActions" | "followUps" | "meetingRequests" | "contactPreferences"
  | "sourceLinks" | "synchronizationState" | "usageMetrics";

export interface MailMemoryContext {
  accountId: string;
  provider: MailProviderType;
  userId: string;
  companyId: string;
  mode: "demo" | "oauth";
}

export interface MailMemoryRecord extends MailMemoryContext {
  id: string;
  sourceId: string;
  createdAt: string;
  updatedAt: string;
  synchronizationStatus: MailMemorySyncStatus;
}

export interface SourceLink extends MailMemoryRecord {
  sourceType: SourceLinkType;
  externalId: string;
  parentExternalId?: string;
  displayName: string;
  url?: string;
  resolverType: "gmail" | "provider" | "direct" | "unavailable";
  metadata: Record<string, string | number | boolean | null>;
  lastValidatedAt: string | null;
  accessState: SourceAccessState;
}

export interface LocalAttachmentReference {
  attachmentId: string;
  sourceMessageId: string;
  provider: MailProviderType;
  filename: string;
  mimeType: string;
  approximateSizeBytes: number;
  sourceLinkId: string;
  accessState: SourceAccessState;
}

export interface LocalMailMessage extends MailMemoryRecord {
  threadId: string;
  from: MailAddress;
  to: MailAddress[];
  cc: MailAddress[];
  subject: string;
  receivedAt: string;
  cleanedText?: string;
  snippet: string;
  labels: string[];
  isRead: boolean;
  isImportant: boolean;
  contentFingerprint: string;
  synchronizedAt: string;
  attachments: LocalAttachmentReference[];
  sourceLinkIds: string[];
  searchTerms: string[];
}

export interface LocalMailAnalysis extends MailMemoryRecord {
  messageId: string;
  threadId: string;
  contentFingerprint: string;
  promptVersion: string;
  model: string;
  summary: string;
  classification: string;
  entityIds: string[];
  sourceLinkIds: string[];
  confidence: number;
  isTruncated: boolean;
  expiresAt: string;
  authority: "validated_ai" | "deterministic";
}

export interface LocalDecision extends MailMemoryRecord {
  title: string;
  description: string;
  decidedAt: string;
  participants: string[];
  status: "proposed" | "confirmed" | "superseded" | "cancelled";
  confirmedByUser: boolean;
  confidence: number;
  sourceLinkIds: string[];
  relatedMessageId?: string;
  relatedThreadId?: string;
  relatedActionId?: string;
  authority: MemoryAuthority;
}

export interface LocalCommitment extends MailMemoryRecord {
  committedBy: string;
  text: string;
  dueAt: string | null;
  stakeholder: string;
  status: "proposed" | "confirmed" | "completed" | "cancelled";
  confirmedByUser: boolean;
  sourceLinkIds: string[];
  authority: MemoryAuthority;
}

export interface ContactPreference extends MailMemoryRecord {
  contactKey: string;
  language?: string;
  addressForm?: "tu" | "vous";
  responseLength?: "short" | "medium" | "long";
  tone?: string;
  relationshipType?: string;
  contactCompany?: string;
  role?: string;
  phrasesToAvoid: string[];
  usualSignature?: string;
  replyExpectations?: string;
  confirmedByUser: true;
}

export interface LocalAssistantSession extends MailMemoryRecord {
  status: "ready" | "finished" | "deleted";
  startedAt: string;
  endedAt: string | null;
  referencedMessageIds: string[];
  decisionsTaken: string[];
  draftReferenceIds: string[];
  actionIds: string[];
  ignoredMessageIds: string[];
  unresolvedItems: string[];
  summary: string;
  conversation: Array<{ id: string; role: "assistant" | "user"; text: string; createdAt: string }>;
}

export interface PreparedMeetingRequest extends MailMemoryRecord {
  title: string;
  purpose: string;
  suggestedParticipants: string[];
  durationMinutes: number | null;
  preferredDateRange: { from: string | null; to: string | null };
  sourceLinkIds: string[];
  agenda: string[];
  status: "prepared" | "awaiting_information" | "approved" | "cancelled";
}

export interface MailMemoryUsageMetric extends MailMemoryRecord {
  operation: string;
  orchestrationLevel: 0 | 1 | 2;
  sourceCount: number;
  aiCalled: boolean;
}

export interface MailMemorySearchQuery {
  text: string;
  sender?: string;
  recipient?: string;
  threadId?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: string;
  limit?: number;
}

export interface MailMemorySearchResult {
  messages: LocalMailMessage[];
  decisions: LocalDecision[];
  commitments: LocalCommitment[];
  sourceLinks: SourceLink[];
  orchestrationLevel: 0 | 1;
  isPossiblyOutdated: boolean;
}

export interface MailMemorySettings {
  enabled: boolean;
  indexSynchronizedMails: boolean;
  storeCleanedMessageText: boolean;
  keepSourceLinks: boolean;
  storeAnalyses: boolean;
  storeSessionHistory: boolean;
  storeContactPreferences: boolean;
  storeDecisions: boolean;
  mailRetentionDays: number;
  analysisRetentionDays: number;
  sessionRetentionDays: number;
  auditRetentionDays: number;
  maximumLocalSizeMb: number;
  automaticCleanup: boolean;
  offlineAccess: boolean;
  showSourceLinks: boolean;
  aiEscalationMode: "local_first" | "balanced";
  preferLocalResults: boolean;
  askBeforeExpensiveAiCall: boolean;
  lastBackupAt: string | null;
}

export interface MailMemoryBackup {
  format: "prodpilot-mail-memory";
  version: number;
  exportedAt: string;
  context: MailMemoryContext;
  stores: Partial<Record<MailMemoryStoreName, MailMemoryRecord[]>>;
}
