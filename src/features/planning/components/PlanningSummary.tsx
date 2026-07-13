import type { PlanningBlock, PlanningMachine } from "@/features/planning/types/planning";

export function PlanningSummary({ blocks, machines, days }: { blocks: PlanningBlock[]; machines: PlanningMachine[]; days: number }) {
  const overloads = machines.filter((machine) => blocks.filter((block) => block.machineId === machine.id).reduce((sum, block) => sum + block.durationHours, 0) > machine.capacityHours * days);
  const dailyOverloads = machines.reduce((count, machine) => count + [...new Set(blocks.filter((block) => block.machineId === machine.id).map((block) => block.date))].filter((date) => blocks.filter((block) => block.machineId === machine.id && block.date === date).reduce((sum, block) => sum + block.durationHours, 0) > machine.capacityHours).length, 0);
  const blocked = blocks.filter((block) => block.status === "Bloquée").length;
  if (!overloads.length && !blocked && !dailyOverloads) return null;
  const alerts = [blocked ? `${blocked} opération(s) bloquée(s)` : "", dailyOverloads ? `${dailyOverloads} journée(s) en surcharge` : "", overloads.length ? `surcharge période sur ${overloads.map((machine) => machine.id).join(", ")}` : ""].filter(Boolean);
  return <aside className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"><strong>Points d’attention :</strong> {alerts.join(" · ")}.</aside>;
}
