import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { SerializedAtomicJsonFile } from "@/features/mail/server/accounts/serialized-atomic-json-file";
import type { ErpDecisionEvent, ErpImportReconciliationReport, ErpManualOverride, ErpOperation, PlanningDecision } from "@/features/erp-import/types/erp-import";

interface DecisionRegistry {
  version: 1;
  events: ErpDecisionEvent[];
  reports: ErpImportReconciliationReport[];
  migratedLegacyOverrides: boolean;
}

const mutableFields = ["plannedDate", "machineId", "priority", "manualOrder", "plannedDurationHours", "status", "comment", "visible", "locked"] as const;
type MutableField = (typeof mutableFields)[number];

class ErpDecisionRepository {
  private readonly file = new SerializedAtomicJsonFile<DecisionRegistry>({
    storageFile: path.join(process.cwd(), ".local-data", "user-decisions.json"),
    parse: parseRegistry,
    createDefault: () => ({ version: 1, events: [], reports: [], migratedLegacyOverrides: false }),
    normalize: (value) => value,
    readErrorMessage: "Le registre durable des décisions utilisateur est illisible.",
  });

  async migrateLegacyOverrides(values: Record<string, ErpManualOverride>, operations: ErpOperation[]): Promise<void> {
    const migrated = await this.file.update((registry) => {
      if (registry.migratedLegacyOverrides) return { value: registry, result: false };
      const byId = new Map(operations.map((operation) => [operation.id, operation]));
      for (const override of Object.values(values)) {
        const operation = byId.get(override.operationId);
        for (const field of mutableFields) {
          if (!(field in override)) continue;
          registry.events.push(createEvent({ operationId: override.operationId, stableOperationId: operation?.stableId ?? override.stableOperationId ?? override.operationId, field, previousValue: null, nextValue: override[field] ?? null, origin: "migration", occurredAt: override.updatedAt }));
        }
      }
      registry.migratedLegacyOverrides = true;
      return { value: registry, result: true };
    });
    if (migrated) await this.createAutomaticBackup();
  }

  async readOverrides(operations: ErpOperation[]): Promise<Record<string, ErpManualOverride>> {
    const registry = await this.file.read();
    const operationByStableId = uniqueOperationsByStableId(operations);
    const result: Record<string, ErpManualOverride> = {};
    for (const event of registry.events) {
      if (event.state !== "applied") continue;
      const operation = operationByStableId.get(event.stableOperationId);
      if (!operation) continue;
      const current = result[operation.id] ?? { operationId: operation.id, stableOperationId: operation.stableId, updatedAt: event.occurredAt };
      current[event.field] = event.nextValue as never;
      current.updatedAt = event.occurredAt;
      result[operation.id] = current;
    }
    return result;
  }

  async readPlanningDecisions(operations: ErpOperation[] = []): Promise<PlanningDecision[]> {
    const registry = await this.file.read();
    const byIdentity = new Map<string, PlanningDecision>();
    const identityCounts = new Map<string, number>();
    operations.forEach((operation) => identityCounts.set(operation.stableId, (identityCounts.get(operation.stableId) ?? 0) + 1));
    for (const event of registry.events) {
      if ((identityCounts.get(event.stableOperationId) ?? 1) > 1) continue;
      const current = byIdentity.get(event.stableOperationId) ?? {
        operationIdentity: event.stableOperationId,
        userPriority: null,
        manualOrder: null,
        plannedDurationHours: null,
        plannedMachineId: null,
        hasMachineAssignmentOverride: false,
        comment: null,
        visible: true,
        locked: false,
        plannedDate: null,
        planningStatus: null,
        createdAt: event.occurredAt,
        updatedAt: event.occurredAt,
      };
      if (event.field === "priority") current.userPriority = event.nextValue as number | null;
      if (event.field === "manualOrder") current.manualOrder = event.nextValue as number | null;
      if (event.field === "plannedDurationHours") current.plannedDurationHours = event.nextValue as number | null;
      if (event.field === "machineId") { current.plannedMachineId = event.nextValue as string | null; current.hasMachineAssignmentOverride = true; }
      if (event.field === "comment") current.comment = event.nextValue as string | null;
      if (event.field === "visible") current.visible = (event.nextValue as boolean | null) ?? true;
      if (event.field === "locked") current.locked = (event.nextValue as boolean | null) ?? false;
      if (event.field === "plannedDate") current.plannedDate = event.nextValue as string | null;
      if (event.field === "status") current.planningStatus = event.nextValue as PlanningDecision["planningStatus"];
      current.updatedAt = event.occurredAt;
      byIdentity.set(event.stableOperationId, current);
    }
    return [...byIdentity.values()];
  }

  async appendPatch(operation: ErpOperation, patch: Partial<Omit<ErpManualOverride, "operationId" | "stableOperationId" | "updatedAt">>, actorId = "local-user"): Promise<ErpManualOverride> {
    const result = await this.file.update((registry) => {
      const effective = projectStableOverride(registry.events, operation.stableId, operation.id);
      for (const field of mutableFields) {
        if (!(field in patch)) continue;
        const previousValue = effective[field] ?? null;
        const nextValue = patch[field] ?? null;
        if (Object.is(previousValue, nextValue)) continue;
        registry.events.push(createEvent({ operationId: operation.id, stableOperationId: operation.stableId, field, previousValue, nextValue, actorId }));
        effective[field] = nextValue as never;
      }
      effective.updatedAt = new Date().toISOString();
      return { value: registry, result: effective };
    });
    await this.createAutomaticBackup();
    return result;
  }

