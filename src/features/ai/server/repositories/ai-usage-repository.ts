import "server-only";

import type { AiUsageRecord } from "@/features/ai/types/ai";

export interface AiUsageRepository {
  record(entry: AiUsageRecord): Promise<void>;
  listSince(timestamp: string): Promise<AiUsageRecord[]>;
}
