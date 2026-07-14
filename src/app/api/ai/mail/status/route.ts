import { getAiModelRoute } from "@/features/ai/config/ai-model-routing";
import { getOpenAiConfigurationStatus } from "@/features/ai/config/openai-config";
import { getMailAiTokenBudget } from "@/features/ai/config/ai-token-budget";
import { getAiUsageSummary } from "@/features/ai/services/mail-ai-service";
import { apiJson } from "@/features/mail/server/mail-api-response";

export const runtime = "nodejs";

export async function GET() {
  const status = getOpenAiConfigurationStatus();
  return apiJson({
    status,
    models: status.configured ? {
      analysis: getAiModelRoute("mail_analysis").model,
      reply: getAiModelRoute("mail_reply").model,
      rewrite: getAiModelRoute("mail_rewrite").model,
    } : { analysis: status.model, reply: status.model, rewrite: status.model },
    budgets: {
      analysis: getMailAiTokenBudget("mail_analysis"),
      reply: getMailAiTokenBudget("mail_reply"),
      rewrite: getMailAiTokenBudget("mail_rewrite"),
    },
    cache: { operational: process.env.NODE_ENV !== "production", type: "local-development" },
    usage: await getAiUsageSummary(),
    automaticAnalysis: false,
    sendingEnabled: false,
  });
}
