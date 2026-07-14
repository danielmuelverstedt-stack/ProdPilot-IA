import type { MailAiConfiguration, MailAiPriority } from "@/features/ai/types/mail-ai";
import type { AppSettings } from "@/features/settings/types/settings";
import type { MailAccount } from "@/features/mail/types/mail";

export function createMailAiConfiguration(settings: AppSettings, account: MailAccount): MailAiConfiguration {
  const priorities = settings.production.priorities
    .filter((item) => item.active)
    .sort((left, right) => left.order - right.order);
  return {
    categories: settings.ai.categories.filter((item) => item.active).sort((left, right) => left.order - right.order).map(({ id, label }) => ({ id, label })),
    priorities: priorities.map((item, index) => ({ id: item.id, label: item.label, level: priorityLevel(index, priorities.length) })),
    preferredLanguage: settings.ai.preferredResponseLanguage,
    defaultTone: settings.ai.defaultTone,
    defaultLength: settings.ai.defaultLength,
    includeSignature: settings.ai.includeSignature,
    signature: account.settings.signature,
    maximumThreadMessages: settings.ai.maximumThreadMessages,
    maximumInputContextTokens: settings.ai.maximumInputContextTokens,
    maximumAnalysisOutputTokens: settings.ai.maximumAnalysisOutputTokens,
    maximumReplyOutputTokens: settings.ai.maximumReplyOutputTokens,
    maximumRewriteOutputTokens: settings.ai.maximumRewriteOutputTokens,
    longThreadWarningThreshold: settings.ai.longThreadWarningThreshold,
    budgetPolicy: settings.ai.budgetPolicy,
    pricingRegistry: settings.ai.pricingRegistry,
    includeAttachmentMetadata: settings.ai.includeAttachmentMetadata,
    privacyAcknowledged: Boolean(settings.ai.privacyAcknowledgedAt),
    allowDraftCreation: settings.ai.allowDraftCreation,
    allowCachedResults: settings.ai.retainLocalAnalysisCache,
    analysisExpirationMinutes: settings.ai.analysisExpirationMinutes,
  };
}

function priorityLevel(index: number, count: number): MailAiPriority["level"] {
  if (index === count - 1 && count > 2) return "urgent";
  if (index >= count - 2 && count > 1) return "high";
  if (index === 0) return "low";
  return "normal";
}
