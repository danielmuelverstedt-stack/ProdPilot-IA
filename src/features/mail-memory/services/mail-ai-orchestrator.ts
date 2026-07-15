import type { MailMemoryRepository } from "@/features/mail-memory/repositories/mail-memory-repository";
import { searchMailMemory } from "@/features/mail-memory/services/mail-memory-search";
import type { LocalMailAnalysis, MailMemoryContext, MailMemorySearchQuery, MailMemorySearchResult } from "@/features/mail-memory/types/mail-memory";

export type MailAiOrchestrationResult =
  | { level: 0; reason: string; local: MailMemorySearchResult }
  | { level: 1; reason: string; local: MailMemorySearchResult; analysis: LocalMailAnalysis }
  | { level: 2; reason: string; local: MailMemorySearchResult; requiresPaidAiConfirmation: boolean };

export async function orchestrateMailRequest(repository: MailMemoryRepository, context: MailMemoryContext, query: MailMemorySearchQuery, options: { requiresSynthesis: boolean; askBeforeExpensiveAiCall: boolean; now?: Date }): Promise<MailAiOrchestrationResult> {
  const local = await searchMailMemory(repository, context, query);
  if (!options.requiresSynthesis && (local.messages.length || local.decisions.length || local.commitments.length)) return { level: 0, reason: "Réponse déterministe disponible dans la mémoire locale.", local };
  const analyses = await repository.list<LocalMailAnalysis>("mailAnalyses", context);
  const now = (options.now ?? new Date()).toISOString();
  const messageIds = new Set(local.messages.map((message) => message.id));
  const cached = analyses.find((analysis) => messageIds.has(analysis.messageId) && analysis.expiresAt > now && local.messages.some((message) => message.id === analysis.messageId && message.contentFingerprint === analysis.contentFingerprint));
  if (cached) return { level: 1, reason: "Analyse locale validée et encore valable.", local, analysis: cached };
  return { level: 2, reason: "Une synthèse nouvelle est nécessaire après la recherche locale.", local, requiresPaidAiConfirmation: options.askBeforeExpensiveAiCall };
}
