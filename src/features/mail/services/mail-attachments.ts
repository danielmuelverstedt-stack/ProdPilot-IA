import type { MailAttachment } from "@/features/mail/types/mail";

export interface MailAttachmentPresentation {
  icon: "image" | "pdf" | "document" | "archive" | "file";
  size: string;
  canPreview: boolean;
  canDownload: boolean;
  futureAnalysisAvailable: boolean;
}

export function getMailAttachmentPresentation(attachment: MailAttachment): MailAttachmentPresentation {
  return {
    icon: getIcon(attachment.mimeType),
    size: new Intl.NumberFormat("fr-BE", { style: "unit", unit: "kilobyte", maximumFractionDigits: 1 })
      .format(attachment.sizeBytes / 1_024),
    canPreview: false,
    canDownload: false,
    futureAnalysisAvailable: attachment.analysisStatus !== "unavailable",
  };
}

function getIcon(mimeType: string): MailAttachmentPresentation["icon"] {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType.includes("zip") || mimeType.includes("compressed")) return "archive";
  if (mimeType.startsWith("text/") || mimeType.includes("document") || mimeType.includes("sheet")) return "document";
  return "file";
}
