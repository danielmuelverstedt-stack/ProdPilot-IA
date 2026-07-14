import type {
  AiConfidence,
  AiProviderType,
  AiRequestContext,
  AiSourceReference,
  AiUsageMetadata,
} from "@/features/ai/types/ai";

export type MailAiReplyTone =
  | "professional"
  | "concise"
  | "diplomatic"
  | "direct"
  | "technical"
  | "internal"
  | "customer"
  | "supplier";

export type MailAiReplyLength = "short" | "medium" | "long";
export type MailAiRewriteCommand =
  | "shorter"
  | "more_diplomatic"
  | "more_direct"
  | "more_professional"
  | "more_technical"
  | "simplify"
  | "translate"
  | "custom";

export interface MailAiSummary { text: string }
export interface MailAiClassification { id: string; label: string }
export interface MailAiPriority { id: string; label: string; level: "low" | "normal" | "high" | "urgent" }
export interface MailAiDetectedEntity { type: string; label: string; value: string; sourceText: string }
export interface MailAiImportantDate { label: string; value: string; sourceText: string }
export interface MailAiSuggestedAction { id: string; label: string; description: string; requiresConfirmation: boolean }

export interface MailAiAnalysis {
  summary: MailAiSummary;
  category: MailAiClassification;
  priority: MailAiPriority;
  requiresReply: boolean;
  reasoning: string;
  detectedEntities: MailAiDetectedEntity[];
  importantDates: MailAiImportantDate[];
  suggestedActions: MailAiSuggestedAction[];
  missingInformation: string[];
  confidence: AiConfidence;
  sourceReferences: AiSourceReference[];
  generatedAt: string;
  provider: AiProviderType;
  model: string;
  promptVersion: string;
  usage: AiUsageMetadata | null;
  cached: boolean;
}

export interface MailAiReply {
  recipients: string[];
  cc: string[];
  bcc: string[];
  subject: string;
  bodyText: string;
  tone: MailAiReplyTone;
  language: string;
  generatedAt: string;
  provider: AiProviderType;
  model: string;
  promptVersion: string;
  usage: AiUsageMetadata | null;
}

export interface MailAiMessageContext {
  id: string;
  threadId: string;
  subject: string;
  sender: string;
  recipients: string[];
  receivedAt: string;
  bodyText: string;
  attachmentMetadata: Array<{ filename: string; mimeType: string; sizeBytes: number }>;
}

export interface MailAiConfiguration {
  categories: Array<{ id: string; label: string }>;
  priorities: Array<{ id: string; label: string; level: MailAiPriority["level"] }>;
  preferredLanguage: string;
  defaultTone: MailAiReplyTone;
  defaultLength: MailAiReplyLength;
  includeSignature: boolean;
  signature: string;
  maximumThreadMessages: number;
  maximumInputContextTokens: number;
  maximumAnalysisOutputTokens: number;
  maximumReplyOutputTokens: number;
  maximumRewriteOutputTokens: number;
  dailyHardLimit: number;
  longThreadWarningThreshold: number;
  includeAttachmentMetadata: boolean;
  privacyAcknowledged: boolean;
  allowDraftCreation: boolean;
  allowCachedResults: boolean;
  analysisExpirationMinutes: number;
}

export interface MailAiAnalysisInput {
  context: AiRequestContext;
  message: MailAiMessageContext;
  thread: MailAiMessageContext[];
  configuration: MailAiConfiguration;
}

export interface MailAiReplyInput extends MailAiAnalysisInput {
  instructions: string;
  intent: "reply" | "reply_all";
  tone: MailAiReplyTone;
  length: MailAiReplyLength;
}

export interface MailAiRewriteInput extends MailAiReplyInput {
  currentReply: MailAiReply;
  command: MailAiRewriteCommand;
}
