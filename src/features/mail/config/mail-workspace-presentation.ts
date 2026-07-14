import type { MailMessageCategory, MailPriority } from "@/features/mail/types/mail";

export type MailWorkspaceView = "all" | MailMessageCategory;

export const MAIL_WORKSPACE_VIEWS: readonly { id: MailWorkspaceView; label: string }[] = [
  { id: "all", label: "Tous" },
  { id: "urgent", label: "Urgents" },
  { id: "reply_required", label: "Réponse nécessaire" },
  { id: "information", label: "Information" },
  { id: "action_required", label: "Action à créer" },
];

export const MAIL_CATEGORY_PRESENTATION: Record<MailMessageCategory, { label: string; className: string }> = {
  urgent: { label: "Urgent", className: "bg-[#fff0ed] text-[#9d3f35]" },
  reply_required: { label: "Réponse nécessaire", className: "bg-[#fff7e5] text-[#8a651f]" },
  information: { label: "Information", className: "bg-[#edf6f2] text-[#376955]" },
  action_required: { label: "Action à créer", className: "bg-[#eef1ff] text-[#575d9b]" },
};

export const MAIL_PRIORITY_PRESENTATION: Record<MailPriority, { label: string; className: string }> = {
  high: { label: "Haute", className: "text-[#9d3f35]" },
  normal: { label: "Normale", className: "text-[#8a651f]" },
  low: { label: "Basse", className: "text-[#376955]" },
};
