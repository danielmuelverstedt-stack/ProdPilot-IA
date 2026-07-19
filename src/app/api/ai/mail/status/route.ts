import { getAiModelRoute } from "@/features/ai/config/ai-model-routing";
import { getOpenAiConfigurationStatus } from "@/features/ai/config/openai-config";
import { getMailAiTokenBudget } from "@/features/ai/config/ai-token-budget";
import { aiUsageRepository } from "@/features/ai/server/repositories/local-ai-usage-repository";
import { apiJson } from "@/features/mail/server/mail-api-response";

export const runtime = "nodejs";

export async function GET() {
  const status = getOpenAiConfigurationStatus();
  const configuredDailyLimit = parseDailyLimit(process.env.OPENAI_DAILY_REQUEST_LIMIT);
  const entries = await aiUsageRepository.listSince("1970-01-01T00:00:00.000Z");
  return apiJson({
    status,
    models: status.configured ? {
      analysis: getAiModelRoute("mail_analysis").model,
      reply: getAiModelRoute("mail_reply").model,
      rewrite: getAiModelRoute("mail_rewrite").model,
      conversation: getAiModelRoute("mail_conversation").model,
    } : { analysis: status.model, reply: status.model, rewrite: status.model, conversation: status.model },
    budgets: {
      analysis: getMailAiTokenBudget("mail_analysis"),
      reply: getMailAiTokenBudget("mail_reply"),
      rewrite: getMailAiTokenBudget("mail_rewrite"),
      conversation: getMailAiTokenBudget("mail_conversation"),
    },
    cache: { operational: process.env.NODE_ENV !== "production", type: "local-development" },
    limits: { dailyServerLimit: configuredDailyLimit },
    mailAiEnvironmentEnabled: process.env.OPENAI_MAIL_AI_ENABLED?.trim().toLowerCase() === "true",
    deterministicFallbackAvailable: true,
    tokenUsageAvailable: aiUsageRepository.isOperational(),
    usageRepositoryOperational: aiUsageRepository.isOperational(),
    promptCacheUsageAvailable: true,
    configurationChecks: {
      apiKeyPresent: Boolean(process.env.OPENAI_API_KEY?.trim()),
      baseModelConfigured: Boolean(process.env.OPENAI_MODEL?.trim()),
      connectionTestedAt: entries.filter((entry) => entry.operation === "connection_test" && entry.success).at(-1)?.createdAt ?? null,
    },
    automaticAnalysis: false,
    automaticDraftCreation: false,
    sendingEnabled: false,
  });
}

function parseDailyLimit(value: string | undefined) { const parsed = Number(value); return Number.isInteger(parsed) && parsed > 0 ? parsed : 50; }
