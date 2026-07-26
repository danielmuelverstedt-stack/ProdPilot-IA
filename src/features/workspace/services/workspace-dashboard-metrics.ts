import type { ChartBar } from "@/components/ui/MiniBarChart";
import type { ChartPoint } from "@/components/ui/MiniAreaChart";
import type { DemoData, Machine, MaintenanceEvent, WorkOrder } from "@/features/demo/types/demo";

export interface MachineDowntimeEntry {
  machine: Machine;
  event: MaintenanceEvent | null;
}

/** Machines actuellement indisponibles (panne ou maintenance prévue), triées par date d’événement la plus proche. */
export function buildMachineDowntimeEntries(demo: DemoData, limit = 5): MachineDowntimeEntry[] {
  return demo.machines
    .filter((machine) => machine.status === "Maintenance prévue" || machine.status === "En panne")
    .map((machine) => ({
      machine,
      event: [...demo.maintenance].filter((item) => item.machineId === machine.id).sort((a, b) => a.date.localeCompare(b.date))[0] ?? null,
    }))
    .sort((a, b) => (a.event?.date ?? "").localeCompare(b.event?.date ?? ""))
    .slice(0, limit);
}

const WEEKDAY_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

/** Part des machines occupées par jour de la semaine (Lun→Dim), déduite des opérations planifiées en démonstration. */
export function buildWeeklyMachineOccupancy(demo: DemoData): ChartPoint[] {
  const totalMachines = demo.machines.length || 1;
  return WEEKDAY_LABELS.map((label, weekdayIndex) => {
    const occupiedMachineIds = new Set(
      demo.planning
        .filter((entry) => (new Date(entry.startAt).getUTCDay() + 6) % 7 === weekdayIndex)
        .map((entry) => entry.machineId),
    );
    return { label, value: Math.round((occupiedMachineIds.size / totalMachines) * 100) };
  });
}

/** Part des machines occupées par département, pour repérer les départements les plus chargés. */
export function buildDepartmentLoad(demo: DemoData): ChartBar[] {
  const machineIdsByDepartment = new Map<string, string[]>();
  demo.machines.forEach((machine) => {
    const list = machineIdsByDepartment.get(machine.department) ?? [];
    list.push(machine.id);
    machineIdsByDepartment.set(machine.department, list);
  });
  return [...machineIdsByDepartment.entries()].map(([department, machineIds]) => {
    const occupied = machineIds.filter((id) => demo.planning.some((entry) => entry.machineId === id)).length;
    return { label: department, value: machineIds.length ? Math.round((occupied / machineIds.length) * 100) : 0 };
  });
}

export interface WorkOrderTrackingTotals {
  planned: number;
  realized: number;
}

/** Quantité totale prévue vs quantité réalisée (au prorata de l’avancement) sur les OF en démonstration. */
export function buildWorkOrderTrackingTotals(demo: DemoData): WorkOrderTrackingTotals {
  const planned = demo.workOrders.reduce((sum, order) => sum + order.quantity, 0);
  const realized = demo.workOrders.reduce((sum, order) => sum + Math.round((order.quantity * order.progress) / 100), 0);
  return { planned, realized };
}

/** OF pas encore lancés ou bloqués, triés par échéance la plus proche : ce qui reste à planifier en priorité. */
export function buildUpcomingWorkOrders(demo: DemoData, limit = 4): WorkOrder[] {
  return [...demo.workOrders]
    .filter((order) => order.status === "À lancer" || order.status === "Bloqué")
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, limit);
}
