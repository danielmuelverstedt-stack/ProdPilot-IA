import "server-only";

import OpenAI from "openai";
import type { AiProvider } from "@/features/ai/services/ai-provider";
import { getOpenAiServerConfig } from "@/features/ai/config/openai-config";
import { getAiModelRoute, getPromptCacheKey } from "@/features/ai/config/ai-model-routing";
import { getMailAiTokenBudget } from "@/features/ai/config/ai-token-budget";
import {
  MAIL_ANALYSIS_PROMPT,
  MAIL_ANALYSIS_PROMPT_VERSION,
  MAIL_REPLY_PROMPT,
  MAIL_REPLY_PROMPT_VERSION,
  MAIL_REWRITE_PROMPT,
  MAIL_REWRITE_PROMPT_VERSION,
} from "@/features/ai/prompts/mail-ai-prompts";
import { AiServiceError, type AiOperationType, type AiUsageMetadata } from "@/features/ai/types/ai";
import type { MailAiAnalysis, MailAiAnalysisInput, MailAiReply, MailAiReplyInput, MailAiRewriteInput } from "@/features/ai/types/mail-ai";
import { createMailAnalysisJsonSchema, MAIL_REPLY_JSON_SCHEMA, validateMailAiAnalysis, validateMailAiReply } from "@/features/ai/validation/mail-ai-schema";

export class OpenAiProvider implements AiProvider {
  readonly type = "openai" as const;
  readonly model = getOpenAiServerConfig().model;
  private readonly client: OpenAI;

  constructor() {
    const config = getOpenAiServerConfig();
    this.client = new OpenAI({ apiKey: config.apiKey, timeout: config.timeoutMs, maxRetries: 0 });
  }

  async analyzeMail(input: MailAiAnalysisInput): Promise<MailAiAnalysis> {
    const operation = "mail_analysis" as const;
    try {
      const { response, model } = await this.createStructuredResponse(operation, {
        instructions: MAIL_ANALYSIS_PROMPT,
        input: JSON.stringify(buildAnalysisPayload(input)),
        name: "mail_ai_analysis",
        schema: createMailAnalysisJsonSchema(input.configuration),
      }, input.configuration.maximumAnalysisOutputTokens);
      const value = parseOutput(response.output_text);
      const result = validateMailAiAnalysis(value, input.configuration, {
        sourceReferences: buildSourceReferences(input), generatedAt: new Date().toISOString(),
        provider: this.type, model, promptVersion: MAIL_ANALYSIS_PROMPT_VERSION,
        usage: usageFrom(response), cached: false,
      });
      if (!result) throw invalidOutput();
      return result;
    } catch (error) {
      throw mapOpenAiError(error);
    }
  }

  async proposeMailReply(input: MailAiReplyInput): Promise<MailAiReply> {
    return this.createReply("mail_reply", MAIL_REPLY_PROMPT, MAIL_REPLY_PROMPT_VERSION, buildReplyPayload(input), input.configuration.maximumReplyOutputTokens);
  }

  async rewriteMailReply(input: MailAiRewriteInput): Promise<MailAiReply> {
    return this.createReply("mail_rewrite", MAIL_REWRITE_PROMPT, MAIL_REWRITE_PROMPT_VERSION, buildRewritePayload(input), input.configuration.maximumRewriteOutputTokens);
  }

  private async createReply(
    operation: "mail_reply" | "mail_rewrite",
    instructions: string,
    promptVersion: string,
    payload: unknown,
    requestedOutputTokens: number,
  ) {
    try {
      const { response, model } = await this.createStructuredResponse(operation, {
        instructions,
        input: JSON.stringify(payload),
        name: operation,
        schema: MAIL_REPLY_JSON_SCHEMA,
      }, requestedOutputTokens);
      const result = validateMailAiReply(parseOutput(response.output_text), {
        generatedAt: new Date().toISOString(), provider: this.type, model,
        promptVersion, usage: usageFrom(response),
      });
      if (!result || !result.recipients.length) throw invalidOutput();
      return result;
    } catch (error) {
      throw mapOpenAiError(error);
    }
  }

