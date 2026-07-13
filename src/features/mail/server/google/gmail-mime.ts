import "server-only";

interface GmailMimeInput {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  bodyText: string;
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
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: 8bit",
  ];
  const mime = `${headers.join("\r\n")}\r\n\r\n${input.bodyText.replace(/\r?\n/g, "\r\n")}`;
  return Buffer.from(mime, "utf8").toString("base64url");
}

function sanitizeHeaderValue(value?: string): string | undefined {
  const sanitized = value?.replace(/[\r\n\0]/g, "").trim();
  return sanitized || undefined;
}
