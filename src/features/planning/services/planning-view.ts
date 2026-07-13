import type { DemoData } from "@/features/demo/types/demo";
import type { AppSettings } from "@/features/settings/types/settings";
import type {
  PlanningBlock,
  PlanningDay,
  PlanningMachine,
  PlanningViewModel,
} from "@/features/planning/types/planning";

const DAY_FORMATTER = new Intl.DateTimeFormat("fr-BE", {
  weekday: "short",
  timeZone: "UTC",
});

export function buildPlanningView(data: DemoData, settings: AppSettings): PlanningViewModel {
  const days = buildMonthDays(data);
  const machineData = new Map(data.machines.map((machine) => [machine.id, machine]));
  const machines: PlanningMachine[] = settings.production.machines
    .filter((machine) => machine.active)
    .map((machine) => ({
      id: machine.id,
      name: machine.name,
      displayName: machine.displayName,
      department: machine.department,
      capacityHours: getCapacity(machine.department, settings.production.capacities),
      status: machineData.get(machine.id)?.status ?? "Disponible",
      hasDetails: machineData.has(machine.id),
    }));

  const machineIds = new Set(machines.map((machine) => machine.id));
  const orderById = new Map(data.workOrders.map((order) => [order.id, order]));
  const planningBlocks: PlanningBlock[] = data.planning.flatMap((plan) => {
    if (!machineIds.has(plan.machineId)) return [];
    const order = orderById.get(plan.workOrderId);
    const operation = order?.operations.find((item) => item.id === plan.operationId);
    if (!order || !operation) return [];
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
      comments: plan.comments,
      responsible: "",
      priority: order.priority,
      hasMatchingArticle: data.workOrders.some((item) => item.id !== order.id && item.article === order.article && item.status !== "Terminé"),
    }];
  });
  const taskBlocks: PlanningBlock[] = data.maintenance.flatMap((maintenance) => {
    if (!machineIds.has(maintenance.machineId) || maintenance.status === "Terminée") return [];
    return [{
      id: `task-${maintenance.id}`,
      source: "task" as const,
      maintenance,
      machineId: maintenance.machineId,
      date: maintenance.date.slice(0, 10),
      durationHours: maintenance.durationHours,
      status: maintenance.planningKind ?? "Maintenance",
      comments: maintenance.comment,
      responsible: maintenance.responsible,
      label: maintenance.comment || maintenance.type,
      priority: null,
    }];
  });

  return {
    days,
    machines,
    blocks: [...planningBlocks, ...taskBlocks],
    weeks: [...new Set(days.map((day) => day.week))],
  };
}

function buildMonthDays(data: DemoData): PlanningDay[] {
  const firstPlanningDate = data.planning
    .map((item) => item.startAt.slice(0, 10))
    .sort()[0] ?? new Date().toISOString().slice(0, 10);
  const anchor = new Date(`${firstPlanningDate.slice(0, 7)}-01T00:00:00.000Z`);
  while (anchor.getUTCDay() !== 1) anchor.setUTCDate(anchor.getUTCDate() + 1);

  const days: PlanningDay[] = [];
  while (days.length < 20) {
    const weekDay = anchor.getUTCDay();
    if (weekDay >= 1 && weekDay <= 5) {
      const date = anchor.toISOString().slice(0, 10);
      days.push({
        date,
        dayLabel: capitalize(DAY_FORMATTER.format(anchor).replace(".", "")),
        dateLabel: new Intl.DateTimeFormat("fr-BE", {
          day: "2-digit",
          month: "2-digit",
          timeZone: "UTC",
        }).format(anchor),
        week: getIsoWeek(anchor),
        isFriday: weekDay === 5,
      });
    }
    anchor.setUTCDate(anchor.getUTCDate() + 1);
  }
  return days;
}

function getIsoWeek(date: Date): number {
  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  target.setUTCDate(target.getUTCDate() + 4 - (target.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  return Math.ceil((((target.getTime() - yearStart.getTime()) / 86_400_000) + 1) / 7);
}

function getCapacity(department: string, capacities: string[]): number {
  const configured = capacities.find((item) => item.toLocaleLowerCase("fr").startsWith(department.toLocaleLowerCase("fr")));
  const value = configured?.match(/(\d+(?:[,.]\d+)?)\s*h/i)?.[1]?.replace(",", ".");
  return value ? Number(value) : 8;
}

function capitalize(value: string): string {
  return value.charAt(0).toLocaleUpperCase("fr") + value.slice(1);
}
