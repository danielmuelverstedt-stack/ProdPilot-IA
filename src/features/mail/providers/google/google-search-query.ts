import "server-only";

import type { MailSearchCriteria } from "@/features/mail/types/mail";

export function buildGmailSearchQuery(criteria: MailSearchCriteria): string {
  const terms = [
    safeSearchTerm(criteria.text),
    criteria.subject ? `subject:${safeSearchTerm(criteria.subject)}` : "",
    criteria.sender ? `from:${safeSearchTerm(criteria.sender)}` : "",
    criteria.recipient ? `to:${safeSearchTerm(criteria.recipient)}` : "",
    safeSearchTerm(criteria.body),
    criteria.attachmentName ? `filename:${safeSearchTerm(criteria.attachmentName)}` : "",
    criteria.readState === "unread" ? "is:unread" : criteria.readState === "read" ? "is:read" : "",
    criteria.importantOnly ? "is:important" : "",
    criteria.flaggedOnly ? "is:starred" : "",
    criteria.hasAttachment ? "has:attachment" : "",
    ...getDateTerms(criteria),
    criteria.dateFrom ? `after:${criteria.dateFrom.replaceAll("-", "/")}` : "",
    criteria.dateTo ? `before:${nextDate(criteria.dateTo)}` : "",
    ...(criteria.labels ?? []).map((label) => `label:${safeSearchTerm(label)}`),
    safeSearchTerm(criteria.futureAiKeywords?.join(" ")),
    "-in:spam",
    "-in:trash",
  ].filter(Boolean);
  const query = terms.join(" ");
  if (query.length > 500) throw new Error("La recherche Gmail est trop longue.");
  return query;
}

function safeSearchTerm(value?: string): string {
  const normalized = value?.trim().replace(/[{}]/g, "") ?? "";
  return normalized ? `"${normalized.replace(/"/g, "")}"` : "";
}

function getDateTerms(criteria: MailSearchCriteria): string[] {
  if (!criteria.datePreset || criteria.datePreset === "all" || criteria.datePreset === "custom") return [];
  const today = new Date(); today.setUTCHours(0, 0, 0, 0);
  if (criteria.datePreset === "today") return [`after:${formatDate(today)}`];
  if (criteria.datePreset === "yesterday") {
    const yesterday = new Date(today); yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    return [`after:${formatDate(yesterday)}`, `before:${formatDate(today)}`];
  }
  const week = new Date(today); week.setUTCDate(week.getUTCDate() - ((week.getUTCDay() + 6) % 7));
  return [`after:${formatDate(week)}`];
}

function nextDate(value: string): string {
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) throw new Error("La date de recherche Gmail est invalide.");
  date.setUTCDate(date.getUTCDate() + 1);
  return formatDate(date);
}

function formatDate(value: Date): string {
  return value.toISOString().slice(0, 10).replaceAll("-", "/");
}
