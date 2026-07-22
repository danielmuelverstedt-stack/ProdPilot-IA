import type { ErpOperation, ErpSynchronizationReport, ErpWorkOrder } from "../types/erp-import.ts";

export interface SynchronizationInput {
  importId: string;
  startedAt: string;
  completedAt: string;
  previousWorkOrders: ErpWorkOrder[];
  previousOperations: ErpOperation[];
  incomingWorkOrders: ErpWorkOrder[];
  incomingOperations: ErpOperation[];
  decisionCount: number;
}

export interface SynchronizationResult {
  workOrders: ErpWorkOrder[];
  operations: ErpOperation[];
  report: ErpSynchronizationReport;
}

/** Centralise la fusion quotidienne ERP sans jamais modifier les décisions utilisateur. */
export class SynchronizationService {
  synchronize(input: SynchronizationInput): SynchronizationResult {
    const previousWorkOrderIds = new Set(input.previousWorkOrders.map((order) => order.id));
    const previousById = new Map(input.previousOperations.map((operation) => [operation.id, operation]));
    const incomingIds = new Set(input.incomingOperations.map((operation) => operation.id));
    let newOperations = 0;
    let updatedOperations = 0;

    const activeOperations = input.incomingOperations.map((operation) => {
      if (previousById.has(operation.id)) updatedOperations += 1;
      else newOperations += 1;
      return { ...operation, erpStatus: "Active" as const };
    });
    const removedOperations = input.previousOperations
      .filter((operation) => operation.erpStatus !== "Removed" && !incomingIds.has(operation.id))
      .map((operation) => ({ ...operation, erpStatus: "Removed" as const }));
    const alreadyRemoved = input.previousOperations.filter(
      (operation) => operation.erpStatus === "Removed" && !incomingIds.has(operation.id),
    );

    return {
      workOrders: input.incomingWorkOrders,
      operations: [...activeOperations, ...removedOperations, ...alreadyRemoved],
      report: {
        importId: input.importId,
        startedAt: input.startedAt,
        completedAt: input.completedAt,
        durationMs: Math.max(0, Date.parse(input.completedAt) - Date.parse(input.startedAt)),
        newWorkOrders: input.incomingWorkOrders.filter((order) => !previousWorkOrderIds.has(order.id)).length,
        newOperations,
        updatedOperations,
        removedOperations: removedOperations.length,
        preservedDecisions: input.decisionCount,
        lostDecisions: 0,
      },
    };
  }
}

export const synchronizationService = new SynchronizationService();
