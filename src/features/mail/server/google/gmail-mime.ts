import "server-only";

interface GmailMimeInput {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  bodyText: string;
  bodyHtml?: string;
  inlineImages?: { contentId: string; mimeType: string; base64: string; filename: string }[];
  attachments?: { mimeType: string; base64: string; filename: string }[];
  inReplyTo?: string;
  references?: string;
}

export function createGmailRawMessage(input: GmailMimeInput): string {
  const inReplyTo = sanitizeHeaderValue(input.inReplyTo);
  const references = sanitizeHeaderValue(input.references);
  const headers = [
    `To: ${input.to.join(", ")}`,
    ...(input.cc?.length ? [`Cc: ${input.cc.join(", ")}`] : []),
    ...(input.bcc?.length ? [`Bcc: ${input.bcc.join(", ")}`] : []),
    `Subject: =?UTF-8?B?${Buffer.from(input.subject, "utf8").toString("base64")}?=`,
    ...(inReplyTo ? [`In-Reply-To: ${inReplyTo}`] : []),
    ...(references ? [`References: ${references}`] : []),
    "MIME-Version: 1.0",
  ];
  const mime = input.bodyHtml ? createRichMime(headers, input) : `${headers.join("\r\n")}\r\nContent-Type: text/plain; charset="UTF-8"\r\nContent-Transfer-Encoding: 8bit\r\n\r\n${normalizeLines(input.bodyText)}`;
  return Buffer.from(mime, "utf8").toString("base64url");
}

function createRichMime(headers: string[], input: GmailMimeInput): string {
  const relatedBoundary = `prodpilot-related-${crypto.randomUUID()}`;
  const alternativeBoundary = `prodpilot-alternative-${crypto.randomUUID()}`;
  const mixedBoundary = `prodpilot-mixed-${crypto.randomUUID()}`;
  const images = input.inlineImages ?? [];
  const attachments = input.attachments ?? [];
  const parts = [
    ...headers,
    `Content-Type: ${attachments.length ? `multipart/mixed; boundary="${mixedBoundary}"` : `multipart/related; boundary="${relatedBoundary}"`}`,
    "",
    ...(attachments.length ? [`--${mixedBoundary}`, `Content-Type: multipart/related; boundary="${relatedBoundary}"`, ""] : []),
    `--${relatedBoundary}`,
    `Content-Type: multipart/alternative; boundary="${alternativeBoundary}"`,
    "",
    `--${alternativeBoundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: 8bit",
    "",
    normalizeLines(input.bodyText),
    `--${alternativeBoundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    "Content-Transfer-Encoding: 8bit",
    "",
    normalizeLines(input.bodyHtml ?? ""),
    `--${alternativeBoundary}--`,
    ...images.flatMap((image) => [
      `--${relatedBoundary}`,
      `Content-Type: ${image.mimeType}; name="${sanitizeHeaderValue(image.filename) ?? "machine"}"`,
      "Content-Transfer-Encoding: base64",
      `Content-ID: <${sanitizeHeaderValue(image.contentId) ?? "machine"}>`,
      `Content-Disposition: inline; filename="${sanitizeHeaderValue(image.filename) ?? "machine"}"`,
      "",
      image.base64.replace(/\s/g, "").match(/.{1,76}/g)?.join("\r\n") ?? "",
    ]),
    `--${relatedBoundary}--`,
    ...attachments.flatMap((attachment) => [
      `--${mixedBoundary}`,
      `Content-Type: ${attachment.mimeType}; name="${sanitizeHeaderValue(attachment.filename) ?? "document.pdf"}"`,
      "Content-Transfer-Encoding: base64",
      `Content-Disposition: attachment; filename="${sanitizeHeaderValue(attachment.filename) ?? "document.pdf"}"`,
      "",
      attachment.base64.replace(/\s/g, "").match(/.{1,76}/g)?.join("\r\n") ?? "",
    ]),
    ...(attachments.length ? [`--${mixedBoundary}--`] : []),
  ];
  return parts.join("\r\n");
}

function normalizeLines(value: string): string { return value.replace(/\r?\n/g, "\r\n"); }

function sanitizeHeaderValue(value?: string): string | undefined {
  const sanitized = value?.replace(/[\r\n\0]/g, "").trim();
  return sanitized || undefined;
}
