import { primaryButton, secondaryButton } from "@/components/ui/ModuleUi";
import { DepartmentTabs } from "@/features/planning/components/DepartmentTabs";

const LEGEND = [
  ["var(--app-primary)", "En cours"], ["#e2e8f0", "Planifiée"], ["#fbbf24", "Réglage"],
  ["#fee2e2", "Bloquée"], ["#7c3aed", "Maintenance"], ["#0d9488", "Divers"],
] as const;

export function PlanningToolbar({ departments, department, weeks, week, canCreate, canPrint, onDepartmentChange, onWeekChange, onTask, onPrint }: {
  departments: string[];
  department: string;
  weeks: number[];
  week: "all" | number;
  canCreate: boolean;
  canPrint: boolean;
  onDepartmentChange: (value: string) => void;
  onWeekChange: (value: "all" | number) => void;
  onTask: () => void;
  onPrint: () => void;
}) {
  return <div className="flex flex-wrap items-center gap-2">
    <DepartmentTabs departments={departments} value={department} onChange={onDepartmentChange} />
    <select aria-label="Période du planning" className="min-h-8 rounded-lg border border-[var(--app-border)] bg-white px-2 text-xs" value={week} onChange={(event) => onWeekChange(event.target.value === "all" ? "all" : Number(event.target.value))}>
      <option value="all">Mois complet (S{weeks[0]}–S{weeks.at(-1)})</option>
      {weeks.map((item) => <option key={item} value={item}>Semaine {item}</option>)}
    </select>
    {canCreate ? <button type="button" className={`${primaryButton} min-h-8 px-3 text-xs`} onClick={onTask}>🔧 Maintenance / tâche libre</button> : null}
    {canPrint ? <button type="button" className={`${secondaryButton} min-h-8 px-3 text-xs`} onClick={onPrint}>Imprimer tout</button> : null}
    <div className="ml-auto flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-600" aria-label="Légende">
      {LEGEND.map(([color, label]) => <span key={label} className="inline-flex items-center gap-1"><i className="h-3 w-3 rounded" style={{ background: color }} />{label}</span>)}
    </div>
  </div>;
}
