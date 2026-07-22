import { getMailAiTokenBudget } from "@/features/ai/config/ai-token-budget";
import { parseAiBudgetPolicy, parseAiPricingRegistry } from "@/features/ai/validation/ai-budget-input";
import type { MailAiComposeTemplate, MailAiConfiguration, MailAiProductionContext, MailAiReply, MailAiReplyLength, MailAiReplyTone, MailAiRewriteCommand } from "@/features/ai/types/mail-ai";

const TONES: MailAiReplyTone[] = ["professional", "concise", "diplomatic", "direct", "technical", "internal", "customer", "supplier"];
const LENGTHS: MailAiReplyLength[] = ["short", "medium", "long"];
const COMMANDS: MailAiRewriteCommand[] = ["shorter", "more_diplomatic", "more_direct", "more_professional", "more_technical", "simplify", "translate", "custom"];

export function parseMailAiBaseRequest(value: unknown): { messageId: string; configuration: MailAiConfiguration } | null {
  if (!isRecord(value) || !isGmailId(value.messageId)) return null;
  const configuration = parseMailAiConfiguration(value.configuration);
  return configuration ? { messageId: value.messageId, configuration } : null;
}

export function parseMailAiReplyRequest(value: unknown) {
  const base = parseMailAiBaseRequest(value);
  if (!base || !isRecord(value)) return null;
  const maximum = getMailAiTokenBudget("mail_reply").maximumCustomInstructionLength;
  if (!isString(value.instructions, maximum) || (value.intent !== "reply" && value.intent !== "reply_all") || !TONES.includes(value.tone as MailAiReplyTone) || !LENGTHS.includes(value.length as MailAiReplyLength)) return null;
  return { ...base, instructions: value.instructions, intent: value.intent as "reply" | "reply_all", tone: value.tone as MailAiReplyTone, length: value.length as MailAiReplyLength };
}

export function parseMailAiRewriteRequest(value: unknown) {
  const base = parseMailAiBaseRequest(value);
  if (!base || !isRecord(value)) return null;
  const maximum = getMailAiTokenBudget("mail_rewrite").maximumCustomInstructionLength;
  const currentReply = parseCurrentReply(value.currentReply);
  if (!currentReply || !isString(value.instructions, maximum) || !COMMANDS.includes(value.command as MailAiRewriteCommand) || !TONES.includes(value.tone as MailAiReplyTone) || !LENGTHS.includes(value.length as MailAiReplyLength)) return null;
  return { ...base, currentReply, instructions: value.instructions, command: value.command as MailAiRewriteCommand, tone: value.tone as MailAiReplyTone, length: value.length as MailAiReplyLength };
}

export function parseMailAiComposeRequest(value: unknown) {
  if (!isRecord(value)) return null;
  const configuration = parseMailAiConfiguration(value.configuration);
  if (!configuration) return null;
  const maximum = getMailAiTokenBudget("mail_compose").maximumCustomInstructionLength;
  if (!isString(value.instruction, maximum, true)) return null;
  if (!isString(value.recipientEmail, 320, true) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.recipientEmail) || /[\r\n]/.test(value.recipientEmail)) return null;
  if (value.tone !== undefined && !TONES.includes(value.tone as MailAiReplyTone)) return null;
  if (value.length !== undefined && !LENGTHS.includes(value.length as MailAiReplyLength)) return null;
  const productionContext = parseProductionContext(value.productionContext);
  if (productionContext === undefined) return null;
  const template = parseComposeTemplate(value.template);
  if (template === undefined) return null;
  return {
    configuration,
    instruction: value.instruction,
    recipientEmail: value.recipientEmail.toLowerCase(),
    productionContext,
    template,
    tone: (value.tone as MailAiReplyTone) ?? configuration.defaultTone,
    length: (value.length as MailAiReplyLength) ?? configuration.defaultLength,
  };
}

export function parseProductionContext(value: unknown): MailAiProductionContext | null | undefined {
  if (value === null || value === undefined) return null;
  if (!isRecord(value)) return undefined;
  const fields = ["workOrderId", "customer", "article", "dueDate", "status", "project"] as const;
  const result = {} as Record<(typeof fields)[number], string | null>;
  for (const field of fields) {
    const raw = value[field];
    if (raw !== null && typeof raw !== "string") return undefined;
    result[field] = typeof raw === "string" ? raw.slice(0, 200) : null;
  }
  return result;
}

export function parseComposeTemplate(value: unknown): MailAiComposeTemplate | null | undefined {
  if (value === null || value === undefined) return null;
  if (!isRecord(value) || !isString(value.name, 160, true) || !isString(value.subject, 998, true) || !isString(value.body, 5_000, true)) return undefined;
  return { name: value.name, subject: value.subject, body: value.body };
}

