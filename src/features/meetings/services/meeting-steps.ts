export const MEETING_STEPS: Record<"QRQC" | "Production", string[]> = {
  QRQC: ["Participants", "Suivi des actions", "OF en cours", "Prochains OF", "Points bloquants", "Besoins des départements", "Actions créées", "Synthèse", "Clôture"],
  Production: ["Participants", "Suivi des actions", "Dossiers prioritaires", "Maintenance", "Remontées terrain", "OF planifiés par machine", "Demandes des départements", "Compte rendu"],
};

export function meetingSteps(type: "QRQC" | "Production"): string[] {
  return MEETING_STEPS[type];
}
