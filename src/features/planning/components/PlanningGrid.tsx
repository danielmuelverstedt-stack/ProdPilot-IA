import { Fragment } from "react";
import styles from "@/features/planning/components/Planning.module.css";
import { MachinePlanningRow } from "@/features/planning/components/MachinePlanningRow";
import type { ErpOperationPlanningBlock, PlanningBlock, PlanningDay, PlanningMachine, WorkOrderPlanningBlock } from "@/features/planning/types/planning";
import type { TaskCategoryMachineGroup } from "@/lib/task-category-grouping";

export function PlanningGrid({ groups, collapsedCategoryCodes, onToggleCategoryCollapsed, days, blocks, canCreate, canEdit, canPrint, draggedId, dragOver, loadWarningPercent, loadCriticalPercent, loadColors, onDragStart, onDragEnd, onDragOver, onDrop, onAdd, onMove, onReorder, onPrint }: {
  groups: TaskCategoryMachineGroup<PlanningMachine>[];
  collapsedCategoryCodes: string[];
  onToggleCategoryCollapsed: (code: string) => void;
  days: PlanningDay[];
  blocks: PlanningBlock[];
  canCreate: boolean;
  canEdit: boolean;
  canPrint: boolean;
  draggedId: string | null;
  dragOver: string | null;
  loadWarningPercent: number;
  loadCriticalPercent: number;
  loadColors: { normal: string; warning: string; critical: string };
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onDragOver: (key: string) => void;
  onDrop: (machineId: string, date: string) => void;
  onAdd: (machineId: string, date: string) => void;
  onMove: (block: WorkOrderPlanningBlock | ErpOperationPlanningBlock) => void;
  onReorder: (id: string, direction: -1 | 1) => void;
  onPrint: (machineId: string) => void;
}) {
  const weekGroups = [...new Set(days.map((day) => day.week))].map((week) => ({ week, count: days.filter((day) => day.week === week).length }));
  const columnCount = 2 + days.length;
  return <div className={styles.planningCard}>
    <div className={styles.gridScroller}>
      <table className={styles.grid}>
        <thead>
          <tr><th rowSpan={2} className={`${styles.machineColumn} p-3 align-bottom`}>Machine</th>{weekGroups.map(({ week, count }) => <th key={week} colSpan={count} className={styles.weekHeader}>Semaine {week}</th>)}<th rowSpan={2} className={`${styles.chargeColumn} align-bottom`}>Charge<br />période</th></tr>
          <tr>{days.map((day) => <th key={day.date} className={`${styles.dayHeader} ${day.isWeekEnd ? styles.weekEnd : ""}`}>{day.dayLabel}<span className="block font-normal text-slate-400">{day.dateLabel}</span></th>)}</tr>
        </thead>
        <tbody>{groups.map((group) => {
          const key = group.code ?? "none";
          const isCollapsed = collapsedCategoryCodes.includes(key);
          return <Fragment key={`category-${key}`}>
            <tr className="bg-slate-50">
              <th colSpan={columnCount} className="p-2 text-left">
                <button type="button" aria-expanded={!isCollapsed} className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-700" onClick={() => onToggleCategoryCollapsed(key)}>
                  <span aria-hidden>{isCollapsed ? "▶" : "▼"}</span>{group.label}<span className="font-normal normal-case text-slate-500">({group.machines.length} machine{group.machines.length > 1 ? "s" : ""})</span>
                </button>
              </th>
            </tr>
            {!isCollapsed ? group.machines.map((machine) => <MachinePlanningRow key={machine.id} machine={machine} days={days} blocks={blocks.filter((block) => block.machineId === machine.id)} canCreate={canCreate} canEdit={canEdit} canPrint={canPrint} draggedId={draggedId} dragOver={dragOver} loadWarningPercent={loadWarningPercent} loadCriticalPercent={loadCriticalPercent} loadColors={loadColors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragOver={onDragOver} onDrop={onDrop} onAdd={onAdd} onMove={onMove} onReorder={onReorder} onPrint={onPrint} />) : null}
          </Fragment>;
        })}</tbody>
      </table>
    </div>
  </div>;
}
