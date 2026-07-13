"use client";

import { useMemo, useState } from "react";
import { ModuleHeader, secondaryButton } from "@/components/ui/ModuleUi";
import { updateDemoData, useDemoData } from "@/features/demo/services/demo-repository";
import type { MaintenanceEvent, PlannedOperation } from "@/features/demo/types/demo";
import { PlanningFilters } from "@/features/planning/components/PlanningFilters";
import { PlanningGrid } from "@/features/planning/components/PlanningGrid";
import { PlanningMoveDialog } from "@/features/planning/components/PlanningMoveDialog";
import { PlanningOperationDialog, type PlanningCellTarget } from "@/features/planning/components/PlanningOperationDialog";
import { PlanningPrintView } from "@/features/planning/components/PlanningPrintView";
import { PlanningSummary } from "@/features/planning/components/PlanningSummary";
import { PlanningTaskDialog } from "@/features/planning/components/PlanningTaskDialog";
import { PlanningToolbar } from "@/features/planning/components/PlanningToolbar";
import { buildPlanningView } from "@/features/planning/services/planning-view";
import type { PlanningFiltersState, PlanningMoveTarget, WorkOrderPlanningBlock } from "@/features/planning/types/planning";
import { useSettings } from "@/features/settings/components/SettingsProvider";

const INITIAL_FILTERS: PlanningFiltersState = { department: "Tous", machineId: "all", customer: "", workOrder: "", week: "all" };

