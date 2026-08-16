"use client";

import { useMemo, useState } from "react";
import { ModuleHeader, secondaryButton } from "@/components/ui/ModuleUi";
import { updateDemoData, useDemoData } from "@/features/demo/services/demo-repository";
import type { MaintenanceEvent, PlannedOperation } from "@/features/demo/types/demo";
import { TaskCategoryVisibilityControl } from "@/features/erp-import/components/TaskCategoryVisibilityControl";
import { useErpImportActive } from "@/features/planning/hooks/useErpImportActive";
import { useWorkshopOperations } from "@/features/planning/hooks/useWorkshopOperations";
import { PlanningFilters } from "@/features/planning/components/PlanningFilters";
import { PlanningGrid } from "@/features/planning/components/PlanningGrid";
import { PlanningMoveDialog } from "@/features/planning/components/PlanningMoveDialog";
import { PlanningOperationDialog, type PlanningCellTarget } from "@/features/planning/components/PlanningOperationDialog";
import { PlanningPrintView } from "@/features/planning/components/PlanningPrintView";
import { PlanningSummary } from "@/features/planning/components/PlanningSummary";
import { PlanningTaskDialog, type PlanningTaskInput } from "@/features/planning/components/PlanningTaskDialog";
import { PlanningToolbar } from "@/features/planning/components/PlanningToolbar";
import { buildPlanningView, sumDurationHours } from "@/features/planning/services/planning-view";
import { buildDepartmentOperationIndex, resolveDepartmentMachineIds } from "@/features/planning/services/workshop-view-service";
import type { PlanningFiltersState, PlanningMoveTarget, WorkOrderPlanningBlock } from "@/features/planning/types/planning";
import { useSettings } from "@/features/settings/components/SettingsProvider";
import type { TaskCategoryMachineGroup } from "@/lib/task-category-grouping";
import { setVisibleTaskCategoryCodes, useVisibleTaskCategoryCodes } from "@/lib/visible-task-categories-store";

const INITIAL_FILTERS: PlanningFiltersState = { department: "all", machineId: "all", customer: "", workOrder: "", week: "all" };

