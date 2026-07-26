import type { DepartmentSettings } from "@/features/settings/types/settings";

/**
 * Navigation par onglets d'un département à l'autre dans l'Atelier, sur le même style de pilules
 * que la fiche machine, complétée d'un compteur d'OF par onglet, d'un onglet « ＋ » pour créer un
 * département (bordure pointillée, même gabarit) et d'une icône « ✎ » réservée à l'onglet actif
 * pour éditer ses catégories/machines liées.
 */
export function WorkshopDepartmentTabs({ departments, selectedDepartmentId, operationCountByDepartmentId, onSelect, onCreate, onEdit }: {
  departments: DepartmentSettings[];
  selectedDepartmentId: string | null;
  operationCountByDepartmentId: Map<string, number>;
  onSelect: (departmentId: string) => void;
  onCreate: () => void;
  onEdit: (departmentId: string) => void;
}) {
  return <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1">
    {departments.map((department) => {
      const isSelected = selectedDepartmentId === department.id;
      return <span key={department.id} className={`inline-flex shrink-0 items-center gap-1.5 rounded-full pl-3 pr-2 py-2 text-sm font-semibold ${isSelected ? "bg-[var(--app-primary)] text-white" : "border border-[var(--app-border)] bg-white"}`}>
        <button type="button" onClick={() => onSelect(department.id)} className="flex items-center gap-1.5">
          {department.label}
          <span className={`text-xs font-normal ${isSelected ? "text-white/80" : "text-slate-500"}`}>({(operationCountByDepartmentId.get(department.id) ?? 0).toLocaleString("fr-BE")})</span>
        </button>
        {isSelected ? <button type="button" aria-label={`Modifier le département ${department.label}`} className="rounded-full px-1 text-white/90 hover:text-white" onClick={() => onEdit(department.id)}>✎</button> : null}
      </span>;
    })}
    <button type="button" onClick={onCreate} className="shrink-0 rounded-full border border-dashed border-[var(--app-border)] bg-white px-3 py-2 text-sm font-semibold text-slate-500 hover:border-[var(--app-primary)] hover:text-[var(--app-primary)]">＋</button>
  </div>;
}
