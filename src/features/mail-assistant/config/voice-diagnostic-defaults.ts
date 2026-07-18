export const VOICE_LEVEL_THRESHOLDS = { absent: 0.015, weak: 0.06, strong: 0.45 } as const;
export type VoiceSignalQuality = "absent" | "weak" | "correct" | "strong";
export function classifyVoiceLevel(level: number): VoiceSignalQuality { if (level < VOICE_LEVEL_THRESHOLDS.absent) return "absent"; if (level < VOICE_LEVEL_THRESHOLDS.weak) return "weak"; if (level < VOICE_LEVEL_THRESHOLDS.strong) return "correct"; return "strong"; }
export const VOICE_SIGNAL_LABELS: Record<VoiceSignalQuality, string> = { absent: "Aucun signal détecté", weak: "Signal faible", correct: "Signal correct", strong: "Signal fort" };