export function parseMailAiConfiguration(value: unknown): MailAiConfiguration | null {
  if (!isRecord(value) || !Array.isArray(value.categories) || !Array.isArray(value.priorities)) return null;
  const categories = value.categories.filter(isRecord).map((item) => ({ id: item.id, label: item.label }));
  const priorities = value.priorities.filter(isRecord).map((item) => ({ id: item.id, label: item.label, level: item.level }));
  if (!categories.length || categories.length > 20 || !categories.every((item) => isString(item.id, 120, true) && isString(item.label, 160, true))) return null;
  if (!priorities.length || priorities.length > 10 || !priorities.every((item) => isString(item.id, 120, true) && isString(item.label, 160, true) && ["low", "normal", "high", "urgent"].includes(String(item.level)))) return null;
  if (!isString(value.preferredLanguage, 20, true) || !TONES.includes(value.defaultTone as MailAiReplyTone) || !LENGTHS.includes(value.defaultLength as MailAiReplyLength)) return null;
  if (typeof value.includeSignature !== "boolean" || !isString(value.signature, 5_000) || !Number.isInteger(value.maximumThreadMessages) || Number(value.maximumThreadMessages) < 1 || Number(value.maximumThreadMessages) > 20) return null;
  if (![value.maximumInputContextTokens, value.maximumAnalysisOutputTokens, value.maximumReplyOutputTokens, value.maximumRewriteOutputTokens, value.longThreadWarningThreshold].every((item) => Number.isInteger(item) && Number(item) > 0 && Number(item) <= 100_000)) return null;
  const budgetPolicy = parseAiBudgetPolicy(value.budgetPolicy);
  const pricingRegistry = parseAiPricingRegistry(value.pricingRegistry);
  if (!budgetPolicy || !pricingRegistry) return null;
  if (typeof value.includeAttachmentMetadata !== "boolean" || typeof value.privacyAcknowledged !== "boolean" || typeof value.allowDraftCreation !== "boolean" || typeof value.allowCachedResults !== "boolean" || !Number.isInteger(value.analysisExpirationMinutes) || Number(value.analysisExpirationMinutes) < 5 || Number(value.analysisExpirationMinutes) > 43_200) return null;
  return { categories: categories as MailAiConfiguration["categories"], priorities: priorities as MailAiConfiguration["priorities"], preferredLanguage: value.preferredLanguage, defaultTone: value.defaultTone as MailAiReplyTone, defaultLength: value.defaultLength as MailAiReplyLength, includeSignature: value.includeSignature, signature: value.signature, maximumThreadMessages: value.maximumThreadMessages as number, maximumInputContextTokens: value.maximumInputContextTokens as number, maximumAnalysisOutputTokens: value.maximumAnalysisOutputTokens as number, maximumReplyOutputTokens: value.maximumReplyOutputTokens as number, maximumRewriteOutputTokens: value.maximumRewriteOutputTokens as number, longThreadWarningThreshold: value.longThreadWarningThreshold as number, budgetPolicy, pricingRegistry, includeAttachmentMetadata: value.includeAttachmentMetadata, privacyAcknowledged: value.privacyAcknowledged, allowDraftCreation: value.allowDraftCreation, allowCachedResults: value.allowCachedResults, analysisExpirationMinutes: value.analysisExpirationMinutes as number };
}

function parseCurrentReply(value: unknown): MailAiReply | null {
  if (!isRecord(value) || !Array.isArray(value.recipients) || !Array.isArray(value.cc) || !Array.isArray(value.bcc)) return null;
  if (![...value.recipients, ...value.cc, ...value.bcc].every((item) => typeof item === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item)) || !value.recipients.length) return null;
  if (!isString(value.subject, 998, true) || /[\r\n]/.test(value.subject) || !isString(value.bodyText, 50_000, true) || !TONES.includes(value.tone as MailAiReplyTone) || !isString(value.language, 40, true)) return null;
  if (!isString(value.generatedAt, 100, true) || (value.provider !== "openai" && value.provider !== "mock") || !isString(value.model, 200, true) || !isString(value.promptVersion, 100, true)) return null;
  return value as unknown as MailAiReply;
}

function isGmailId(value: unknown): value is string { return typeof value === "string" && /^[A-Za-z0-9_-]{1,200}$/.test(value); }
function isString(value: unknown, maximum: number, required = false): value is string { return typeof value === "string" && value.length <= maximum && (!required || value.trim().length > 0); }
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