export function PlanningModule() {
  const data = useDemoData();
  const { settings } = useSettings();
  // Le sélecteur de catégories reste le réglage partagé avec l'Atelier. Toutes les opérations
  // restent disponibles pour résoudre fidèlement les rattachements de chaque département.
  const visibleTaskCategoryCodes = useVisibleTaskCategoryCodes();
  const { allRows, updatePlacement } = useWorkshopOperations(settings.production.machines, visibleTaskCategoryCodes);
  const { hasActiveImport } = useErpImportActive();
  const view = useMemo(() => buildPlanningView(data, settings, allRows, hasActiveImport), [data, settings, allRows, hasActiveImport]);
  const departmentOperationIndex = useMemo(() => buildDepartmentOperationIndex(allRows), [allRows]);
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [moveTarget, setMoveTarget] = useState<PlanningMoveTarget | null>(null);
  const [addTarget, setAddTarget] = useState<PlanningCellTarget | null>(null);
  const [taskTarget, setTaskTarget] = useState<PlanningCellTarget | null>(null);
  const [printTarget, setPrintTarget] = useState<"all" | string | null>(null);
  const [collapsedCategoryCodes, setCollapsedCategoryCodes] = useState<string[]>([]);
  function toggleCategoryCollapsed(code: string) {
    setCollapsedCategoryCodes((current) => current.includes(code) ? current.filter((entry) => entry !== code) : [...current, code]);
  }
  function updateVisibleTaskCategoryCodes(codes: string[]) {
    setVisibleTaskCategoryCodes(codes);
  }
  const permission = settings.roles.find((role) => role.id === settings.activeRoleId)?.permissions.planning;
  const canCreate = permission?.create ?? false;
  const canEdit = permission?.edit ?? false;
  const canPrint = permission?.print ?? false;

  const days = filters.week === "all" ? view.days : view.days.filter((day) => day.week === filters.week);
  const departmentMachineIds = useMemo(() => new Map(view.departments.map((department) => [department.id, resolveDepartmentMachineIds(departmentOperationIndex, settings.production.machines, department)])), [departmentOperationIndex, settings.production.machines, view.departments]);
  const machines = view.machines.filter((machine) =>
    (filters.department === "all" || departmentMachineIds.get(filters.department)?.has(machine.id)) &&
    (filters.machineId === "all" || machine.id === filters.machineId),
  );
  const groups = useMemo<TaskCategoryMachineGroup<(typeof machines)[number]>[]>(() => {
    const departmentsToShow = filters.department === "all" ? view.departments : view.departments.filter((department) => department.id === filters.department);
    return departmentsToShow.flatMap((department) => {
      const machineIds = departmentMachineIds.get(department.id) ?? new Set<string>();
      const matchingMachines = machines.filter((machine) => machineIds.has(machine.id));
      return matchingMachines.length ? [{ code: `department:${department.id}`, label: department.label, machines: matchingMachines }] : [];
    });
  }, [departmentMachineIds, filters.department, machines, view.departments]);
  const visibleMachineCount = groups.reduce((sum, group) => sum + group.machines.length, 0);
  const blocks = view.blocks.filter((block) => {
    if (!machines.some((machine) => machine.id === block.machineId) || !days.some((day) => day.date === block.date)) return false;
    if (block.source === "task") return !filters.customer && !filters.workOrder;
    const customer = block.source === "work-order" ? block.order.customer : (block.operationView.workOrder?.customerName ?? "");
    const workOrderId = block.source === "work-order" ? block.order.id : block.operationView.workOrderId;
    return customer.toLocaleLowerCase("fr").includes(filters.customer.trim().toLocaleLowerCase("fr")) &&
      workOrderId.toLocaleLowerCase("fr").includes(filters.workOrder.trim().toLocaleLowerCase("fr"));
  });
  const departments = view.departments;

  if (printTarget) return <PlanningPrintView target={printTarget} machines={view.machines} blocks={view.blocks} settings={settings} onBack={() => setPrintTarget(null)} />;

  function handleDrop(machineId: string, date: string) {
    const block = view.blocks.find((item) => item.id === draggedId);
    setDragOver(null);
    setDraggedId(null);
    if (!block || block.source === "task" || block.isBlocked || (block.machineId === machineId && block.date === date)) return;
    setMoveTarget({ block, machineId, date });
  }

  function handleMoveConfirm(machineId: string, date: string) {
    if (!moveTarget) return;
    if (moveTarget.block.source === "erp-operation") {
      void updatePlacement(moveTarget.block.operationView.id, { machineId, plannedDate: date });
      setMoveTarget(null);
      return;
    }
    updateDemoData((draft) => {
      const plan = draft.planning.find((item) => item.id === moveTarget.block.id);
      if (!plan) return;
      const duration = Date.parse(plan.endAt) - Date.parse(plan.startAt);
      const start = new Date(`${date}T06:00:00.000Z`);
      plan.machineId = machineId;
      plan.startAt = start.toISOString();
      plan.endAt = new Date(start.getTime() + duration).toISOString();
      const order = draft.workOrders.find((item) => item.id === plan.workOrderId);
      const operation = order?.operations.find((item) => item.id === plan.operationId);
      if (operation) { operation.machineId = machineId; operation.plannedDate = date; }
    });
    setMoveTarget(null);
  }

  function handleAddOperation(orderId: string, operationId: string, durationHours: number) {
    if (!addTarget) return;
    const plan: PlannedOperation = {
      id: `plan-${Date.now()}`,
      workOrderId: orderId,
      operationId,
      machineId: addTarget.machineId,
      startAt: `${addTarget.date}T06:00:00.000Z`,
      endAt: new Date(Date.parse(`${addTarget.date}T06:00:00.000Z`) + durationHours * 3_600_000).toISOString(),
      status: view.plannedStatus.value,
      comments: "",
    };
    updateDemoData((draft) => {
      draft.planning.push(plan);
      const order = draft.workOrders.find((item) => item.id === orderId);
      const operation = order?.operations.find((item) => item.id === operationId);
      if (operation) { operation.machineId = addTarget.machineId; operation.plannedDate = addTarget.date; operation.status = view.plannedStatus.value; }
    });
    setAddTarget(null);
  }

  function handleTaskConfirm(value: PlanningTaskInput) {
    const taskType = view.taskTypes.find((item) => item.id === value.taskTypeId);
    const maintenanceType = view.maintenanceTypes.find((item) => item.id === value.maintenanceTypeId);
    if (!taskType) return;
    const event: MaintenanceEvent = {
      id: `MAINT-${Date.now()}`,
      machineId: value.machineId,
      type: maintenanceType?.value ?? taskType.value,
      date: `${value.date}T06:00:00.000Z`,
      durationHours: value.durationHours,
      responsible: value.responsible,
      status: view.plannedMaintenanceStatus.value,
      comment: value.label,
      planningTypeId: taskType.id,
      maintenanceTypeId: maintenanceType?.id,
    };
    updateDemoData((draft) => { draft.maintenance.push(event); });
    setTaskTarget(null);
  }

  function handleReorder(id: string, direction: -1 | 1) {
    const block = view.blocks.find((item) => item.id === id);
    if (!block || block.source !== "work-order") return;
    const siblings = view.blocks.filter((item): item is WorkOrderPlanningBlock => item.source === "work-order" && item.machineId === block.machineId && item.date === block.date);
    const siblingIndex = siblings.findIndex((item) => item.id === id);
    const target = siblings[siblingIndex + direction];
    if (!target) return;
    if (!window.confirm(`Réordonner ${block.order.id} ${direction < 0 ? "avant" : "après"} ${target.order.id} ?`)) return;
    updateDemoData((draft) => {
      const first = draft.planning.findIndex((item) => item.id === id);
      const second = draft.planning.findIndex((item) => item.id === target.id);
      if (first >= 0 && second >= 0) [draft.planning[first], draft.planning[second]] = [draft.planning[second], draft.planning[first]];
    });
  }

  function currentLoad(machineId: string, date: string): number {
    return sumDurationHours(view.blocks.filter((block) => block.machineId === machineId && block.date === date));
  }

  function maintenanceConflict(machineId: string, date: string): string | null {
    const completedValues = new Set(view.maintenanceStatuses.filter((item) => item.behavior === "completed").map((item) => item.value));
    const event = data.maintenance.find((item) => item.machineId === machineId && item.date.slice(0, 10) === date && !completedValues.has(item.status));
    const typeLabel = event ? view.maintenanceTypes.find((item) => item.id === event.maintenanceTypeId || item.value === event.type)?.label ?? event.type : "";
    return event ? `${typeLabel} · ${event.durationHours.toLocaleString("fr-BE")} h · ${event.responsible || "responsable à définir"}` : null;
  }

  const defaultTaskTarget = { machineId: machines[0]?.id ?? view.machines[0]?.id ?? "", date: days[0]?.date ?? view.days[0]?.date ?? "" };
  return <div className="mx-auto max-w-[1500px]">
    <ModuleHeader eyebrow="Ordonnancement local" title="Planning" description={hasActiveImport ? "Affiche les opérations ERP réelles par machine et par jour ; les OF de démonstration sont masqués tant qu'un import est actif." : "Planifiez les OF de démonstration par machine et par jour, surveillez la charge et conservez les ajustements localement."} actions={canPrint ? <button type="button" className={secondaryButton} onClick={() => setPrintTarget("all")}>Aperçu avant impression</button> : undefined} />
    <section className="mt-6 space-y-3 rounded-2xl border border-[var(--app-border)] bg-white p-4 shadow-sm print:hidden">
      <PlanningToolbar departments={departments} allDepartmentsLabel={view.allDepartmentsLabel} legend={[...view.statuses, ...view.taskTypes]} department={filters.department} weeks={view.weeks} week={filters.week} canCreate={canCreate} canPrint={canPrint} onDepartmentChange={(department) => setFilters((current) => ({ ...current, department, machineId: "all" }))} onWeekChange={(week) => setFilters((current) => ({ ...current, week }))} onTask={() => setTaskTarget(defaultTaskTarget)} onPrint={() => setPrintTarget("all")} />
      <PlanningFilters filters={filters} machines={view.machines.filter((machine) => filters.department === "all" || departmentMachineIds.get(filters.department)?.has(machine.id))} onChange={(next) => setFilters((current) => ({ ...current, ...next }))} />
      <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-3">
        <TaskCategoryVisibilityControl visibleTaskCategoryCodes={visibleTaskCategoryCodes} onChange={updateVisibleTaskCategoryCodes} />
        <span className="text-xs text-slate-500">Catégories, machines et rattachements partagés avec le Planning Atelier.</span>
      </div>
    </section>
    <div className="mt-4"><PlanningSummary blocks={blocks} machines={machines} dates={days.map((day) => day.date)} warningColor={view.loadColors.warning} /></div>
    <div className="mt-4">
      {visibleMachineCount ? <PlanningGrid groups={groups} collapsedCategoryCodes={collapsedCategoryCodes} onToggleCategoryCollapsed={toggleCategoryCollapsed} days={days} blocks={blocks} canCreate={canCreate && !hasActiveImport} canEdit={canEdit} canPrint={canPrint} draggedId={draggedId} dragOver={dragOver} loadWarningPercent={view.loadWarningPercent} loadCriticalPercent={view.loadCriticalPercent} loadColors={view.loadColors} onDragStart={setDraggedId} onDragEnd={() => { setDraggedId(null); setDragOver(null); }} onDragOver={(key) => setDragOver(key || null)} onDrop={handleDrop} onAdd={(machineId, date) => setAddTarget({ machineId, date })} onMove={(block) => setMoveTarget({ block, machineId: block.machineId, date: block.date })} onReorder={handleReorder} onPrint={setPrintTarget} /> : <p className="rounded-2xl border border-dashed border-[var(--app-border)] bg-white p-10 text-center text-sm text-slate-500">Aucune machine du Planning Atelier ne correspond aux filtres.</p>}
    </div>
    <p className="mt-2 text-xs text-slate-500">Glissez un bloc vers une autre case pour le replanifier, ou utilisez le bouton ↗. Les opérations bloquées ne sont pas déplaçables.</p>
    {moveTarget ? <PlanningMoveDialog target={moveTarget} machines={view.machines} days={view.days} currentLoad={currentLoad} maintenanceConflict={maintenanceConflict} loadColors={view.loadColors} onConfirm={handleMoveConfirm} onClose={() => setMoveTarget(null)} /> : null}
    {addTarget ? <PlanningOperationDialog target={addTarget} machine={view.machines.find((machine) => machine.id === addTarget.machineId)!} data={data} currentHours={currentLoad(addTarget.machineId, addTarget.date)} priorities={view.priorities} statuses={view.statuses} onConfirm={handleAddOperation} onTask={() => { setTaskTarget(addTarget); setAddTarget(null); }} onClose={() => setAddTarget(null)} /> : null}
    {taskTarget ? <PlanningTaskDialog initialTarget={taskTarget} machines={view.machines} days={view.days} taskTypes={view.taskTypes} maintenanceTypes={view.maintenanceTypes} onConfirm={handleTaskConfirm} onClose={() => setTaskTarget(null)} /> : null}
  </div>;
}
