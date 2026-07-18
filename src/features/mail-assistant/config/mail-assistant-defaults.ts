import type { MailAssistantGroup, MailAssistantStartSettings, MailWorkflowStatusDefinition } from "@/features/mail-assistant/types/mail-assistant";

export const MAIL_ASSISTANT_GROUP_LABELS: Record<MailAssistantGroup, string> = {
  now: "À traiter maintenant",
  reply: "Réponse nécessaire",
  action: "Action à créer",
  review: "À vérifier",
  information: "Information",
  no_action: "Aucune action recommandée",
  processed: "Traités",
};
export const MAIL_WORKFLOW_STATUSES: MailWorkflowStatusDefinition[] = [
  ["new", "Nouveau"], ["analyze", "À analyser"], ["review", "À vérifier"], ["reply_required", "Réponse nécessaire"], ["draft_ready", "Brouillon prêt"], ["awaiting_validation", "En attente de validation"], ["awaiting_reply", "En attente de réponse"], ["action_created", "Action créée"], ["information", "Information"], ["no_action", "Aucune action"], ["processed", "Traité"], ["ignored", "Ignoré"],
].map(([id, label], order) => ({ id, label, active: true, order })) as MailWorkflowStatusDefinition[];
export const MAIL_ASSISTANT_START_DEFAULTS: MailAssistantStartSettings = { speakOpeningBrief: true, askFollowUpQuestion: true, autoListenAfterBrief: false, includePendingDrafts: true, includeMessagesWithoutStatus: true, includeOverdueFollowUps: true, includeInformationalMessages: true, maximumItemsSpoken: 7, briefDetail: "compact", replayButtonVisible: true, voiceEnabled: true, speechRate: 0.95, speechVolume: 1, preferredLanguage: "fr-FR", preferredVoiceName: "", listeningBehavior: "push_to_talk", workflowStatuses: MAIL_WORKFLOW_STATUSES, voiceInteractionEnabled: true, inputMode: "push_to_talk", pushToTalkShortcut: "ctrl_space", customShortcut: "", recognitionLanguage: "fr-FR", continuousConversation: false, silenceTimeoutSeconds: 8, pauseAfterSpeechMs: 350, disableContinuousOnBlur: true, transcriptPreview: true, submitAutomatically: false, voiceOutputEnabled: true, assistantVoicePreset: "british_assistant", speechPitch: 0.9, speakConfirmations: true, speakExecutionSummaries: true, longAnswerSpeech: "summary", interruptAssistantBySpeaking: false, ttsProvider: "system-browser", selectedMicrophoneDeviceId: "", microphoneTestDurationSeconds: 6, preferredVoiceId: "", preferredVoiceLocale: "fr-FR", voiceFallbackStrategy: "uri_name_locale_default" };

export const MAIL_ASSISTANT_DEFAULTS = {
  maximumMessages: 25,
  noActionMinimumConfidence: 0.82,
  compactResponses: true,
  voiceEnabled: true,
  sendingEnabled: false as const,
  analysisOnlyAfterExplicitStart: true as const,
};
