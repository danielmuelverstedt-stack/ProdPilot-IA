import type { ErpMachineMapping, ErpOperation, ErpPlanningWorkOrderSummary, ErpWorkOrder, OperationView, PlanningDecision } from "../types/erp-import.ts";
import { normalizeErpMachineCode } from "./erp-machine-code.ts";

export interface OperationViewInput {
  operations: ErpOperation[];
  decisions: PlanningDecision[];
  workOrders: Array<ErpWorkOrder | ErpPlanningWorkOrderSummary>;
  machineMappings?: Record<string, ErpMachineMapping>;
}

const UNDEFINED_MACHINE = "Non définie";

/** Frontière de lecture unique entre les données internes et les modules métier. */
export class OperationViewService {
  createViews(input: OperationViewInput): OperationView[] {
    const decisions = new Map(input.decisions.map((decision) => [decision.operationIdentity, decision]));
    const workOrders = new Map(input.workOrders.map((workOrder) => [workOrder.id, workOrder]));
    return input.operations.map((operation) => this.createView(
      operation,
      decisions.get(operation.stableId) ?? null,
      workOrders.get(operation.workOrderId) ?? null,
      input.machineMappings ?? {},
    ));
  }

  createView(operation: ErpOperation, decision: PlanningDecision | null, workOrder: ErpWorkOrder | ErpPlanningWorkOrderSummary | null, machineMappings: Record<string, ErpMachineMapping> = {}): OperationView {
    const plannedMachine = normalizeMachine(decision?.plannedMachineId);
    const hasMachineAssignmentOverride = decision?.hasMachineAssignmentOverride ?? plannedMachine !== null;
    const normalizedErpMachineCode = normalizeErpMachineCode(operation.erpMachineCode);
    const erpMachine = normalizeMachine(normalizedErpMachineCode ? machineMappings[normalizedErpMachineCode]?.machineId : null);
    const machineId = hasMachineAssignmentOverride ? plannedMachine : erpMachine;
    const hasUserPriority = decision?.userPriority !== null && decision?.userPriority !== undefined;
    const comment = decision?.comment ?? null;
    const manualOrder = decision?.manualOrder ?? null;
    return {
      id: operation.id,
      operationIdentity: operation.stableId,
      workOrderId: operation.workOrderId,
      operationNumber: operation.operationNumber,
      taskCode: operation.taskCode,
      articleCode: operation.articleCode,
      description: operation.description,
      subcontracted: operation.subcontracted,
      dueDate: operation.erpDueDate,
      actualStartAt: operation.actualStartAt,
      actualEndAt: operation.actualEndAt,
      status: decision?.planningStatus ?? operation.normalizedStatus,
      machine: machineId ?? UNDEFINED_MACHINE,
      machineId,
      priority: hasUserPriority ? decision!.userPriority! : operation.erpPriority,
      userPriority: decision?.userPriority ?? null,
      comment,
      manualOrder,
      plannedDurationHours: decision?.plannedDurationHours ?? 8,
      isLocked: decision?.locked ?? false,
      hasPlannedMachine: plannedMachine !== null,
      hasUserPriority,
      hasComment: Boolean(comment?.trim()),
      hasManualOrder: manualOrder !== null,
      isRemoved: operation.erpStatus === "Removed",
      isVisible: decision?.visible ?? true,
      isWithoutMachine: machineId === null,
      isLate: null,
      isStarted: null,
      isFinished: null,
      isBlocked: null,
      estimatedStart: null,
      estimatedEnd: null,
      capacityGroup: null,
      department: null,
      resourceGroup: normalizeBusinessValue(operation.macroRangeCode),
      workOrder,
      sourceMachineCode: operation.erpMachineCode,
      sourceMachineDescription: operation.erpMachineDescription,
      sourceMachineId: erpMachine,
      hasMachineDifference: hasMachineAssignmentOverride && plannedMachine !== erpMachine,
      erpMachineCode: operation.erpMachineCode,
      sourcePriority: operation.erpPriority,
      effectivePriority: hasUserPriority ? decision!.userPriority! : operation.erpPriority,
      sourceStatus: operation.normalizedStatus,
      effectiveStatus: decision?.planningStatus ?? operation.normalizedStatus,
      sourceOperationStatusId: operation.operationStatusId,
      sourceOrderStatus: operation.orderStatus,
      sourceMacroRangeCode: operation.macroRangeCode,
      sourceRow: operation.sourceRow,
      duplicateOf: operation.duplicateOf,
      plannedDate: decision?.plannedDate ?? operation.erpDueDate,
      delayDays: null,
      priorityScore: 0,
      articleWorkOrderCount: 1,
      hasManualOverride: decision !== null,
      issues: [],
    };
  }
}

function normalizeMachine(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  return normalized && normalized !== "0" ? normalized : null;
}

function normalizeBusinessValue(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  return normalized && normalized !== "0" ? normalized : null;
}

export const operationViewService = new OperationViewService();
