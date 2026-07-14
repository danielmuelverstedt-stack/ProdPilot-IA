import type { DemoData } from "@/features/demo/types/demo";
import type { PlanningBlock, PlanningDay, PlanningMachine, PlanningViewModel } from "@/features/planning/types/planning";
import type { AppSettings, CapacitySettings, OrderedStandardSettings, StatusSettings } from "@/features/settings/types/settings";

const DAY_FORMATTER = new Intl.DateTimeFormat("fr-BE", { weekday: "short", timeZone: "UTC" });

export function buildPlanningView(data: DemoData, settings: AppSettings): PlanningViewModel {
  const production = settings.production;
  const days = buildMonthDays(data, production.planning.workingDays, production.planning.weekStartsOn, production.planning.visibleWeeks);
  const departments = production.departments.filter((item) => item.active).sort((a, b) => a.order - b.order);
  const departmentById = new Map(departments.map((department) => [department.id, department]));
  const machineData = new Map(data.machines.map((machine) => [machine.id, machine]));
  const machines: PlanningMachine[] = production.machines
    .filter((machine) => machine.active && departmentById.has(machine.departmentId))
    .sort((a, b) => a.order - b.order)
    .map((machine) => {
      const department = departmentById.get(machine.departmentId)!;
      return {
        id: machine.id,
        name: machine.name,
        displayName: machine.displayName,
        departmentId: department.id,
        department: department.label,
        departmentValue: department.value,
        color: machine.color || department.color,
        order: machine.order,
        capacityByDate: Object.fromEntries(days.map((day) => [day.date, resolveCapacity(machine.id, department.id, day.date, production.capacities, production.planning.defaultCapacityHours)])),
        status: machineData.get(machine.id)?.status ?? "",
        hasDetails: machineData.has(machine.id),
      };
    });

  const machineIds = new Set(machines.map((machine) => machine.id));
  const orderById = new Map(data.workOrders.map((order) => [order.id, order]));
  const statuses = production.statuses.filter((item) => item.active).sort((a, b) => a.order - b.order);
  const priorities = production.priorities.filter((item) => item.active).sort((a, b) => a.order - b.order);
  const taskTypes = production.taskTypes.filter((item) => item.active).sort((a, b) => a.order - b.order);
  const maintenanceTypes = production.maintenanceTypes.filter((item) => item.active).sort((a, b) => a.order - b.order);
  const maintenanceStatuses = production.maintenanceStatuses.filter((item) => item.active).sort((a, b) => a.order - b.order);
  const plannedStatus = statuses.find((item) => item.behavior === "planned") ?? statuses[0] ?? fallbackStatus(settings);
  const plannedMaintenanceStatus = maintenanceStatuses.find((item) => item.behavior === "planned") ?? maintenanceStatuses[0] ?? fallbackStatus(settings);

  const planningBlocks: PlanningBlock[] = data.planning.flatMap((plan) => {
    if (!machineIds.has(plan.machineId)) return [];
    const order = orderById.get(plan.workOrderId);
    const operation = order?.operations.find((item) => item.id === plan.operationId);
    if (!order || !operation) return [];
    const display = resolveStandard(plan.status, statuses, settings);
    const priority = resolvePriority(order.priority, priorities, settings);
    return [{
      id: plan.id,
      source: "work-order" as const,
      plan,
      order,
      operation,
      machineId: plan.machineId,
      date: plan.startAt.slice(0, 10),
      durationHours: Math.max(0.5, (Date.parse(plan.endAt) - Date.parse(plan.startAt)) / 3_600_000),
      status: plan.status,
      display,
      isBlocked: "behavior" in display && display.behavior === "blocked",
      comments: plan.comments,
      responsible: "",
      priority,
      hasMatchingArticle: data.workOrders.some((item) => item.id !== order.id && item.article === order.article),
    }];
  });
  const taskBlocks: PlanningBlock[] = data.maintenance.flatMap((maintenance) => {
    if (!machineIds.has(maintenance.machineId)) return [];
    const maintenanceStatus = resolveStandard(maintenance.status, maintenanceStatuses, settings);
    if ("behavior" in maintenanceStatus && maintenanceStatus.behavior === "completed") return [];
    const taskType = production.taskTypes.find((item) => item.id === maintenance.planningTypeId) ?? production.taskTypes.find((item) => item.value === maintenance.planningKind) ?? taskTypes[0];
    if (!taskType || !taskType.active) return [];
    const maintenanceType = production.maintenanceTypes.find((item) => item.id === maintenance.maintenanceTypeId) ?? production.maintenanceTypes.find((item) => item.value === maintenance.type) ?? null;
    return [{
      id: `task-${maintenance.id}`,
      source: "task" as const,
      maintenance,
      machineId: maintenance.machineId,
      date: maintenance.date.slice(0, 10),
      durationHours: maintenance.durationHours,
      status: taskType.value,
      display: taskType,
      isBlocked: false,
      comments: maintenance.comment,
      responsible: maintenance.responsible,
      label: maintenance.comment || maintenanceType?.label || taskType.label,
      priority: null,
      taskType,
      maintenanceType,
    }];
  });

  return {
    days,
    machines,
    blocks: [...planningBlocks, ...taskBlocks],
    weeks: [...new Set(days.map((day) => day.week))],
    departments,
    statuses,
    maintenanceStatuses,
    priorities,
    taskTypes,
    maintenanceTypes,
    plannedStatus,
    plannedMaintenanceStatus,
    allDepartmentsLabel: production.planning.allDepartmentsLabel,
    loadWarningPercent: production.planning.loadWarningPercent,
    loadCriticalPercent: production.planning.loadCriticalPercent,
    loadColors: { normal: settings.theme.success, warning: settings.theme.warning, critical: settings.theme.danger },
  };
}

