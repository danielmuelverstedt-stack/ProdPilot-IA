import "server-only";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { AiUsageRepository } from "@/features/ai/server/repositories/ai-usage-repository";
import type { AiUsageRecord } from "@/features/ai/types/ai";

const DIRECTORY = path.join(process.cwd(), ".local-data");
const FILE = path.join(DIRECTORY, "mail-ai-usage.json");
let writeQueue = Promise.resolve();

class LocalAiUsageRepository implements AiUsageRepository {
  isOperational() { return process.env.NODE_ENV !== "production"; }
  async record(entry: AiUsageRecord) {
    if (process.env.NODE_ENV === "production") return;
    const entries = await readEntries();
    entries.push(entry);
    writeQueue = writeQueue.then(async () => {
      await mkdir(DIRECTORY, { recursive: true });
      await writeFile(FILE, JSON.stringify(entries.slice(-5_000), null, 2), { encoding: "utf8", mode: 0o600 });
    });
    await writeQueue;
  }

  async listSince(timestamp: string) {
    const minimum = new Date(timestamp).getTime();
    return (await readEntries()).filter((entry) => new Date(entry.createdAt).getTime() >= minimum);
  }
}

async function readEntries(): Promise<AiUsageRecord[]> {
  if (process.env.NODE_ENV === "production") return [];
  try {
    const value = JSON.parse(await readFile(FILE, "utf8")) as unknown;
    return Array.isArray(value) ? value.filter(isRecord) : [];
  } catch { return []; }
}

function isRecord(value: unknown): value is AiUsageRecord {
  return typeof value === "object" && value !== null
    && typeof (value as AiUsageRecord).id === "string"
    && typeof (value as AiUsageRecord).createdAt === "string"
    && typeof (value as AiUsageRecord).accountId === "string";
}

export const aiUsageRepository: AiUsageRepository = new LocalAiUsageRepository();
