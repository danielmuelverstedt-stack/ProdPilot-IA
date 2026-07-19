import { MAIL_AUTOMATION_DEFAULTS } from "../config/mail-management-defaults.ts";
import { MAIL_WORKFLOW_LABELS, type MailAutomationRule, type MailClassificationDecision } from "../types/mail-management.ts";
import type { MailMessage } from "@/features/mail/types/mail";

export function classifyMailForManagement(message: MailMessage, rules: MailAutomationRule[]): MailClassificationDecision {
  const text = normalize(`${message.subject} ${message.snippet} ${message.bodyText}`);
  const matchingRules = rules.filter((rule) => rule.isActive && matchesRule(message, rule)).sort((a, b) => b.priority - a.priority);
  const protectedReason = MAIL_AUTOMATION_DEFAULTS.protectedTerms.find((term) => includesTerm(text, term));
  const directRequest = /\?|merci de|peux-tu|pouvez-vous|veuillez|à valider|a valider/.test(text);
  const possibleDeadline = /\b(?:échéance|echeance|deadline|demain|au plus tard|avant le|pour le)\b|\b\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?\b/.test(text);
  if (message.attachments.length || message.isImportant || message.isFlagged || protectedReason || possibleDeadline) {
    const reason = protectedReason
      ? `Le terme métier protégé « ${protectedReason} » a été détecté.`
      : possibleDeadline
        ? "Une échéance potentielle impose une vérification humaine."
        : "Une pièce jointe ou un indicateur d’importance impose une vérification humaine.";
    return decision("needs_review", 0.99, reason, directRequest ? ["Répondre ou décider"] : [], possibleDeadline ? ["Échéance potentielle"] : [], [MAIL_WORKFLOW_LABELS.toProcess], "label");
  }
  const keepRule = matchingRules.find((rule) => rule.action === "keep_to_process");
  if (keepRule) return decision("to_process", 0.99, `La règle approuvée « ${keepRule.name} » conserve ce mail à traiter.`, [], [], [MAIL_WORKFLOW_LABELS.toProcess], "label");
  const waitingRule = matchingRules.find((rule) => rule.action === "mark_waiting");
  if (waitingRule) return decision("waiting", 0.99, `La règle approuvée « ${waitingRule.name} » propose de placer ce mail en attente.`, [], [], [MAIL_WORKFLOW_LABELS.waiting], "mark_waiting");
  if (directRequest) return decision("to_process", 0.97, "Une question ou une demande explicite a été détectée.", ["Répondre ou décider"], [], [MAIL_WORKFLOW_LABELS.toProcess], "label");
  const archiveRule = matchingRules.find((rule) => rule.action === "archive");
  const newsletter = MAIL_AUTOMATION_DEFAULTS.newsletterSignals.some((signal) => text.includes(signal)) || message.labels?.includes("CATEGORY_PROMOTIONS");
  if (archiveRule && newsletter) return decision("low_value", 0.99, `La règle approuvée « ${archiveRule.name} » autorise l’archivage de ce type de mail.`, [], [], [MAIL_WORKFLOW_LABELS.aiArchived], "archive");
  if (newsletter) return decision("low_value", 0.92, "Le message ressemble à une newsletter ou une communication promotionnelle, mais aucune règle approuvée n’autorise son archivage automatique.", [], [], [], "none");
  return decision("informational", 0.72, "Aucune demande explicite ni échéance fiable n’a été détectée.", [], [], [], "none");
}

export function canAutomaticallyArchive(message: MailMessage, result: MailClassificationDecision, rules: MailAutomationRule[]): boolean {
  return result.classification === "low_value"
    && result.confidence >= MAIL_AUTOMATION_DEFAULTS.automaticArchiveConfidence
    && result.detectedActions.length === 0
    && result.detectedDeadlines.length === 0
    && message.attachments.length === 0
    && !message.isImportant
    && !message.isFlagged
    && rules.some((rule) => rule.isActive && rule.origin === "user" && rule.action === "archive" && matchesRule(message, rule));
}

export function getMatchingMailRuleIds(message: MailMessage, rules: MailAutomationRule[]): string[] {
  return rules.filter((rule) => rule.isActive && matchesRule(message, rule)).map((rule) => rule.id);
}

export function parseMailClassificationDecision(value: unknown): MailClassificationDecision | null {
  if (!isRecord(value) || !["to_process", "waiting", "processed", "informational", "low_value", "needs_review"].includes(String(value.classification))) return null;
  if (typeof value.confidence !== "number" || value.confidence < 0 || value.confidence > 1 || typeof value.reason !== "string") return null;
  if (!isStringArray(value.detectedActions) || !isStringArray(value.detectedDeadlines) || !isStringArray(value.recommendedLabels) || !isRecord(value.proposedOperation)) return null;
  if (!["none", "label", "archive", "mark_processed", "mark_waiting"].includes(String(value.proposedOperation.type)) || value.proposedOperation.requiresConfirmation !== true) return null;
  return value as unknown as MailClassificationDecision;
}

function decision(classification: MailClassificationDecision["classification"], confidence: number, reason: string, detectedActions: string[], detectedDeadlines: string[], recommendedLabels: string[], type: MailClassificationDecision["proposedOperation"]["type"]): MailClassificationDecision {
  return { classification, confidence, reason, detectedActions, detectedDeadlines, recommendedLabels, proposedOperation: { type, requiresConfirmation: true } };
}

function matchesRule(message: MailMessage, rule: MailAutomationRule): boolean {
  const value = normalize(rule.condition.value);
  if (rule.condition.kind === "sender") return normalize(message.from.email) === value;
  if (rule.condition.kind === "sender_domain") return normalize(message.from.email).endsWith(value.startsWith("@") ? value : `@${value}`);
  if (rule.condition.kind === "subject_contains") return normalize(message.subject).includes(value);
  return MAIL_AUTOMATION_DEFAULTS.newsletterSignals.some((signal) => normalize(`${message.subject} ${message.snippet}`).includes(signal));
}

function normalize(value: string): string { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(); }
function includesTerm(text: string, term: string): boolean { return term.length <= 2 ? new RegExp(`\\b${term}\\b`, "i").test(text) : text.includes(normalize(term)); }
function isStringArray(value: unknown): value is string[] { return Array.isArray(value) && value.every((item) => typeof item === "string"); }
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
