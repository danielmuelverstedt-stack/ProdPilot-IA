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
  const headers = [
    `To: ${input.to.join(", ")}`,
    ...(input.cc?.length ? [`Cc: ${input.cc.join(", ")}`] : []),
    ...(input.bcc?.length ? [`Bcc: ${input.bcc.join(", ")}`] : []),
    `Subject: =?UTF-8?B?${Buffer.from(input.subject, "utf8").toString("base64")}?=`,
    ...(input.inReplyTo ? [`In-Reply-To: ${input.inReplyTo}`] : []),
    ...(input.references ? [`References: ${input.references}`] : []),
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: 8bit",
  ];
  const mime = `${headers.join("\r\n")}\r\n\r\n${input.bodyText.replace(/\r?\n/g, "\r\n")}`;
  return Buffer.from(mime, "utf8").toString("base64url");
}