export function PlanningModule() {
  const data = useDemoData();
  const { settings } = useSettings();
  const view = useMemo(() => buildPlanningView(data, settings), [data, settings]);
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [moveTarget, setMoveTarget] = useState<PlanningMoveTarget | null>(null);
  const [addTarget, setAddTarget] = useState<PlanningCellTarget | null>(null);
  const [taskTarget, setTaskTarget] = useState<PlanningCellTarget | null>(null);
  const [printTarget, setPrintTarget] = useState<"all" | string | null>(null);
  const permission = settings.roles.find((role) => role.id === settings.activeRoleId)?.permissions.planning;
  const canCreate = permission?.create ?? false;
  const canEdit = permission?.edit ?? false;
  const canPrint = permission?.print ?? false;

  const days = filters.week === "all" ? view.days : view.days.filter((day) => day.week === filters.week);
  const machines = view.machines.filter((machine) =>
    (filters.department === "Tous" || machine.department === filters.department) &&
    (filters.machineId === "all" || machine.id === filters.machineId),
  );
  const blocks = view.blocks.filter((block) => {
    if (!machines.some((machine) => machine.id === block.machineId) || !days.some((day) => day.date === block.date)) return false;
    if (block.source === "task") return !filters.customer && !filters.workOrder;
    return block.order.customer.toLocaleLowerCase("fr").includes(filters.customer.trim().toLocaleLowerCase("fr")) &&
      block.order.id.toLocaleLowerCase("fr").includes(filters.workOrder.trim().toLocaleLowerCase("fr"));
  });
  const departments = settings.production.departments.filter((department) => view.machines.some((machine) => machine.department === department));

  if (printTarget) return <PlanningPrintView target={printTarget} machines={view.machines} blocks={view.blocks} settings={settings} onBack={() => setPrintTarget(null)} />;

  function handleDrop(machineId: string, date: string) {
    const block = view.blocks.find((item) => item.id === draggedId);
    setDragOver(null);
    setDraggedId(null);
    if (!block || block.source !== "work-order" || block.status === "Bloquée" || (block.machineId === machineId && block.date === date)) return;
    setMoveTarget({ block, machineId, date });
  }

  function handleMoveConfirm(machineId: string, date: string) {
    if (!moveTarget) return;
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
      status: "Planifiée",
      comments: "Ajouté depuis le planning",
    };
    updateDemoData((draft) => {
      draft.planning.push(plan);
      const order = draft.workOrders.find((item) => item.id === orderId);
      const operation = order?.operations.find((item) => item.id === operationId);
      if (operation) { operation.machineId = addTarget.machineId; operation.plannedDate = addTarget.date; operation.status = "Planifiée"; }
    });
    setAddTarget(null);
  }

  function handleTaskConfirm(value: { kind: "Maintenance" | "Divers"; machineId: string; date: string; label: string; durationHours: number; responsible: string }) {
    const event: MaintenanceEvent = {
      id: `MAINT-${Date.now()}`,
      machineId: value.machineId,
      type: value.kind === "Maintenance" ? "Préventive" : "Autre",
      date: `${value.date}T06:00:00.000Z`,
      durationHours: value.durationHours,
      responsible: value.responsible,
      status: "Prévue",
      comment: value.label,
      planningKind: value.kind,
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
    return view.blocks.filter((block) => block.machineId === machineId && block.date === date).reduce((sum, block) => sum + block.durationHours, 0);
  }

  function maintenanceConflict(machineId: string, date: string): string | null {
    const event = data.maintenance.find((item) => item.machineId === machineId && item.date.slice(0, 10) === date && item.status !== "Terminée");
    return event ? `${event.type} · ${event.durationHours.toLocaleString("fr-BE")} h · ${event.responsible || "responsable à définir"}` : null;
  }

  const defaultTaskTarget = { machineId: machines[0]?.id ?? view.machines[0]?.id ?? "", date: days[0]?.date ?? view.days[0]?.date ?? "" };
  return <div className="mx-auto max-w-[1500px]">
    <ModuleHeader eyebrow="Ordonnancement local" title="Planning" description="Planifiez les OF par machine et par jour, surveillez la charge et conservez les ajustements localement." actions={canPrint ? <button type="button" className={secondaryButton} onClick={() => setPrintTarget("all")}>Aperçu avant impression</button> : undefined} />
    <section className="mt-6 space-y-3 rounded-2xl border border-[var(--app-border)] bg-white p-4 shadow-sm print:hidden">
      <PlanningToolbar departments={departments} department={filters.department} weeks={view.weeks} week={filters.week} canCreate={canCreate} canPrint={canPrint} onDepartmentChange={(department) => setFilters((current) => ({ ...current, department, machineId: "all" }))} onWeekChange={(week) => setFilters((current) => ({ ...current, week }))} onTask={() => setTaskTarget(defaultTaskTarget)} onPrint={() => setPrintTarget("all")} />
      <PlanningFilters filters={filters} machines={view.machines.filter((machine) => filters.department === "Tous" || machine.department === filters.department)} onChange={(next) => setFilters((current) => ({ ...current, ...next }))} />
    </section>
    <div className="mt-4"><PlanningSummary blocks={blocks} machines={machines} days={days.length} /></div>
    <div className="mt-4">
      {machines.length ? <PlanningGrid machines={machines} days={days} blocks={blocks} canCreate={canCreate} canEdit={canEdit} canPrint={canPrint} draggedId={draggedId} dragOver={dragOver} onDragStart={setDraggedId} onDragEnd={() => { setDraggedId(null); setDragOver(null); }} onDragOver={(key) => setDragOver(key || null)} onDrop={handleDrop} onAdd={(machineId, date) => setAddTarget({ machineId, date })} onMove={(block) => setMoveTarget({ block, machineId: block.machineId, date: block.date })} onReorder={handleReorder} onPrint={setPrintTarget} /> : <p className="rounded-2xl border border-dashed border-[var(--app-border)] bg-white p-10 text-center text-sm text-slate-500">Aucune machine ne correspond aux filtres.</p>}
    </div>
    <p className="mt-2 text-xs text-slate-500">Glissez un bloc vers une autre case pour le replanifier, ou utilisez le bouton ↗. Les opérations bloquées ne sont pas déplaçables.</p>
    {moveTarget ? <PlanningMoveDialog target={moveTarget} machines={view.machines} days={view.days} currentLoad={currentLoad} maintenanceConflict={maintenanceConflict} onConfirm={handleMoveConfirm} onClose={() => setMoveTarget(null)} /> : null}
    {addTarget ? <PlanningOperationDialog target={addTarget} machine={view.machines.find((machine) => machine.id === addTarget.machineId)!} data={data} currentHours={currentLoad(addTarget.machineId, addTarget.date)} onConfirm={handleAddOperation} onTask={() => { setTaskTarget(addTarget); setAddTarget(null); }} onClose={() => setAddTarget(null)} /> : null}
    {taskTarget ? <PlanningTaskDialog initialTarget={taskTarget} machines={view.machines} days={view.days} onConfirm={handleTaskConfirm} onClose={() => setTaskTarget(null)} /> : null}
  </div>;
}
