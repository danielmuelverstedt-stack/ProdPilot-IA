import { fieldClass } from "@/components/ui/ModuleUi";
import type { PlanningFiltersState, PlanningMachine } from "@/features/planning/types/planning";

export function PlanningFilters({ filters, machines, onChange }: {
  filters: PlanningFiltersState;
  machines: PlanningMachine[];
  onChange: (next: Partial<PlanningFiltersState>) => void;
}) {
  return <div className="grid gap-2 border-t border-[var(--app-border)] pt-3 sm:grid-cols-3 lg:grid-cols-[minmax(180px,1fr)_1fr_1fr]">
    <label className="grid gap-1 text-xs font-semibold text-slate-600">Machine
      <select className={fieldClass} value={filters.machineId} onChange={(event) => onChange({ machineId: event.target.value })}>
        <option value="all">Toutes les machines</option>
        {machines.map((machine) => <option key={machine.id} value={machine.id}>{machine.id} · {machine.displayName}</option>)}
      </select>
    </label>
    <label className="grid gap-1 text-xs font-semibold text-slate-600">Client
      <input className={fieldClass} value={filters.customer} onChange={(event) => onChange({ customer: event.target.value })} placeholder="Rechercher un client" />
    </label>
    <label className="grid gap-1 text-xs font-semibold text-slate-600">OF
      <input className={fieldClass} value={filters.workOrder} onChange={(event) => onChange({ workOrder: event.target.value })} placeholder="Ex. OF-240184" />
    </label>
  </div>;
}
