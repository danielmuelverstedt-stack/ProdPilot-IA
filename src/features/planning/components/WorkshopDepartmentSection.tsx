"use client";

import { WorkshopMachinePanel } from "@/features/planning/components/WorkshopMachinePanel";
import type { OperationView } from "@/features/erp-import/types/erp-import";
import type { CapacitySettings, MachineSettings } from "@/features/settings/types/settings";
import type { WorkshopColumnId, WorkshopDepartmentGroup, WorkshopRowsPerMachine, WorkshopSortColumn, WorkshopSortState } from "@/features/planning/types/workshop-view";

interface WorkshopDepartmentSectionProps {
  department: WorkshopDepartmentGroup;
  visibleColumnIds: WorkshopColumnId[];
  collapsedMachineIds: string[];
  rowsPerMachine: WorkshopRowsPerMachine;
  sort: WorkshopSortState;
  machines: MachineSettings[];
  capacities: CapacitySettings[];
  defaultCapacityHours: number;
  columnWidths: Partial<Record<WorkshopColumnId, number>>;
  busy: boolean;
  onToggleMachineCollapsed: (machineId: string) => void;
  onUpdatePriority: (operationId: string, priority: number) => void;
  onUpdateMachine: (operationId: string, machineId: string) => void;
  onUpdateStatus: (operationId: string, status: OperationView["status"]) => void;
  onReorderOperations: (orderedOperationIds: string[]) => void;
  onRenumberOperations: (orderedOperationIds: string[]) => void;
  onMoveColumn: (sourceId: WorkshopColumnId, targetId: WorkshopColumnId) => void;
  onResizeColumn: (columnId: WorkshopColumnId, width: number) => void;
  onCycleSort: (column: WorkshopSortColumn) => void;
  onPrint: (machine: MachineSettings | null, operations: OperationView[], totalOperationCount: number) => void;
}

export function WorkshopDepartmentSection({ department, visibleColumnIds, collapsedMachineIds, rowsPerMachine, sort, machines, capacities, defaultCapacityHours, columnWidths, busy, onToggleMachineCollapsed, onUpdatePriority, onUpdateMachine, onUpdateStatus, onReorderOperations, onRenumberOperations, onMoveColumn, onResizeColumn, onCycleSort, onPrint }: WorkshopDepartmentSectionProps) {
  // La section « direct » (voir buildWorkshopCategories) ne contient que des machines rattachées
  // individuellement au département actif : son identifiant suffit à savoir si le badge « Machine
  // liée directement » doit être affiché, sans faire redescendre la liste des id liés.
  const isDirectlyLinkedSection = department.id === "direct";
  const machineCount = department.machines.length;
  const operationCount = department.machines.reduce((total, group) => total + group.operationCount, 0);
  return <section className="space-y-1.5">
    <div className="flex flex-wrap items-center gap-2 rounded-lg bg-slate-900 px-2 py-1 text-white">
      <h2 className="text-xs font-bold">{department.label}</h2>
      <span className="text-[10px] text-slate-300">{machineCount.toLocaleString("fr-BE")} machine(s) · {operationCount.toLocaleString("fr-BE")} opération(s)</span>
    </div>
    <div className="space-y-1.5">
      {department.machines.map((group) => <WorkshopMachinePanel
        key={group.machine?.id ?? "unassigned"}
        group={group}
        visibleColumnIds={visibleColumnIds}
        isCollapsed={collapsedMachineIds.includes(group.machine?.id ?? "unassigned")}
        rowsPerMachine={rowsPerMachine}
        sort={sort}
        machines={machines}
        capacities={capacities}
        defaultCapacityHours={defaultCapacityHours}
        columnWidths={columnWidths}
        busy={busy}
        isDirectlyLinked={isDirectlyLinkedSection}
        onToggleCollapsed={onToggleMachineCollapsed}
        onUpdatePriority={onUpdatePriority}
        onUpdateMachine={onUpdateMachine}
        onUpdateStatus={onUpdateStatus}
        onReorderOperations={onReorderOperations}
        onRenumberOperations={onRenumberOperations}
        onMoveColumn={onMoveColumn}
        onResizeColumn={onResizeColumn}
        onCycleSort={onCycleSort}
        onPrint={onPrint}
      />)}
    </div>
  </section>;
}
