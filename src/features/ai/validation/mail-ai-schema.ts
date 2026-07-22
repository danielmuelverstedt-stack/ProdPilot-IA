import type { AiUsageMetadata } from "@/features/ai/types/ai";
import type {
  MailAiAnalysis,
  MailAiCompose,
  MailAiConfiguration,
  MailAiReply,
  MailAiReplyTone,
} from "@/features/ai/types/mail-ai";

export const MAIL_AI_ENTITY_TYPES = [
  "customer",
  "supplier",
  "work_order",
  "purchase_order",
  "article_reference",
  "machine",
  "project",
  "delivery_date",
  "requested_deadline",
  "responsible_person",
  "maintenance_issue",
  "quality_issue",
  "planning_request",
] as const;

const REPLY_TONES: MailAiReplyTone[] = [
  "professional", "concise", "diplomatic", "direct", "technical", "internal", "customer", "supplier",
];

export function createMailAnalysisJsonSchema(configuration: MailAiConfiguration) {
  return objectSchema({
    summary: objectSchema({ text: stringSchema(1, 800) }, ["text"]),
    category: objectSchema({
      id: { type: "string", enum: configuration.categories.map((item) => item.id) },
      label: { type: "string", enum: configuration.categories.map((item) => item.label) },
    }, ["id", "label"]),
    priority: objectSchema({
      id: { type: "string", enum: configuration.priorities.map((item) => item.id) },
      label: { type: "string", enum: configuration.priorities.map((item) => item.label) },
      level: { type: "string", enum: ["low", "normal", "high", "urgent"] },
    }, ["id", "label", "level"]),
    requiresReply: { type: "boolean" },
    reasoning: stringSchema(1, 400),
    detectedEntities: arraySchema(objectSchema({
      type: { type: "string", enum: [...MAIL_AI_ENTITY_TYPES] },
      label: stringSchema(1, 120),
      value: stringSchema(1, 500),
      sourceText: stringSchema(1, 500),
    }, ["type", "label", "value", "sourceText"]), 20),
    importantDates: arraySchema(objectSchema({
      label: stringSchema(1, 120),
      value: stringSchema(1, 120),
      sourceText: stringSchema(1, 500),
    }, ["label", "value", "sourceText"]), 10),
    suggestedActions: arraySchema(objectSchema({
      id: stringSchema(1, 120),
      label: stringSchema(1, 160),
      description: stringSchema(1, 1_000),
      requiresConfirmation: { type: "boolean" },
    }, ["id", "label", "description", "requiresConfirmation"]), 8),
    missingInformation: arraySchema(stringSchema(1, 500), 10),
    confidence: { type: "string", enum: ["low", "medium", "high"] },
  }, [
    "summary", "category", "priority", "requiresReply", "reasoning", "detectedEntities",
    "importantDates", "suggestedActions", "missingInformation", "confidence",
  ]);
}

export const MAIL_REPLY_JSON_SCHEMA = objectSchema({
  recipients: arraySchema(stringSchema(3, 320), 20),
  cc: arraySchema(stringSchema(3, 320), 20),
  bcc: arraySchema(stringSchema(3, 320), 20),
  subject: stringSchema(1, 998),
  bodyText: stringSchema(1, 12_000),
  tone: { type: "string", enum: REPLY_TONES },
  language: stringSchema(2, 40),
}, ["recipients", "cc", "bcc", "subject", "bodyText", "tone", "language"]);

export const MAIL_COMPOSE_JSON_SCHEMA = objectSchema({
  subject: stringSchema(1, 998),
  bodyText: stringSchema(1, 12_000),
  tone: { type: "string", enum: REPLY_TONES },
  language: stringSchema(2, 40),
  missingInformation: arraySchema(stringSchema(1, 500), 10),
}, ["subject", "bodyText", "tone", "language", "missingInformation"]);

export function validateMailAiCompose(
  value: unknown,
  metadata: Omit<MailAiCompose, "subject" | "bodyText" | "tone" | "language" | "missingInformation">,
): MailAiCompose | null {
  if (!isRecord(value) || !hasExactKeys(value, ["subject", "bodyText", "tone", "language", "missingInformation"])) return null;
  if (!isBoundedString(value.subject, 1, 998) || /[\r\n]/.test(value.subject)) return null;
  if (!isBoundedString(value.bodyText, 1, 12_000) || !REPLY_TONES.includes(value.tone as MailAiReplyTone) || !isBoundedString(value.language, 2, 40)) return null;
  const missingInformation = parseStringArray(value.missingInformation, 10, 500);
  if (!missingInformation) return null;
  return { subject: value.subject, bodyText: value.bodyText, tone: value.tone as MailAiReplyTone, language: value.language, missingInformation, ...metadata };
}

