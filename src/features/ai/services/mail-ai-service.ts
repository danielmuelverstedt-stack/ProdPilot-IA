import "server-only";

import { createHash, randomUUID } from "node:crypto";
import { getAiModelRoute } from "@/features/ai/config/ai-model-routing";
import { estimateTokens, getMailAiTokenBudget } from "@/features/ai/config/ai-token-budget";
import { MAIL_ANALYSIS_PROMPT_VERSION } from "@/features/ai/prompts/mail-ai-prompts";
import { aiRequestCoordinator } from "@/features/ai/server/ai-request-coordinator";
import { aiAnalysisCacheRepository } from "@/features/ai/server/repositories/local-ai-analysis-cache-repository";
import { aiUsageRepository } from "@/features/ai/server/repositories/local-ai-usage-repository";
import { enforceAiUsageLimit } from "@/features/ai/server/ai-usage-guard";
import { getCurrentMailOwnerContext } from "@/features/mail/server/accounts/mail-owner-context";
import { getActiveMailContext } from "@/features/mail/services/mail-account-context";
import { resolveAiProvider } from "@/features/ai/services/ai-provider-factory";
import { reduceMailContext, type ReducedMailContext } from "@/features/ai/services/mail-context-reducer";
import { AiServiceError, type AiError, type AiOperationType, type AiUsageRecord } from "@/features/ai/types/ai";
import type {
  MailAiAnalysis,
  MailAiConfiguration,
  MailAiMessageContext,
  MailAiReply,
  MailAiReplyLength,
  MailAiReplyTone,
  MailAiRewriteCommand,
} from "@/features/ai/types/mail-ai";
import type { MailMessage } from "@/features/mail/types/mail";

export interface MailAiOperationResult<T> {
  result: T;
  mode: "openai" | "deterministic";
  configurationMessage?: string;
  context: ReducedMailContext["transferSummary"] & { wasTruncated: boolean; notes: string[]; estimatedInputTokens: number };
}

export async function analyzeActiveMail(input: {
  messageId: string;
  configuration: MailAiConfiguration;
  forceRefresh: boolean;
  longContextConfirmed: boolean;
}): Promise<MailAiOperationResult<MailAiAnalysis>> {
  const prepared = await prepareOperation("mail_analysis", input.messageId, input.configuration);
  const { provider, status } = await resolveAiProvider();
  ensurePrivacy(provider.type, input.configuration.privacyAcknowledged);
  if (provider.type === "openai" && prepared.reduced.estimatedInputTokens > input.configuration.longThreadWarningThreshold && !input.longContextConfirmed) {
    throw serviceError("confirmation_required", "Ce fil est volumineux et peut augmenter le coût. Confirmez explicitement l’analyse du contexte réduit.", 428);
  }
  const model = provider.type === "openai" ? getAiModelRoute("mail_analysis").model : provider.model;
  const cacheKey = createCacheKey(prepared, provider.type, model, MAIL_ANALYSIS_PROMPT_VERSION, input.configuration);
  if (!input.forceRefresh && input.configuration.allowCachedResults) {
    const cached = await aiAnalysisCacheRepository.get(cacheKey);
    if (cached) {
      await recordUsage(
        prepared,
        "mail_analysis",
        provider.type,
        model,
        hash(`${prepared.account.id}:${prepared.message.id}`),
        null,
        0,
        true,
        null,
        "hit",
      );
      return operationResult({ ...cached.analysis, cached: true }, provider.type, status, prepared.reduced);
    }
  }
  const analysis = await executePaidAware(prepared, provider.type, model, "mail_analysis", cacheKey, () => provider.analyzeMail(prepared.providerInput));
  if (prepared.reduced.wasTruncated) {
    analysis.missingInformation = [...analysis.missingInformation, "L’analyse utilise un contexte réduit ; certains échanges anciens peuvent être absents."];
  }
  if (input.configuration.allowCachedResults) {
    await aiAnalysisCacheRepository.set({ key: cacheKey, analysis, expiresAt: new Date(Date.now() + input.configuration.analysisExpirationMinutes * 60_000).toISOString() });
  }
  return operationResult(analysis, provider.type, status, prepared.reduced);
}

export async function proposeActiveMailReply(input: {
  messageId: string;
  configuration: MailAiConfiguration;
  instructions: string;
  intent: "reply" | "reply_all";
  tone: MailAiReplyTone;
  length: MailAiReplyLength;
}): Promise<MailAiOperationResult<MailAiReply>> {
  const prepared = await prepareOperation("mail_reply", input.messageId, input.configuration);
  const { provider, status } = await resolveAiProvider();
  ensurePrivacy(provider.type, input.configuration.privacyAcknowledged);
  const key = hash(JSON.stringify({ accountId: prepared.account.id, messageId: input.messageId, operation: "mail_reply", instructions: input.instructions, tone: input.tone, length: input.length }));
  const result = await executePaidAware(prepared, provider.type, provider.type === "openai" ? getAiModelRoute("mail_reply").model : provider.model, "mail_reply", key, () => provider.proposeMailReply({ ...prepared.providerInput, instructions: input.instructions, intent: input.intent, tone: input.tone, length: input.length }));
  return operationResult(result, provider.type, status, prepared.reduced);
}