  async reconcile(importId: string, operations: ErpOperation[]): Promise<ErpImportReconciliationReport> {
    const report = await this.file.update((registry) => {
      const counts = new Map<string, number>();
      operations.forEach((operation) => counts.set(operation.stableId, (counts.get(operation.stableId) ?? 0) + 1));
      const latestByStableAndField = new Map<string, ErpDecisionEvent>();
      registry.events.forEach((event) => latestByStableAndField.set(`${event.stableOperationId}:${event.field}`, event));
      const explanations: ErpImportReconciliationReport["explanations"] = [];
      let restored = 0; let ambiguous = 0; let orphaned = 0; let inapplicable = 0;
      for (const event of latestByStableAndField.values()) {
        const count = counts.get(event.stableOperationId) ?? 0;
        event.state = count === 1 ? "applied" : count > 1 ? "ambiguous" : "orphaned";
        event.stateExplanation = count === 1 ? null : count > 1 ? "Plusieurs opérations correspondent à cette identité stable." : "L’opération n’existe plus dans le dernier import ERP.";
        if (event.state === "applied") restored += 1;
        else {
          if (event.state === "ambiguous") ambiguous += 1; else if (event.state === "orphaned") orphaned += 1; else inapplicable += 1;
          explanations.push({ decisionEventId: event.id, state: event.state, message: event.stateExplanation! });
        }
      }
      const report = { importId, createdAt: new Date().toISOString(), restored, ambiguous, orphaned, inapplicable, explanations };
      registry.reports.unshift(report);
      registry.reports = registry.reports.slice(0, 100);
      return { value: registry, result: report };
    });
    await this.createAutomaticBackup();
    return report;
  }

  async undo(operation: ErpOperation, actorId = "local-user"): Promise<ErpDecisionEvent | null> {
    const result = await this.file.update((registry) => {
      const reversedIds = new Set(registry.events.map((event) => event.reversesEventId).filter((id): id is string => Boolean(id)));
      const target = [...registry.events].reverse().find((event) => event.stableOperationId === operation.stableId && event.state === "applied" && event.origin !== "undo" && !reversedIds.has(event.id));
      if (!target) return { value: registry, result: null };
      const inverse = createEvent({ operationId: operation.id, stableOperationId: operation.stableId, field: target.field, previousValue: target.nextValue, nextValue: target.previousValue, actorId, origin: "undo" });
      inverse.reversesEventId = target.id;
      registry.events.push(inverse);
      return { value: registry, result: inverse };
    });
    if (result) await this.createAutomaticBackup();
    return result;
  }

  async redo(operation: ErpOperation, actorId = "local-user"): Promise<ErpDecisionEvent | null> {
    const result = await this.file.update((registry) => {
      const reversedUndoIds = new Set(registry.events.filter((event) => event.origin === "redo").map((event) => event.reversesEventId).filter((id): id is string => Boolean(id)));
      const undoEvent = [...registry.events].reverse().find((event) => event.stableOperationId === operation.stableId && event.origin === "undo" && !reversedUndoIds.has(event.id));
      if (!undoEvent) return { value: registry, result: null };
      const reapplied = createEvent({ operationId: operation.id, stableOperationId: operation.stableId, field: undoEvent.field, previousValue: undoEvent.nextValue, nextValue: undoEvent.previousValue, actorId, origin: "redo" });
      reapplied.reversesEventId = undoEvent.id;
      registry.events.push(reapplied);
      return { value: registry, result: reapplied };
    });
    if (result) await this.createAutomaticBackup();
    return result;
  }

  readRegistry(): Promise<DecisionRegistry> { return this.file.read(); }

  private async createAutomaticBackup(): Promise<void> {
    const registry = await this.file.read();
    const directory = path.join(process.cwd(), ".local-data", "backups", "decisions");
    await mkdir(directory, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    await writeFile(path.join(directory, `${stamp}-${randomUUID().slice(0, 8)}.json`), JSON.stringify(registry, null, 2), { flag: "wx", mode: 0o600 });
  }
}

function createEvent(input: { operationId: string; stableOperationId: string; field: MutableField; previousValue: string | number | boolean | null; nextValue: string | number | boolean | null; actorId?: string; origin?: ErpDecisionEvent["origin"]; occurredAt?: string }): ErpDecisionEvent {
  return { id: randomUUID(), occurredAt: input.occurredAt ?? new Date().toISOString(), actorId: input.actorId ?? "migration", companyId: "local-company", module: "erp-planning", origin: input.origin ?? "user", operationId: input.operationId, stableOperationId: input.stableOperationId, field: input.field, previousValue: input.previousValue, nextValue: input.nextValue, comment: null, state: "applied", stateExplanation: null, reversesEventId: null };
}

function projectStableOverride(events: ErpDecisionEvent[], stableId: string, operationId: string): ErpManualOverride {
  const result: ErpManualOverride = { operationId, stableOperationId: stableId, updatedAt: new Date(0).toISOString() };
  events.filter((event) => event.stableOperationId === stableId && event.state === "applied").forEach((event) => { result[event.field] = event.nextValue as never; result.updatedAt = event.occurredAt; });
  return result;
}

function uniqueOperationsByStableId(operations: ErpOperation[]): Map<string, ErpOperation> {
  const counts = new Map<string, number>();
  operations.forEach((operation) => counts.set(operation.stableId, (counts.get(operation.stableId) ?? 0) + 1));
  return new Map(operations.filter((operation) => counts.get(operation.stableId) === 1).map((operation) => [operation.stableId, operation]));
}

function parseRegistry(value: unknown): DecisionRegistry | null {
  if (!isRecord(value) || value.version !== 1 || !Array.isArray(value.events) || !Array.isArray(value.reports) || typeof value.migratedLegacyOverrides !== "boolean") return null;
  return value as unknown as DecisionRegistry;
}
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }

export const erpDecisionRepository = new ErpDecisionRepository();
