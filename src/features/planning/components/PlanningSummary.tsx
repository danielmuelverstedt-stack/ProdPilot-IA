import type { PlanningBlock, PlanningMachine } from "@/features/planning/types/planning";

export function PlanningSummary({ blocks, machines, dates, warningColor }: { blocks: PlanningBlock[]; machines: PlanningMachine[]; dates: string[]; warningColor: string }) {
  const overloads = machines.filter((machine) => blocks.filter((block) => block.machineId === machine.id).reduce((sum, block) => sum + block.durationHours, 0) > dates.reduce((sum, date) => sum + (machine.capacityByDate[date] ?? 0), 0));
  const dailyOverloads = machines.reduce((count, machine) => count + dates.filter((date) => blocks.filter((block) => block.machineId === machine.id && block.date === date).reduce((sum, block) => sum + block.durationHours, 0) > (machine.capacityByDate[date] ?? 0)).length, 0);
  const blocked = blocks.filter((block) => block.isBlocked).length;
  if (!overloads.length && !blocked && !dailyOverloads) return null;
  const alerts = [blocked ? `${blocked} opération(s) bloquée(s)` : "", dailyOverloads ? `${dailyOverloads} journée(s) en surcharge` : "", overloads.length ? `surcharge période sur ${overloads.map((machine) => machine.id).join(", ")}` : ""].filter(Boolean);
  return <aside className="rounded-xl border px-4 py-3 text-sm" style={{ borderColor: warningColor, background: `color-mix(in srgb, ${warningColor} 10%, white)`, color: warningColor }}><strong>Points d’attention :</strong> {alerts.join(" · ")}.</aside>;
}
