import "server-only";

import { createHash } from "node:crypto";
import { getAiModelRoute } from "@/features/ai/config/ai-model-routing";
import { getMailAiTokenBudget } from "@/features/ai/config/ai-token-budget";
import { aiRequestCoordinator } from "@/features/ai/server/ai-request-coordinator";
import { enforceAiUsageLimit } from "@/features/ai/server/ai-usage-guard";
import { resolveAiProvider } from "@/features/ai/services/ai-provider-factory";
import { recordSafeAiUsage } from "@/features/ai/services/ai-usage-recorder";
import { AiServiceError } from "@/features/ai/types/ai";
import type { MailAiConfiguration } from "@/features/ai/types/mail-ai";
import type { MailAssistantSession } from "@/features/mail-assistant/types/mail-assistant";
import { getCurrentMailOwnerContext } from "@/features/mail/server/accounts/mail-owner-context";
import { getActiveMailContext } from "@/features/mail/services/mail-account-context";

export async function continueMailAssistantConversation(input: {
  session: MailAssistantSession;
  text: string;
  messageIds: string[];
  configuration: MailAiConfiguration;
  signal?: AbortSignal;
}): Promise<string> {
  const { provider, status } = await resolveAiProvider();
  if (provider.type === "openai" && !input.configuration.privacyAcknowledged) {
    throw new AiServiceError({ code: "privacy_acknowledgment_required", message: "Confirmez d’abord dans Réglages → IA que le contexte Mail peut être transmis au fournisseur IA.", recoverable: false, status: 428 });
  }
  const model = provider.type === "openai" ? getAiModelRoute("mail_conversation").model : provider.model;
  const owner = getCurrentMailOwnerContext();
  const budget = getMailAiTokenBudget("mail_conversation", { maximumInputTokens: input.configuration.maximumInputContextTokens, maximumOutputTokens: input.configuration.maximumReplyOutputTokens });
  const reference = hash(`${input.session.account.id}:${input.session.id}`);
  if (provider.type === "openai") {
    await enforceAiUsageLimit({ ...owner, messageReference: reference, operation: "mail_conversation", model, budgetPolicy: input.configuration.budgetPolicy, pricingRegistry: input.configuration.pricingRegistry, projectedUsage: { inputTokens: budget.maximumInputTokens, cachedInputTokens: 0, outputTokens: budget.maximumOutputTokens, totalTokens: budget.maximumInputTokens + budget.maximumOutputTokens } });
  }
  const history = input.session.conversation.slice(-10).map((entry) => ({ role: entry.role, content: entry.text.slice(0, 2_000) }));
  const mailContext = buildMailContext(input.session, input.messageIds, input.text);
  const startedAt = Date.now();
  try {
    const result = await aiRequestCoordinator.run(`${input.session.account.id}:conversation:${hash(JSON.stringify(history))}`, () => provider.continueMailConversation({ history, mailContext, configuration: input.configuration }, input.signal));
    const active = await getActiveMailContext();
    if (active.account.id !== input.session.account.id) throw new AiServiceError({ code: "account_changed", message: "Le compte actif a changé pendant la conversation. La réponse a été écartée.", recoverable: false, status: 409 });
    await recordSafeAiUsage({ operation: "mail_conversation", provider: provider.type, model, accountId: input.session.account.id, companyId: owner.companyId, userId: owner.userId, messageReference: reference, usage: result.usage, durationMs: Date.now() - startedAt, providerRequestAttempted: provider.type === "openai", cacheStatus: "not_applicable", success: true, errorCode: null, budgetPolicy: input.configuration.budgetPolicy, pricingRegistry: input.configuration.pricingRegistry });
    return status.configured ? result.text : `${result.text} ${status.message}`;
  } catch (error) {
    const detail = error instanceof AiServiceError ? error.detail : { code: "provider_unavailable" as const, message: "Le service IA est indisponible.", recoverable: true, status: 502 };
    await recordSafeAiUsage({ operation: "mail_conversation", provider: provider.type, model, accountId: input.session.account.id, companyId: owner.companyId, userId: owner.userId, messageReference: reference, usage: null, durationMs: Date.now() - startedAt, providerRequestAttempted: provider.type === "openai", cacheStatus: "not_applicable", success: false, errorCode: detail.code, budgetPolicy: input.configuration.budgetPolicy, pricingRegistry: input.configuration.pricingRegistry }).catch(() => undefined);
    throw error;
  }
}

function buildMailContext(session: MailAssistantSession, messageIds: string[], text: string): string {
  const selected = session.messages.filter((message) => messageIds.includes(message.id)).slice(0, 2);
  if (selected.length) return selected.map((message) => [
    `Message n° ${message.sessionNumber}`,
    `Objet : ${message.subject}`,
    `Expéditeur : ${message.from.name ?? message.from.email}`,
    `Reçu : ${message.receivedAt}`,
    `Contenu : ${message.bodyText.slice(0, 4_000)}`,
  ].join("\n")).join("\n\n");
  if (/urgent|important|nouveau|résum|liste|priorit/i.test(text)) {
    return session.messages.slice(0, 10).map((message) => `n° ${message.sessionNumber} · ${message.subject} · ${message.from.name ?? message.from.email} · priorité ${message.priority} · ${message.summary.slice(0, 300)}`).join("\n");
  }
  const urgent = session.messages.filter((message) => message.classification.isUrgent).length;
  const replies = session.messages.filter((message) => message.classification.requiresReply).length;
  return `${session.messages.length} messages dans la session, ${urgent} urgents, ${replies} réponses recommandées. Aucun contenu de mail n’est fourni pour cette question générale.`;
}

function hash(value: string) { return createHash("sha256").update(value).digest("hex"); }
