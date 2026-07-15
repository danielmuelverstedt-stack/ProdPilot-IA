import type { MailMemoryContext, SourceLink, SourceLinkType } from "@/features/mail-memory/types/mail-memory";

export function createMailSourceLink(context: MailMemoryContext, input: { externalId: string; parentExternalId?: string; displayName: string; sourceType: Extract<SourceLinkType, "mail" | "thread" | "attachment" | "draft">; accountEmail?: string }): SourceLink {
  const now = new Date().toISOString();
  const isGmail = context.provider === "google" && Boolean(input.accountEmail);
  return {
    ...context,
    id: `${context.companyId}:${context.userId}:${context.accountId}:${input.sourceType}:${input.externalId}`,
    sourceId: input.externalId,
    createdAt: now,
    updatedAt: now,
    synchronizationStatus: "synchronized",
    sourceType: input.sourceType,
    externalId: input.externalId,
    parentExternalId: input.parentExternalId,
    displayName: input.displayName,
    url: isGmail ? resolveGmailUrl(input.accountEmail ?? "", input.sourceType, input.parentExternalId ?? input.externalId) : undefined,
    resolverType: isGmail ? "gmail" : context.provider === "mock" ? "unavailable" : "provider",
    metadata: {},
    lastValidatedAt: null,
    accessState: isGmail ? "available" : "unknown",
  };
}

export function resolveSourceLink(link: SourceLink): { href: string | null; label: string } {
  if (link.accessState === "authentication_required") return { href: null, label: "Reconnecter la source" };
  if (!link.url) return { href: null, label: "Source indisponible" };
  if (link.provider === "google") return { href: link.url, label: link.sourceType === "thread" ? "Ouvrir la discussion dans Gmail" : "Ouvrir dans Gmail" };
  return { href: link.url, label: "Ouvrir dans la source" };
}

function resolveGmailUrl(accountEmail: string, sourceType: SourceLinkType, externalId: string): string {
  const view = sourceType === "draft" ? "drafts" : "all";
  return `https://mail.google.com/mail/u/${encodeURIComponent(accountEmail)}/#${view}/${encodeURIComponent(externalId)}`;
}