export function validateMailAiAnalysis(
  value: unknown,
  configuration: MailAiConfiguration,
  metadata: Omit<MailAiAnalysis, "summary" | "category" | "priority" | "requiresReply" | "reasoning" | "detectedEntities" | "importantDates" | "suggestedActions" | "missingInformation" | "confidence">,
): MailAiAnalysis | null {
  if (!isRecord(value) || !hasExactKeys(value, [
    "summary", "category", "priority", "requiresReply", "reasoning", "detectedEntities",
    "importantDates", "suggestedActions", "missingInformation", "confidence",
  ])) return null;
  if (!isRecord(value.summary) || !isBoundedString(value.summary.text, 1, 800)) return null;
  if (!isRecord(value.category) || !isBoundedString(value.category.id, 1, 120) || !isBoundedString(value.category.label, 1, 160)) return null;
  const categoryId = value.category.id;
  const categoryLabel = value.category.label;
  const category = configuration.categories.find((item) => item.id === categoryId && item.label === categoryLabel);
  if (!category) return null;
  if (!isRecord(value.priority) || !isBoundedString(value.priority.id, 1, 120) || !isBoundedString(value.priority.label, 1, 160)) return null;
  const priorityId = value.priority.id;
  const priorityLabel = value.priority.label;
  const priorityLevel = value.priority.level;
  const priority = configuration.priorities.find((item) => item.id === priorityId && item.label === priorityLabel && item.level === priorityLevel);
  if (!priority || typeof value.requiresReply !== "boolean" || !isBoundedString(value.reasoning, 1, 400)) return null;
  const detectedEntities = parseEntities(value.detectedEntities);
  const importantDates = parseDates(value.importantDates);
  const suggestedActions = parseActions(value.suggestedActions);
  const missingInformation = parseStringArray(value.missingInformation, 10, 500);
  if (!detectedEntities || !importantDates || !suggestedActions || !missingInformation || !isConfidence(value.confidence)) return null;
  return {
    summary: { text: value.summary.text }, category, priority, requiresReply: value.requiresReply,
    reasoning: value.reasoning, detectedEntities, importantDates, suggestedActions,
    missingInformation, confidence: value.confidence, ...metadata,
  };
}

export function validateMailAiReply(
  value: unknown,
  metadata: Omit<MailAiReply, "recipients" | "cc" | "bcc" | "subject" | "bodyText" | "tone" | "language">,
): MailAiReply | null {
  if (!isRecord(value) || !hasExactKeys(value, ["recipients", "cc", "bcc", "subject", "bodyText", "tone", "language"])) return null;
  const recipients = parseEmails(value.recipients);
  const cc = parseEmails(value.cc);
  const bcc = parseEmails(value.bcc);
  if (!recipients?.length || !cc || !bcc || !isBoundedString(value.subject, 1, 998) || /[\r\n]/.test(value.subject)) return null;
  if (!isBoundedString(value.bodyText, 1, 12_000) || !REPLY_TONES.includes(value.tone as MailAiReplyTone) || !isBoundedString(value.language, 2, 40)) return null;
  return { recipients, cc, bcc, subject: value.subject, bodyText: value.bodyText, tone: value.tone as MailAiReplyTone, language: value.language, ...metadata };
}

export function emptyUsage(): AiUsageMetadata {
  return { inputTokens: null, cachedInputTokens: null, outputTokens: null, totalTokens: null };
}

function parseEntities(value: unknown) {
  if (!Array.isArray(value) || value.length > 20) return null;
  const result = value.filter(isRecord).map((item) => ({ type: item.type, label: item.label, value: item.value, sourceText: item.sourceText }));
  return result.length === value.length && result.every((item) => MAIL_AI_ENTITY_TYPES.includes(item.type as typeof MAIL_AI_ENTITY_TYPES[number]) && [item.label, item.value, item.sourceText].every((entry) => isBoundedString(entry, 1, 500))) ? result as Array<{ type: string; label: string; value: string; sourceText: string }> : null;
}

function parseDates(value: unknown) {
  if (!Array.isArray(value) || value.length > 10) return null;
  const result = value.filter(isRecord).map((item) => ({ label: item.label, value: item.value, sourceText: item.sourceText }));
  return result.length === value.length && result.every((item) => [item.label, item.value, item.sourceText].every((entry) => isBoundedString(entry, 1, 500))) ? result as Array<{ label: string; value: string; sourceText: string }> : null;
}

function parseActions(value: unknown) {
  if (!Array.isArray(value) || value.length > 8) return null;
  const result = value.filter(isRecord).map((item) => ({ id: item.id, label: item.label, description: item.description, requiresConfirmation: item.requiresConfirmation }));
  return result.length === value.length && result.every((item) => [item.id, item.label, item.description].every((entry) => isBoundedString(entry, 1, 1_000)) && typeof item.requiresConfirmation === "boolean") ? result as Array<{ id: string; label: string; description: string; requiresConfirmation: boolean }> : null;
}

function parseEmails(value: unknown): string[] | null {
  const result = parseStringArray(value, 20, 320);
  return result && result.every((item) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item) && !/[\r\n]/.test(item)) ? result : null;
}

function parseStringArray(value: unknown, maximumItems: number, maximumLength: number): string[] | null {
  return Array.isArray(value) && value.length <= maximumItems && value.every((item) => isBoundedString(item, 1, maximumLength)) ? value : null;
}

function isConfidence(value: unknown): value is "low" | "medium" | "high" {
  return value === "low" || value === "medium" || value === "high";
}

function isBoundedString(value: unknown, minimum: number, maximum: number): value is string {
  return typeof value === "string" && value.trim().length >= minimum && value.length <= maximum;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, keys: string[]) {
  const actual = Object.keys(value).sort();
  return actual.length === keys.length && keys.every((key) => actual.includes(key));
}

function objectSchema(properties: Record<string, unknown>, required: string[]) {
  return { type: "object", properties, required, additionalProperties: false };
}

function arraySchema(items: unknown, maxItems: number) {
  return { type: "array", items, maxItems };
}

function stringSchema(minLength: number, maxLength: number) {
  return { type: "string", minLength, maxLength };
}
