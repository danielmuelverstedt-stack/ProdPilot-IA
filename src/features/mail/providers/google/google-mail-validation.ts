import "server-only";

import type { CreateMailDraftInput } from "@/features/mail/types/mail";

const DEFAULT_MESSAGE_LIMIT = 25;
const MAX_MESSAGE_LIMIT = 100;

export function clampGoogleMessageLimit(value?: number): number {
  return Number.isInteger(value) ? Math.min(Math.max(value!, 1), MAX_MESSAGE_LIMIT) : DEFAULT_MESSAGE_LIMIT;
}

export function receivedSinceYesterdayQuery(): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - 1);
  return `after:${date.toISOString().slice(0, 10).replaceAll("-", "/")}`;
}

export function assertGmailId(value: string): void {
  if (!/^[A-Za-z0-9_-]{1,200}$/.test(value)) throw new Error("L’identifiant Gmail est invalide.");
}

export function validateGoogleDraft(input: CreateMailDraftInput): void {
  if (!input.to.length || input.to.length > 20 || !input.to.every((item) => isValidEmail(item.email))) {
    throw new Error("Le destinataire du brouillon est invalide.");
  }
  if ((input.cc?.length ?? 0) > 20 || input.cc?.some((item) => !isValidEmail(item.email))) {
    throw new Error("Un destinataire en copie du brouillon est invalide.");
  }
  if ((input.bcc?.length ?? 0) > 20 || input.bcc?.some((item) => !isValidEmail(item.email))) {
    throw new Error("Un destinataire en copie cachée du brouillon est invalide.");
  }
  if (!input.subject.trim() || input.subject.length > 998 || /[\r\n]/.test(input.subject)) {
    throw new Error("L’objet du brouillon est invalide.");
  }
  if (!input.bodyText.trim() || input.bodyText.length > 200_000) {
    throw new Error("Le contenu du brouillon est invalide.");
  }
}

export function getGoogleHttpStatus(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null) return undefined;
  if ("code" in error && typeof error.code === "number") return error.code;
  if ("response" in error && typeof error.response === "object" && error.response
    && "status" in error.response && typeof error.response.status === "number") return error.response.status;
  return undefined;
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && !/[\r\n]/.test(value);
}
