import "server-only";

import type { MailAiOperationType } from "@/features/ai/types/ai";
import { getOpenAiServerConfig } from "@/features/ai/config/openai-config";

export interface AiModelRoute {
  model: string;
  fallbackModel: string | null;
  reasoningEffort: "none" | "low";
}

export function getAiModelRoute(operation: MailAiOperationType): AiModelRoute {
  const fallback = getOpenAiServerConfig().model;
  const configured = operation === "mail_analysis"
    ? process.env.OPENAI_MAIL_ANALYSIS_MODEL
    : operation === "mail_reply"
      ? process.env.OPENAI_MAIL_REPLY_MODEL
      : operation === "mail_rewrite"
        ? process.env.OPENAI_MAIL_REWRITE_MODEL
        : operation === "mail_compose"
          ? process.env.OPENAI_MAIL_COMPOSE_MODEL
          : undefined;
  return {
    model: configured?.trim() || fallback,
    fallbackModel: configured?.trim() && configured.trim() !== fallback ? fallback : null,
    reasoningEffort: operation === "mail_analysis" ? "low" : "none",
  };
}

export function getPromptCacheKey(operation: MailAiOperationType): string | undefined {
  const prefix = process.env.OPENAI_PROMPT_CACHE_KEY_PREFIX?.trim() || "prodpilot-mail-ai-v1";
  return `${prefix}:${operation}`;
}
