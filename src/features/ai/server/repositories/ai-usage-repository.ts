import "server-only";

import type { AiUsageRecord } from "@/features/ai/types/ai";

export interface AiUsageRepository {
  isOperational(): boolean;
  record(entry: AiUsageRecord): Promise<void>;
  listSince(timestamp: string): Promise<AiUsageRecord[]>;
}
