import "server-only";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { SerializedAtomicJsonFile } from "@/features/mail/server/accounts/serialized-atomic-json-file";
import { erpDecisionRepository } from "@/features/erp-import/server/erp-decision-repository";
import { synchronizationService } from "@/features/erp-import/services/synchronization-service";
import { ERP_IMPORT_VERSION, type ErpImportSummary, type ErpMachineMapping, type ErpManualOverride, type ErpPlanningProjection, type ErpSynchronizationReport, type PlanningDecision } from "@/features/erp-import/types/erp-import";

interface StoredOverrides { version: 1; values: Record<string, ErpManualOverride> }
interface StoredMappings { version: 1; values: Record<string, ErpMachineMapping> }
interface StoredSynchronizationReports { version: 1; values: ErpSynchronizationReport[] }

const localDataDirectory = path.join(process.cwd(), ".local-data");

class ErpImportRepository {
  private projectionCache: Promise<ErpPlanningProjection> | null = null;
  private overridesCache: Promise<Record<string, ErpManualOverride>> | null = null;
  private mappingsCache: Promise<Record<string, ErpMachineMapping>> | null = null;
  private decisionsCache: Promise<PlanningDecision[]> | null = null;
  private readonly projection = new SerializedAtomicJsonFile<ErpPlanningProjection>({
    storageFile: path.join(localDataDirectory, "erp-planning.json"),
    parse: parseProjection,
    createDefault: emptyProjection,
    normalize: normalizeProjection,
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
  private readonly synchronizationReports = new SerializedAtomicJsonFile<StoredSynchronizationReports>({
    storageFile: path.join(localDataDirectory, "erp-synchronization-reports.json"),
    parse: (value) => isRecord(value) && value.version === 1 && Array.isArray(value.values) ? value as unknown as StoredSynchronizationReports : null,
    createDefault: () => ({ version: 1, values: [] }),
    normalize: (value) => value,
    readErrorMessage: "Le registre local des rapports de synchronisation ERP est illisible.",
  });

  readProjection(): Promise<ErpPlanningProjection> {
    if (!this.projectionCache) this.projectionCache = this.projection.read().catch((error) => { this.projectionCache = null; throw error; });
    return this.projectionCache;
  }

  readOverrides(): Promise<Record<string, ErpManualOverride>> {
    if (!this.overridesCache) this.overridesCache = Promise.all([this.overrides.read(), this.readProjection()]).then(async ([stored, projection]) => {
      await erpDecisionRepository.migrateLegacyOverrides(stored.values, projection.operations);
      return erpDecisionRepository.readOverrides(projection.operations);
    }).catch((error) => { this.overridesCache = null; throw error; });
    return this.overridesCache;
  }

  readMappings(): Promise<Record<string, ErpMachineMapping>> {
    if (!this.mappingsCache) this.mappingsCache = this.mappings.read().then((stored) => stored.values).catch((error) => { this.mappingsCache = null; throw error; });
    return this.mappingsCache;
  }

  readPlanningDecisions(): Promise<PlanningDecision[]> {
    if (!this.decisionsCache) this.decisionsCache = this.readProjection().then((projection) => erpDecisionRepository.readPlanningDecisions(projection.operations)).catch((error) => { this.decisionsCache = null; throw error; });
    return this.decisionsCache;
  }

  async readSynchronizationReports(): Promise<ErpSynchronizationReport[]> {
    return (await this.synchronizationReports.read()).values;
  }

  async findDuplicate(combinedHash: string): Promise<ErpImportSummary | null> {
    const projection = await this.readProjection();
    return projection.imports.find((entry) => entry.files.map((file) => file.sha256).sort().join(":") === combinedHash) ?? null;
  }

  async activateImport(input: {
    summary: ErpImportSummary;
    workOrders: ErpPlanningProjection["workOrders"];
    operations: ErpPlanningProjection["operations"];
    topBuffer: Buffer;
    detailsBuffer: Buffer;
    startedAt: string;
  }): Promise<ErpSynchronizationReport> {
    const snapshotDirectory = path.join(localDataDirectory, "erp-imports", input.summary.id);
    await mkdir(snapshotDirectory, { recursive: true });
    await Promise.all([
      writeFile(path.join(snapshotDirectory, input.summary.files.find((file) => file.kind === "top")!.name), input.topBuffer, { flag: "wx", mode: 0o600 }),
      writeFile(path.join(snapshotDirectory, input.summary.files.find((file) => file.kind === "details")!.name), input.detailsBuffer, { flag: "wx", mode: 0o600 }),
      writeFile(path.join(snapshotDirectory, "metadata.json"), JSON.stringify(input.summary, null, 2), { flag: "wx", mode: 0o600 }),
    ]);
    this.projectionCache = null;
    const decisionCount = (await erpDecisionRepository.readPlanningDecisions((await this.readProjection()).operations)).length;
    const report = await this.projection.update((current) => {
      const synchronized = synchronizationService.synchronize({
        importId: input.summary.id,
        startedAt: input.startedAt,
        completedAt: new Date().toISOString(),
        previousWorkOrders: current.workOrders,
        previousOperations: current.operations,
        incomingWorkOrders: input.workOrders,
        incomingOperations: input.operations,
        decisionCount,
      });
      return { value: {
        version: ERP_IMPORT_VERSION,
        activeImportId: input.summary.id,
        imports: [input.summary, ...current.imports].slice(0, 100),
        workOrders: synchronized.workOrders,
        operations: synchronized.operations,
      },
      result: synchronized.report,
    }; });
    await this.synchronizationReports.update((stored) => ({ value: { version: 1, values: [report, ...stored.values].slice(0, 100) }, result: undefined }));
    this.projectionCache = null;
    this.overridesCache = null;
    this.decisionsCache = null;
    await erpDecisionRepository.reconcile(input.summary.id, input.operations);
    return report;
  }

  async setOverride(operationId: string, patch: Partial<Omit<ErpManualOverride, "operationId" | "updatedAt">>): Promise<ErpManualOverride> {
    this.overridesCache = null;
    this.decisionsCache = null;
    const projection = await this.readProjection();
    const operation = projection.operations.find((entry) => entry.id === operationId);
    if (!operation || operation.erpStatus === "Removed") throw new Error("L’opération ERP active est introuvable.");
    const result = await erpDecisionRepository.appendPatch(operation, patch);
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

function normalizeProjection(value: ErpPlanningProjection): ErpPlanningProjection {
  return {
    ...value,
    operations: value.operations.map((operation) => ({
      ...operation,
      stableId: typeof operation.stableId === "string" && operation.stableId ? operation.stableId : `${operation.workOrderId}::${operation.operationNumber}::${operation.taskCode}`,
      erpStatus: operation.erpStatus === "Removed" ? "Removed" : "Active",
    })),
  };
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
