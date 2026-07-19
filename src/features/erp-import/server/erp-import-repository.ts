import "server-only";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { SerializedAtomicJsonFile } from "@/features/mail/server/accounts/serialized-atomic-json-file";
import { ERP_IMPORT_VERSION, type ErpImportSummary, type ErpMachineMapping, type ErpManualOverride, type ErpPlanningProjection } from "@/features/erp-import/types/erp-import";

interface StoredOverrides { version: 1; values: Record<string, ErpManualOverride> }
interface StoredMappings { version: 1; values: Record<string, ErpMachineMapping> }

const localDataDirectory = path.join(process.cwd(), ".local-data");

class ErpImportRepository {
  private projectionCache: Promise<ErpPlanningProjection> | null = null;
  private overridesCache: Promise<Record<string, ErpManualOverride>> | null = null;
  private mappingsCache: Promise<Record<string, ErpMachineMapping>> | null = null;
  private readonly projection = new SerializedAtomicJsonFile<ErpPlanningProjection>({
    storageFile: path.join(localDataDirectory, "erp-planning.json"),
    parse: parseProjection,
    createDefault: emptyProjection,
    normalize: (value) => value,
    readErrorMessage: "Le registre local des imports ERP est illisible.",
  });

  private readonly overrides = new SerializedAtomicJsonFile<StoredOverrides>({
    storageFile: path.join(localDataDirectory, "erp-planning-overrides.json"),
    parse: (value) => parseDictionary<ErpManualOverride>(value, isManualOverride),
    createDefault: () => ({ version: 1, values: {} }),
    normalize: (value) => value,
    readErrorMessage: "Le registre local des ajustements Planning est illisible.",
  });

  private readonly mappings = new SerializedAtomicJsonFile<StoredMappings>({
    storageFile: path.join(localDataDirectory, "erp-machine-mappings.json"),
    parse: (value) => parseDictionary<ErpMachineMapping>(value, isMachineMapping),
    createDefault: () => ({ version: 1, values: {} }),
    normalize: (value) => value,
    readErrorMessage: "Le registre local des correspondances machines est illisible.",
  });

  readProjection(): Promise<ErpPlanningProjection> {
    if (!this.projectionCache) this.projectionCache = this.projection.read().catch((error) => { this.projectionCache = null; throw error; });
    return this.projectionCache;
  }

  readOverrides(): Promise<Record<string, ErpManualOverride>> {
    if (!this.overridesCache) this.overridesCache = this.overrides.read().then((stored) => stored.values).catch((error) => { this.overridesCache = null; throw error; });
    return this.overridesCache;
  }

  readMappings(): Promise<Record<string, ErpMachineMapping>> {
    if (!this.mappingsCache) this.mappingsCache = this.mappings.read().then((stored) => stored.values).catch((error) => { this.mappingsCache = null; throw error; });
    return this.mappingsCache;
  }

  async findDuplicate(combinedHash: string): Promise<ErpImportSummary | null> {
    const projection = await this.projection.read();
    return projection.imports.find((entry) => entry.files.map((file) => file.sha256).sort().join(":") === combinedHash) ?? null;
  }

  async activateImport(input: {
    summary: ErpImportSummary;
    workOrders: ErpPlanningProjection["workOrders"];
    operations: ErpPlanningProjection["operations"];
    topBuffer: Buffer;
    detailsBuffer: Buffer;
  }): Promise<void> {
    const snapshotDirectory = path.join(localDataDirectory, "erp-imports", input.summary.id);
    await mkdir(snapshotDirectory, { recursive: true });
    await Promise.all([
      writeFile(path.join(snapshotDirectory, input.summary.files.find((file) => file.kind === "top")!.name), input.topBuffer, { flag: "wx", mode: 0o600 }),
      writeFile(path.join(snapshotDirectory, input.summary.files.find((file) => file.kind === "details")!.name), input.detailsBuffer, { flag: "wx", mode: 0o600 }),
      writeFile(path.join(snapshotDirectory, "metadata.json"), JSON.stringify(input.summary, null, 2), { flag: "wx", mode: 0o600 }),
    ]);
    this.projectionCache = null;
    await this.projection.update((current) => ({
      value: {
        version: ERP_IMPORT_VERSION,
        activeImportId: input.summary.id,
        imports: [input.summary, ...current.imports].slice(0, 100),
        workOrders: input.workOrders,
        operations: input.operations,
      },
      result: undefined,
    }));
    this.projectionCache = null;
  }

  async setOverride(operationId: string, patch: Partial<Omit<ErpManualOverride, "operationId" | "updatedAt">>): Promise<ErpManualOverride> {
    this.overridesCache = null;
    const result = await this.overrides.update((stored) => {
      const previous = stored.values[operationId];
      const next: ErpManualOverride = { ...previous, ...patch, operationId, updatedAt: new Date().toISOString() };
      stored.values[operationId] = next;
      return { value: stored, result: structuredClone(next) };
    });
    this.overridesCache = null;
    return result;
  }

  async setMachineMapping(erpMachineCode: string, machineId: string): Promise<ErpMachineMapping> {
    this.mappingsCache = null;
    const result = await this.mappings.update((stored) => {
      const mapping: ErpMachineMapping = { erpMachineCode, machineId, updatedAt: new Date().toISOString() };
      stored.values[erpMachineCode] = mapping;
      return { value: stored, result: structuredClone(mapping) };
    });
    this.mappingsCache = null;
    return result;
  }
}

function emptyProjection(): ErpPlanningProjection {
  return { version: ERP_IMPORT_VERSION, activeImportId: null, imports: [], workOrders: [], operations: [] };
}

function parseProjection(value: unknown): ErpPlanningProjection | null {
  if (!isRecord(value) || value.version !== ERP_IMPORT_VERSION || !Array.isArray(value.imports) || !Array.isArray(value.workOrders) || !Array.isArray(value.operations)) return null;
  if (value.activeImportId !== null && typeof value.activeImportId !== "string") return null;
  return value as unknown as ErpPlanningProjection;
}

function parseDictionary<T>(value: unknown, validator: (entry: unknown) => boolean): { version: 1; values: Record<string, T> } | null {
  if (!isRecord(value) || value.version !== 1 || !isRecord(value.values) || !Object.values(value.values).every(validator)) return null;
  return value as unknown as { version: 1; values: Record<string, T> };
}

function isManualOverride(value: unknown): boolean {
  return isRecord(value) && typeof value.operationId === "string" && typeof value.updatedAt === "string";
}

function isMachineMapping(value: unknown): boolean {
  return isRecord(value) && typeof value.erpMachineCode === "string" && typeof value.machineId === "string" && typeof value.updatedAt === "string";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export const erpImportRepository = new ErpImportRepository();
