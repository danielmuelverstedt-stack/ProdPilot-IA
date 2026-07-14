import type { MailAccountSettings, MailMessage, MailSearchCriteria } from "@/features/mail/types/mail";

const priorityRank = { high: 0, normal: 1, low: 2 } as const;

export function getDefaultMailSearchCriteria(settings: MailAccountSettings): MailSearchCriteria {
  if (settings.defaultFilter === "unread") return { readState: "unread", sort: settings.defaultSort };
  if (settings.defaultFilter === "urgent") return { category: "urgent", sort: settings.defaultSort };
  if (settings.defaultFilter === "reply_required") return { category: "reply_required", sort: settings.defaultSort };
  return { readState: "all", sort: settings.defaultSort };
}

export function searchMailMessages(
  messages: readonly MailMessage[],
  criteria: MailSearchCriteria,
  now = new Date(),
): MailMessage[] {
  return messages
    .filter((message) => matchesCriteria(message, criteria, now))
    .toSorted((first, second) => compareMessages(first, second, criteria.sort ?? "newest"));
}

function matchesCriteria(message: MailMessage, criteria: MailSearchCriteria, now: Date): boolean {
  const generalFields = [message.subject, message.from.name, message.from.email, message.bodyText, message.snippet, message.summary];
  return matchesText(generalFields, criteria.text)
    && matchesText([message.subject], criteria.subject)
    && matchesText([message.from.name, message.from.email], criteria.sender)
    && matchesText([...message.to, ...message.cc].flatMap((address) => [address.name, address.email]), criteria.recipient)
    && matchesText([message.bodyText, message.snippet], criteria.body)
    && matchesText(message.attachments.map((attachment) => attachment.filename), criteria.attachmentName)
    && (criteria.readState === undefined || criteria.readState === "all" || (criteria.readState === "read") === message.isRead)
    && (!criteria.importantOnly || message.isImportant === true || message.priority === "high")
    && (!criteria.flaggedOnly || message.isFlagged === true)
    && (!criteria.waitingReplyOnly || message.category === "reply_required")
    && (criteria.hasAttachment === undefined || (message.attachments.length > 0) === criteria.hasAttachment)
    && matchesDate(message.receivedAt, criteria, now)
    && (!criteria.provider || message.provider === criteria.provider)
    && (!criteria.accountId || message.accountId === criteria.accountId)
    && matchesAll(message.labels, criteria.labels)
    && matchesAll(message.tags, criteria.tags)
    && (!criteria.priority || message.priority === criteria.priority)
    && (!criteria.category || message.category === criteria.category)
    && matchesText(generalFields, criteria.futureAiKeywords?.join(" "));
}

function matchesText(values: readonly (string | undefined)[], query?: string): boolean {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  if (!terms.length) return true;
  const haystack = normalize(values.filter(Boolean).join(" "));
  return terms.every((term) => haystack.includes(term));
}

function matchesAll(values: readonly string[] | undefined, requested: readonly string[] | undefined): boolean {
  if (!requested?.length) return true;
  const normalizedValues = (values ?? []).map(normalize);
  return requested.every((item) => normalizedValues.includes(normalize(item)));
}

function matchesDate(receivedAt: string, criteria: MailSearchCriteria, now: Date): boolean {
  const received = new Date(receivedAt);
  if (Number.isNaN(received.getTime())) return false;
  if (criteria.datePreset === "custom") {
    if (criteria.dateFrom && received < startOfDay(new Date(criteria.dateFrom))) return false;
    if (criteria.dateTo && received > endOfDay(new Date(criteria.dateTo))) return false;
    return true;
  }
  if (!criteria.datePreset || criteria.datePreset === "all") return true;
  const today = startOfDay(now);
  if (criteria.datePreset === "today") return received >= today;
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
  if (criteria.datePreset === "yesterday") return received >= yesterday && received < today;
  const week = new Date(today); week.setDate(week.getDate() - ((week.getDay() + 6) % 7));
  return received >= week;
}

function compareMessages(first: MailMessage, second: MailMessage, sort: NonNullable<MailSearchCriteria["sort"]>): number {
  if (sort === "priority") return priorityRank[first.priority] - priorityRank[second.priority]
    || new Date(second.receivedAt).getTime() - new Date(first.receivedAt).getTime();
  const delta = new Date(first.receivedAt).getTime() - new Date(second.receivedAt).getTime();
  return sort === "oldest" ? delta : -delta;
}

function normalize(value?: string): string {
  return (value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("fr").trim();
}

function startOfDay(value: Date): Date {
  const result = new Date(value); result.setHours(0, 0, 0, 0); return result;
}

function endOfDay(value: Date): Date {
  const result = new Date(value); result.setHours(23, 59, 59, 999); return result;
}