function buildMonthDays(data: DemoData, workingDays: number[], weekStartsOn: number, visibleWeeks: number): PlanningDay[] {
  const firstPlanningDate = data.planning.map((item) => item.startAt.slice(0, 10)).sort()[0] ?? new Date().toISOString().slice(0, 10);
  const anchor = new Date(`${firstPlanningDate.slice(0, 7)}-01T00:00:00.000Z`);
  while (anchor.getUTCDay() !== weekStartsOn) anchor.setUTCDate(anchor.getUTCDate() + 1);
  const activeDays = [...new Set(workingDays)].filter((day) => day >= 0 && day <= 6);
  const orderedActiveDays = Array.from({ length: 7 }, (_, index) => (weekStartsOn + index) % 7).filter((day) => activeDays.includes(day));
  const lastWorkingDay = orderedActiveDays.at(-1);
  const expectedDays = Math.max(1, visibleWeeks) * Math.max(1, activeDays.length);
  const days: PlanningDay[] = [];
  while (days.length < expectedDays) {
    const weekDay = anchor.getUTCDay();
    if (activeDays.includes(weekDay)) {
      const date = anchor.toISOString().slice(0, 10);
      days.push({ date, dayLabel: capitalize(DAY_FORMATTER.format(anchor).replace(".", "")), dateLabel: new Intl.DateTimeFormat("fr-BE", { day: "2-digit", month: "2-digit", timeZone: "UTC" }).format(anchor), week: getIsoWeek(anchor), isWeekEnd: weekDay === lastWorkingDay });
    }
    anchor.setUTCDate(anchor.getUTCDate() + 1);
  }
  return days;
}

function resolveCapacity(machineId: string, departmentId: string, date: string, capacities: CapacitySettings[], fallbackHours: number): number {
  const active = capacities.filter((item) => item.active).sort((a, b) => a.order - b.order);
  const capacity = active.find((item) => item.scope === "machine" && item.targetId === machineId) ?? active.find((item) => item.scope === "department" && item.targetId === departmentId);
  if (!capacity) return fallbackHours;
  const exception = capacity.exceptions.find((item) => item.date === date);
  if (exception) return Math.max(0, exception.hours);
  const weekDay = new Date(`${date}T12:00:00.000Z`).getUTCDay();
  return capacity.workingDays.includes(weekDay) ? Math.max(0, capacity.hoursPerDay) : 0;
}

function resolveStandard<T extends OrderedStandardSettings>(value: string, standards: T[], settings: AppSettings): T | OrderedStandardSettings {
  return standards.find((item) => item.value === value) ?? { id: `unconfigured-${value}`, value, label: value, color: settings.theme.card, textColor: settings.theme.text, active: true, order: Number.MAX_SAFE_INTEGER };
}

function resolvePriority(value: string, priorities: AppSettings["production"]["priorities"], settings: AppSettings): AppSettings["production"]["priorities"][number] {
  return priorities.find((item) => item.value === value) ?? { id: `unconfigured-priority-${value}`, value, label: value, color: settings.theme.information, textColor: settings.theme.card, active: true, order: Number.MAX_SAFE_INTEGER, highlight: false };
}

function fallbackStatus(settings: AppSettings): StatusSettings {
  return { id: "fallback-status", value: "", label: "", color: settings.theme.card, textColor: settings.theme.text, active: true, order: Number.MAX_SAFE_INTEGER, behavior: "neutral" };
}

function getIsoWeek(date: Date): number {
  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  target.setUTCDate(target.getUTCDate() + 4 - (target.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  return Math.ceil((((target.getTime() - yearStart.getTime()) / 86_400_000) + 1) / 7);
}

function capitalize(value: string): string {
  return value.charAt(0).toLocaleUpperCase("fr") + value.slice(1);
}
