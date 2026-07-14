import "server-only";

import { AiServiceError } from "@/features/ai/types/ai";
import { aiUsageRepository } from "@/features/ai/server/repositories/local-ai-usage-repository";

const DEFAULT_DAILY_LIMIT = 100;
const DEFAULT_MESSAGE_ANALYSIS_LIMIT = 10;
const DEFAULT_DRAFT_REWRITE_LIMIT = 20;

export async function enforceAiUsageLimit(input: {
  userId: string;
  companyId: string;
  messageReference: string;
  operation: "mail_analysis" | "mail_reply" | "mail_rewrite";
  requestedDailyLimit: number;
}) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const entries = await aiUsageRepository.listSince(start.toISOString());
  const serverLimit = parseLimit(process.env.OPENAI_DAILY_REQUEST_LIMIT, DEFAULT_DAILY_LIMIT);
  const dailyLimit = Math.min(serverLimit, input.requestedDailyLimit);
  const successfulCalls = entries.filter((entry) => entry.success && entry.provider === "openai");
  if (successfulCalls.filter((entry) => entry.userId === input.userId).length >= dailyLimit
    || successfulCalls.filter((entry) => entry.companyId === input.companyId).length >= dailyLimit) {
    throw new AiServiceError({ code: "rate_limit", message: "La limite quotidienne d’utilisation de l’IA est atteinte. Aucun appel OpenAI n’a été effectué.", recoverable: true, status: 429 });
  }
  const sameReference = successfulCalls.filter((entry) => entry.messageReference === input.messageReference && entry.operation === input.operation);
  const operationLimit = input.operation === "mail_rewrite" ? DEFAULT_DRAFT_REWRITE_LIMIT : input.operation === "mail_analysis" ? DEFAULT_MESSAGE_ANALYSIS_LIMIT : dailyLimit;
  if (sameReference.length >= operationLimit) {
    throw new AiServiceError({ code: "rate_limit", message: "La limite d’opérations IA pour ce message est atteinte. Aucun appel OpenAI n’a été effectué.", recoverable: true, status: 429 });
  }
}

function parseLimit(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}
