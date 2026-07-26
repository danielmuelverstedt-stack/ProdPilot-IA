"use client";

import { useState, type ReactNode } from "react";
import { fieldClass, secondaryButton } from "@/components/ui/ModuleUi";
import { TaskCategoryVisibilityControl } from "@/features/erp-import/components/TaskCategoryVisibilityControl";
import { emptyPlanningFilters } from "@/features/erp-import/services/erp-planning-view-preferences";
import type { PlanningFilterOptions } from "@/features/erp-import/services/filter-engine";
import type { PlanningFilters, PlanningTechnicalState } from "@/features/erp-import/types/erp-planning-view";

interface PlanningFilterPanelProps {
  filters: PlanningFilters;
  options: PlanningFilterOptions;
  resultCount: number;
  totalCount: number;
  visibleTaskCategoryCodes: string[];
  onChange: (filters: PlanningFilters) => void;
  onChangeVisibleTaskCategoryCodes: (codes: string[]) => void;
}

/**
 * Barre de filtres horizontale, repliée par défaut (sur le modèle du Planning Atelier) :
 * recherche, catégories et compteur toujours visibles ; le détail (clients, machines,
 * priorités, statuts, état technique) s'ouvre à la demande au lieu d'occuper en permanence
 * une colonne latérale.
 */
export function PlanningFilterPanel({ filters, options, resultCount, totalCount, visibleTaskCategoryCodes, onChange, onChangeVisibleTaskCategoryCodes }: PlanningFilterPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const patch = (value: Partial<PlanningFilters>) => onChange({ ...filters, ...value });
  return <section className="rounded-2xl border border-[var(--app-border)] bg-white p-3">
    <div className="flex flex-wrap items-center gap-3">
      <button type="button" className={secondaryButton} aria-expanded={isOpen} onClick={() => setIsOpen((current) => !current)}>{isOpen ? "Fermer les filtres" : "Filtres"}</button>
      <input className={`${fieldClass} min-w-[220px] flex-1`} value={filters.search} onChange={(event) => patch({ search: event.target.value })} placeholder="OF, article, description, client" />
      <TaskCategoryVisibilityControl visibleTaskCategoryCodes={visibleTaskCategoryCodes} onChange={onChangeVisibleTaskCategoryCodes} />
      <span className="whitespace-nowrap text-xs text-slate-500">{resultCount.toLocaleString("fr-BE")} sur {totalCount.toLocaleString("fr-BE")} opérations</span>
      <button type="button" className={secondaryButton} onClick={() => onChange(emptyPlanningFilters())}>Tout effacer</button>
    </div>
    {isOpen ? <div className="mt-3 flex flex-wrap gap-x-8 gap-y-3 border-t border-slate-100 pt-3">
      <FilterGroup title="Clients"><ChoiceList values={options.clients} selected={filters.clients} onChange={(clients) => patch({ clients })} /></FilterGroup>
      <FilterGroup title="Départements"><ChoiceList values={options.departments} selected={filters.departments} onChange={(departments) => patch({ departments })} /></FilterGroup>
      <FilterGroup title="Groupes de ressources"><ChoiceList values={options.resourceGroups} selected={filters.resourceGroups} onChange={(resourceGroups) => patch({ resourceGroups })} /></FilterGroup>
      <FilterGroup title="Machines"><ChoiceList values={options.machines} selected={filters.machines} onChange={(machines) => patch({ machines })} /></FilterGroup>
      <FilterGroup title="Priorités ERP"><ChoiceList values={options.erpPriorities} selected={filters.erpPriorities} onChange={(erpPriorities) => patch({ erpPriorities })} /></FilterGroup>
      <FilterGroup title="Priorités utilisateur"><ChoiceList values={options.userPriorities} selected={filters.userPriorities} onChange={(userPriorities) => patch({ userPriorities })} /></FilterGroup>
      <FilterGroup title="IDOperation_Status"><ChoiceList values={options.erpStatusIds} selected={filters.erpStatusIds} onChange={(erpStatusIds) => patch({ erpStatusIds })} /></FilterGroup>
      <FilterGroup title="Status ERP"><ChoiceList values={options.erpStatuses} selected={filters.erpStatuses} onChange={(erpStatuses) => patch({ erpStatuses })} /></FilterGroup>
      <FilterGroup title="État technique"><ChoiceList values={TECHNICAL_STATES.map((entry) => entry.value)} selected={filters.technicalStates} labels={Object.fromEntries(TECHNICAL_STATES.map((entry) => [entry.value, entry.label]))} onChange={(technicalStates) => patch({ technicalStates })} /></FilterGroup>
    </div> : null}
  </section>;
}

function FilterGroup({ title, children }: { title: string; children: ReactNode }) {
  return <div className="w-44 shrink-0"><p className="mb-1 text-xs font-semibold uppercase text-slate-500">{title}</p>{children}</div>;
}

function ChoiceList<T extends string | number>({ values, selected, labels, onChange }: { values: T[]; selected: T[]; labels?: Record<string, string>; onChange: (values: T[]) => void }) {
  if (!values.length) return <p className="text-xs text-slate-400">Aucune valeur disponible</p>;
  return <div className="max-h-40 space-y-1 overflow-y-auto pr-1">{values.map((value) => <label key={String(value)} className="flex items-center gap-2 rounded px-1 py-1 text-xs hover:bg-slate-50"><input type="checkbox" checked={selected.includes(value)} onChange={() => onChange(selected.includes(value) ? selected.filter((entry) => entry !== value) : [...selected, value])} /><span>{labels?.[String(value)] ?? String(value)}</span></label>)}</div>;
}

const TECHNICAL_STATES: Array<{ value: PlanningTechnicalState; label: string }> = [
  { value: "without-machine", label: "Sans machine" }, { value: "with-machine", label: "Avec machine" },
  { value: "removed", label: "Retirée de l’ERP" }, { value: "visible", label: "Visible" }, { value: "hidden", label: "Masquée" },
];
