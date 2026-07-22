export type AiProviderType = "openai" | "mock";
export type AiConfidence = "low" | "medium" | "high";
export type AiOperationType = "mail_analysis" | "mail_reply" | "mail_rewrite" | "mail_conversation" | "mail_compose" | "connection_test";
export type MailAiOperationType = Exclude<AiOperationType, "connection_test">;

export type AiCurrency = "EUR" | "USD";

export interface AiBudgetPolicy {
  monthlyBudgetAmount: number;
  monthlyWarningAmount: number;
  monthlyHardStopAmount: number;
  dailyRequestLimit: number;
  perUserDailyRequestLimit: number;
  perMessageAnalysisLimit: number;
  perDraftRewriteLimit: number;
  allowAdministratorOverride: boolean;
  administratorOverrideActive: boolean;
  currencyDisplay: AiCurrency;
}

export interface AiPricingEntry {
  id: string;
  provider: "openai";
  model: string;
  inputPricePerMillionTokens: number;
  cachedInputPricePerMillionTokens: number;
  outputPricePerMillionTokens: number;
  currency: AiCurrency;
  effectiveDate: string;
  sourceNote: string;
  enabled: boolean;
}

export interface AiTokenBudget {
  maximumInputTokens: number;
  maximumOutputTokens: number;
}

export interface MailAiTokenBudget extends AiTokenBudget {
  maximumThreadMessages: number;
  maximumCharactersPerMessage: number;
  maximumQuotedHistoryCharacters: number;
  maximumAttachmentMetadataEntries: number;
  maximumCustomInstructionLength: number;
}

export interface AiRequestContext {
  accountId: string;
  mailProvider: string;
  accountEmail: string;
  preferredLanguage: string;
  organizationId?: string | null;
}

export interface AiSourceReference {
  type: "message" | "thread" | "attachment_metadata";
  id: string;
  label: string;
}

export interface AiUsageMetadata {
  inputTokens: number | null;
  cachedInputTokens: number | null;
  outputTokens: number | null;
  totalTokens: number | null;
}

export interface AiUsageRecord {
  id: string;
  operation: AiOperationType;
  provider: AiProviderType;
  model: string;
  accountId: string;
  companyId: string;
  userId: string;
  messageReference: string;
  inputTokens: number | null;
  cachedInputTokens: number | null;
  outputTokens: number | null;
  totalTokens: number | null;
  durationMs: number;
  providerRequestAttempted: boolean;
  cacheStatus: "hit" | "miss" | "not_applicable";
  success: boolean;
  errorCode: AiError["code"] | null;
  estimatedCost: number | null;
  estimatedCostAvoided: number | null;
  estimatedCostCurrency: AiCurrency | null;
  createdAt: string;
}

export interface AiError {
  code:
    | "not_configured"
    | "privacy_acknowledgment_required"
    | "confirmation_required"
    | "authentication"
    | "quota"
    | "rate_limit"
    | "budget_blocked"
    | "timeout"
    | "model_unavailable"
    | "invalid_output"
    | "invalid_input"
    | "message_unavailable"
    | "account_changed"
    | "provider_unavailable";
  message: string;
  recoverable: boolean;
  status: number;
}

export class AiServiceError extends Error {
  constructor(public readonly detail: AiError) {
    super(detail.message);
    this.name = "AiServiceError";
  }
}