  private async createStructuredResponse(operation: AiOperationType, request: {
    instructions: string;
    input: string;
    name: string;
    schema: Record<string, unknown>;
  }, requestedOutputTokens: number) {
    const route = getAiModelRoute(operation);
    const budget = getMailAiTokenBudget(operation, { maximumOutputTokens: requestedOutputTokens });
    const response = await this.client.responses.create({
      model: route.model,
      instructions: request.instructions,
      input: request.input,
      max_output_tokens: budget.maximumOutputTokens,
      prompt_cache_key: getPromptCacheKey(operation),
      store: false,
      text: { format: { type: "json_schema", name: request.name, schema: request.schema, strict: true } },
    });
    return { response, model: route.model };
  }
}

function buildAnalysisPayload(input: MailAiAnalysisInput) {
  return {
    language: input.configuration.preferredLanguage,
    allowedCategories: input.configuration.categories,
    allowedPriorities: input.configuration.priorities,
    selectedMessage: input.message,
    recentThreadContext: input.thread,
  };
}

function buildReplyPayload(input: MailAiReplyInput) {
  return {
    language: input.configuration.preferredLanguage,
    tone: input.tone,
    length: input.length,
    intent: input.intent,
    userInstruction: input.instructions,
    signature: input.configuration.includeSignature ? input.configuration.signature : "",
    selectedMessage: input.message,
    recentThreadContext: input.thread,
  };
}

function buildRewritePayload(input: MailAiRewriteInput) {
  return {
    language: input.configuration.preferredLanguage,
    tone: input.tone,
    command: input.command,
    userInstruction: input.instructions,
    currentDraft: input.currentReply,
    selectedMessage: {
      subject: input.message.subject,
      sender: input.message.sender,
      bodyText: input.message.bodyText,
    },
  };
}

function buildSourceReferences(input: MailAiAnalysisInput) {
  return [
    { type: "message" as const, id: input.message.id, label: "Message sélectionné" },
    ...input.thread.map((message) => ({ type: "thread" as const, id: message.id, label: "Contexte récent du fil" })),
    ...input.message.attachmentMetadata.map((attachment, index) => ({ type: "attachment_metadata" as const, id: `${input.message.id}:${index}`, label: attachment.filename })),
  ];
}

function parseOutput(output: string): unknown {
  if (!output.trim()) throw invalidOutput();
  try { return JSON.parse(output) as unknown; } catch { throw invalidOutput(); }
}

function usageFrom(response: { usage?: {
  input_tokens?: number;
  input_tokens_details?: { cached_tokens?: number };
  output_tokens?: number;
  total_tokens?: number;
} | null }): AiUsageMetadata {
  return {
    inputTokens: response.usage?.input_tokens ?? null,
    cachedInputTokens: response.usage?.input_tokens_details?.cached_tokens ?? null,
    outputTokens: response.usage?.output_tokens ?? null,
    totalTokens: response.usage?.total_tokens ?? null,
  };
}

function invalidOutput() {
  return new AiServiceError({ code: "invalid_output", message: "La réponse IA reçue est incomplète ou invalide. Vous pouvez réessayer.", recoverable: true, status: 502 });
}

function mapOpenAiError(error: unknown): AiServiceError {
  if (error instanceof AiServiceError) return error;
  if (error instanceof OpenAI.AuthenticationError) return new AiServiceError({ code: "authentication", message: "La clé OpenAI est invalide. Vérifiez la configuration serveur.", recoverable: false, status: 503 });
  if (error instanceof OpenAI.RateLimitError) return new AiServiceError({ code: "rate_limit", message: "La limite de requêtes OpenAI est atteinte. Réessayez plus tard.", recoverable: true, status: 429 });
  if (error instanceof OpenAI.APIConnectionTimeoutError) return new AiServiceError({ code: "timeout", message: "OpenAI n’a pas répondu dans le délai prévu. Réessayez.", recoverable: true, status: 504 });
  if (error instanceof OpenAI.PermissionDeniedError) return new AiServiceError({ code: "quota", message: "L’accès OpenAI est indisponible pour ce projet. Vérifiez les droits et la facturation.", recoverable: false, status: 503 });
  if (error instanceof OpenAI.NotFoundError || error instanceof OpenAI.BadRequestError) return new AiServiceError({ code: "model_unavailable", message: "Le modèle OpenAI configuré n’est pas disponible ou ne prend pas en charge cette opération.", recoverable: false, status: 503 });
  return new AiServiceError({ code: "provider_unavailable", message: "Le service OpenAI est temporairement indisponible. Réessayez plus tard.", recoverable: true, status: 502 });
}