export async function rewriteActiveMailReply(input: {
  messageId: string;
  configuration: MailAiConfiguration;
  currentReply: MailAiReply;
  command: MailAiRewriteCommand;
  instructions: string;
  tone: MailAiReplyTone;
  length: MailAiReplyLength;
}): Promise<MailAiOperationResult<MailAiReply>> {
  const prepared = await prepareOperation("mail_rewrite", input.messageId, input.configuration);
  const rewriteBudget = getMailAiTokenBudget("mail_rewrite", { maximumInputTokens: input.configuration.maximumInputContextTokens });
  if (estimateTokens(JSON.stringify({ currentDraft: input.currentReply.bodyText, message: prepared.reduced.message, instruction: input.instructions })) > rewriteBudget.maximumInputTokens) {
    throw serviceError("invalid_input", "Le brouillon est trop volumineux pour une réécriture sûre. Réduisez-le manuellement avant de relancer l’IA.", 400);
  }
  const { provider, status } = await resolveAiProvider();
  ensurePrivacy(provider.type, input.configuration.privacyAcknowledged);
  const key = hash(JSON.stringify({ accountId: prepared.account.id, messageId: input.messageId, operation: "mail_rewrite", current: input.currentReply.bodyText, command: input.command, instructions: input.instructions }));
  const result = await executePaidAware(prepared, provider.type, provider.type === "openai" ? getAiModelRoute("mail_rewrite").model : provider.model, "mail_rewrite", key, () => provider.rewriteMailReply({ ...prepared.providerInput, currentReply: input.currentReply, command: input.command, instructions: input.instructions, intent: "reply", tone: input.tone, length: input.length }));
  return operationResult(result, provider.type, status, prepared.reduced);
}

export async function getAiUsageSummary() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const entries = await aiUsageRepository.listSince(start.toISOString());
  const successful = entries.filter((entry) => entry.success);
  const providerCalls = successful.filter((entry) => entry.provider === "openai" && entry.cacheStatus !== "hit");
  const localHits = successful.filter((entry) => entry.cacheStatus === "hit").length;
  const cacheDenominator = providerCalls.length + localHits;
  return {
    requestsToday: providerCalls.length,
    inputTokens: sum(providerCalls, "inputTokens"),
    cachedInputTokens: sum(providerCalls, "cachedInputTokens"),
    outputTokens: sum(providerCalls, "outputTokens"),
    totalTokens: sum(providerCalls, "totalTokens"),
    localCacheHits: localHits,
    cacheHitPercentage: cacheDenominator ? Math.round((localHits / cacheDenominator) * 100) : 0,
    errors: entries.filter((entry) => !entry.success).length,
    lastSuccessfulCallAt: providerCalls.at(-1)?.createdAt ?? null,
    lastSafeErrorCategory: entries.filter((entry) => !entry.success).at(-1)?.errorCode ?? null,
  };
}

async function prepareOperation(operation: AiOperationType, messageId: string, configuration: MailAiConfiguration) {
  const { account, provider } = await getActiveMailContext();
  if (account.status !== "connected") throw serviceError("message_unavailable", "Le compte de messagerie actif n’est pas connecté.", 409);
  const message = await provider.getMessage(messageId);
  if (!message || message.accountId !== account.id) throw serviceError("message_unavailable", "Le message demandé est indisponible pour le compte actif.", 404);
  let threadMessages: MailMessage[] = [];
  if (operation !== "mail_rewrite") {
    const thread = await provider.getThread(message.threadId);
    if (thread?.accountId === account.id) threadMessages = thread.messages;
  }
  const configuredBudget = getMailAiTokenBudget(operation, {
    maximumInputTokens: configuration.maximumInputContextTokens,
    maximumOutputTokens: operation === "mail_analysis" ? configuration.maximumAnalysisOutputTokens : operation === "mail_reply" ? configuration.maximumReplyOutputTokens : configuration.maximumRewriteOutputTokens,
  });
  const budget = {
    ...configuredBudget,
    maximumThreadMessages: Math.min(configuredBudget.maximumThreadMessages, configuration.maximumThreadMessages),
  };
  const selected = toAiMessage(message);
  const reduced = reduceMailContext({ operation, selected, thread: threadMessages.map(toAiMessage), budget, includeAttachmentMetadata: configuration.includeAttachmentMetadata });
  const owner = getCurrentMailOwnerContext();
  return {
    account, owner, message,
    reduced,
    providerInput: {
      context: { accountId: account.id, mailProvider: account.provider, accountEmail: account.emailAddress, preferredLanguage: configuration.preferredLanguage, organizationId: account.organizationId },
      message: reduced.message, thread: reduced.thread, configuration,
    },
  };
}

