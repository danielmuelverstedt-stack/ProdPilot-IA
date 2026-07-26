import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";

interface SerializedAtomicJsonFileOptions<T> {
  storageFile: string;
  parse: (value: unknown) => T | null;
  createDefault: () => T;
  normalize: (value: T) => T;
  readErrorMessage: string;
  beforeReplace?: (temporaryFile: string) => Promise<void>;
}

interface UpdateResult<T, TResult> {
  value: T;
  result: TResult;
}

/** Coordonne toutes les lectures et mutations d'un fichier JSON local. */
export class SerializedAtomicJsonFile<T> {
  private operationQueue: Promise<void> = Promise.resolve();
  private readonly options: SerializedAtomicJsonFileOptions<T>;
  /**
   * Cache mémoire de la valeur courante : `runExclusive` sérialise déjà toutes les lectures et
   * écritures de cette instance, donc un seul lecteur à la fois peut jamais voir un état
   * incohérent. Invalidé en tout début d'écriture (pas après), pour qu'un échec en cours
   * d'écriture ne laisse jamais un cache périmé survivre à l'erreur.
   */
  private cachedValue: T | undefined;

  constructor(options: SerializedAtomicJsonFileOptions<T>) {
    this.options = options;
  }

  read(): Promise<T> {
    return this.runExclusive(() => this.readUnlocked());
  }

  update<TResult>(
    updater: (current: T) => UpdateResult<T, TResult> | Promise<UpdateResult<T, TResult>>,
  ): Promise<TResult> {
    return this.runExclusive(async () => {
      const current = await this.readUnlocked();
      const updated = await updater(current);
      await this.writeUnlocked(updated.value);
      return updated.result;
    });
  }

  private runExclusive<TResult>(operation: () => Promise<TResult>): Promise<TResult> {
    const result = this.operationQueue.catch(() => undefined).then(operation);
    this.operationQueue = result.then(() => undefined, () => undefined);
    return result;
  }

  private async readUnlocked(): Promise<T> {
    if (this.cachedValue !== undefined) return this.cachedValue;
    try {
      const raw = await readFile(this.options.storageFile, "utf8");
      const parsed = this.options.parse(JSON.parse(raw) as unknown);
      const value = parsed ?? this.options.createDefault();
      this.cachedValue = value;
      return value;
    } catch (error) {
      if (isFileMissing(error)) {
        const value = this.options.createDefault();
        this.cachedValue = value;
        return value;
      }
      throw new Error(this.options.readErrorMessage);
    }
  }

  private async writeUnlocked(value: T): Promise<void> {
    this.cachedValue = undefined;
    const directory = path.dirname(this.options.storageFile);
    const temporaryFile = path.join(
      directory,
      `.${path.basename(this.options.storageFile)}.${process.pid}.${randomUUID()}.tmp`,
    );
    const serialized = JSON.stringify(this.options.normalize(value), null, 2);
    await mkdir(directory, { recursive: true });
    try {
      await writeFile(temporaryFile, serialized, { encoding: "utf8", mode: 0o600, flag: "wx" });
      await this.options.beforeReplace?.(temporaryFile);
      await replaceFileAtomically(temporaryFile, this.options.storageFile);
      this.cachedValue = value;
    } catch (error) {
      await rm(temporaryFile, { force: true }).catch(() => undefined);
      throw error;
    }
  }
}

async function replaceFileAtomically(source: string, destination: string): Promise<void> {
  const maximumAttempts = process.platform === "win32" ? 25 : 1;
  for (let attempt = 1; attempt <= maximumAttempts; attempt += 1) {
    try {
      await rename(source, destination);
      return;
    } catch (error) {
      if (attempt === maximumAttempts || !isWindowsSharingViolation(error)) throw error;
      await delay(10);
    }
  }
}

function isFileMissing(error: unknown): boolean {
  return isRecord(error) && error.code === "ENOENT";
}

function isWindowsSharingViolation(error: unknown): boolean {
  return isRecord(error) && (error.code === "EPERM" || error.code === "EACCES");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
