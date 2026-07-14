import "server-only";

import type { MailAiAnalysis } from "@/features/ai/types/mail-ai";

export interface AiAnalysisCacheEntry {
  key: string;
  analysis: MailAiAnalysis;
  expiresAt: string;
}

export interface AiAnalysisCacheRepository {
  get(key: string): Promise<AiAnalysisCacheEntry | null>;
  set(entry: AiAnalysisCacheEntry): Promise<void>;
  delete(key: string): Promise<void>;
}
