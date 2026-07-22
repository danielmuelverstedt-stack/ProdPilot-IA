import type { MailAssistantActionLevel, MailAssistantCommand, MailAssistantIntent } from "@/features/mail-assistant/types/mail-assistant";

const LEVEL_TWO = new Set<MailAssistantIntent>(["create_draft", "compose_new_mail", "create_action", "add_to_qrqc", "add_to_meeting", "mark_processed", "ignore_message", "modify_reply"]);
export function getMailActionLevel(intent: MailAssistantIntent): MailAssistantActionLevel { return intent === "send_email" ? 3 : LEVEL_TWO.has(intent) ? 2 : 1; }
export function canExecuteMailCommand(command: MailAssistantCommand) {
  const level = getMailActionLevel(command.intent);
  if (command.isAmbiguous) return { allowed: false, level, reason: command.clarification ?? "La référence est ambiguë." };
  if (level === 3 && !command.isExplicitSend) return { allowed: false, level, reason: "L’envoi exige une instruction explicite contenant une intention d’envoi." };
  return { allowed: true, level };
}