async function executePaidAware<T extends MailAiAnalysis | MailAiReply>(
  prepared: Awaited<ReturnType<typeof prepareOperation>>,
  providerType: "openai" | "mock",
  model: string,
  operation: AiOperationType,
  requestKey: string,
  execute: () => Promise<T>,
): Promise<T> {
  const safeReference = hash(`${prepared.account.id}:${prepared.message.id}`);
  if (providerType === "openai") await enforceAiUsageLimit({ ...prepared.owner, messageReference: safeReference, operation, requestedDailyLimit: prepared.providerInput.configuration.dailyHardLimit });
  return aiRequestCoordinator.run(`${prepared.account.id}:${requestKey}`, async () => {
    const startedAt = Date.now();
    try {
      const result = await execute();
      const currentContext = await getActiveMailContext();
      if (currentContext.account.id !== prepared.account.id) {
        throw serviceError("account_changed", "Le compte actif a changé pendant l’opération. Le résultat a été écarté pour éviter tout mélange de comptes.", 409);
      }
      await recordUsage(prepared, operation, providerType, model, safeReference, result.usage, Date.now() - startedAt, true, null, "miss");
      return result;
    } catch (error) {
      const detail = error instanceof AiServiceError ? error.detail : serviceError("provider_unavailable", "Le service IA est indisponible.", 502).detail;
      await recordUsage(prepared, operation, providerType, model, safeReference, null, Date.now() - startedAt, false, detail.code, "miss");
      throw error;
    }
  });
}

async function recordUsage(prepared: Awaited<ReturnType<typeof prepareOperation>>, operation: AiOperationType, provider: "openai" | "mock", model: string, messageReference: string, usage: MailAiAnalysis["usage"], durationMs: number, success: boolean, errorCode: AiError["code"] | null, cacheStatus: AiUsageRecord["cacheStatus"]) {
  await aiUsageRepository.record({ id: randomUUID(), operation, provider, model, accountId: prepared.account.id, companyId: prepared.owner.companyId, userId: prepared.owner.userId, messageReference, inputTokens: usage?.inputTokens ?? null, cachedInputTokens: usage?.cachedInputTokens ?? null, outputTokens: usage?.outputTokens ?? null, totalTokens: usage?.totalTokens ?? null, durationMs, cacheStatus, success, errorCode, createdAt: new Date().toISOString() });
}

function operationResult<T>(result: T, provider: "openai" | "mock", status: Awaited<ReturnType<typeof resolveAiProvider>>["status"], reduced: ReducedMailContext): MailAiOperationResult<T> {
  return { result, mode: provider === "openai" ? "openai" : "deterministic", configurationMessage: status.configured ? undefined : status.message, context: { ...reduced.transferSummary, wasTruncated: reduced.wasTruncated, notes: reduced.reductionNotes, estimatedInputTokens: reduced.estimatedInputTokens } };
}

function toAiMessage(message: MailMessage): MailAiMessageContext {
  return { id: message.id, threadId: message.threadId, subject: message.subject, sender: formatAddress(message.from), recipients: [...message.to, ...message.cc].map(formatAddress), receivedAt: message.receivedAt, bodyText: message.bodyText, attachmentMetadata: message.attachments.map(({ filename, mimeType, sizeBytes }) => ({ filename, mimeType, sizeBytes })) };
}

function formatAddress(address: { name?: string; email: string }) { return address.name ? `${address.name} <${address.email}>` : address.email; }
function ensurePrivacy(provider: "openai" | "mock", acknowledged: boolean) { if (provider === "openai" && !acknowledged) throw serviceError("privacy_acknowledgment_required", "Confirmez d’abord que le contenu du message sélectionné peut être transmis au fournisseur IA configuré.", 428); }
function serviceError(code: AiError["code"], message: string, status: number) { return new AiServiceError({ code, message, recoverable: status >= 429, status }); }
function hash(value: string) { return createHash("sha256").update(value).digest("hex"); }
function createCacheKey(prepared: Awaited<ReturnType<typeof prepareOperation>>, provider: string, model: string, promptVersion: string, configuration: MailAiConfiguration) { return hash(JSON.stringify({ companyId: prepared.owner.companyId, userId: prepared.owner.userId, accountId: prepared.account.id, messageId: prepared.message.id, content: prepared.reduced, provider, model, promptVersion, configuration })); }
function sum(entries: AiUsageRecord[], key: "inputTokens" | "cachedInputTokens" | "outputTokens" | "totalTokens") { return entries.reduce((total, entry) => total + (entry[key] ?? 0), 0); }
