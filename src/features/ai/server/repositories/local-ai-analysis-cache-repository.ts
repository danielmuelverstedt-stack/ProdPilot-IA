import "server-only";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { AiAnalysisCacheEntry, AiAnalysisCacheRepository } from "@/features/ai/server/repositories/ai-analysis-cache-repository";

const DIRECTORY = path.join(process.cwd(), ".local-data");
const FILE = path.join(DIRECTORY, "mail-ai-analysis-cache.json");
let writeQueue = Promise.resolve();

class LocalAiAnalysisCacheRepository implements AiAnalysisCacheRepository {
  async get(key: string) {
    const entries = await readEntries();
    const entry = entries.find((item) => item.key === key) ?? null;
    if (entry && new Date(entry.expiresAt).getTime() <= Date.now()) {
      await this.delete(key);
      return null;
    }
    return entry;
  }

  async set(entry: AiAnalysisCacheEntry) {
    const entries = (await readEntries()).filter((item) => item.key !== entry.key && new Date(item.expiresAt).getTime() > Date.now());
    entries.push(entry);
    await writeEntries(entries.slice(-500));
  }

  async delete(key: string) {
    await writeEntries((await readEntries()).filter((item) => item.key !== key));
  }
}

async function readEntries(): Promise<AiAnalysisCacheEntry[]> {
  if (process.env.NODE_ENV === "production") return [];
  try {
    const value = JSON.parse(await readFile(FILE, "utf8")) as unknown;
    return Array.isArray(value) ? value.filter(isEntry) : [];
  } catch { return []; }
}

async function writeEntries(entries: AiAnalysisCacheEntry[]) {
  if (process.env.NODE_ENV === "production") return;
  writeQueue = writeQueue.then(async () => {
    await mkdir(DIRECTORY, { recursive: true });
    await writeFile(FILE, JSON.stringify(entries, null, 2), { encoding: "utf8", mode: 0o600 });
  });
  await writeQueue;
}

function isEntry(value: unknown): value is AiAnalysisCacheEntry {
  return typeof value === "object" && value !== null
    && typeof (value as AiAnalysisCacheEntry).key === "string"
    && typeof (value as AiAnalysisCacheEntry).expiresAt === "string"
    && typeof (value as AiAnalysisCacheEntry).analysis === "object";
}

export const aiAnalysisCacheRepository: AiAnalysisCacheRepository = new LocalAiAnalysisCacheRepository();
