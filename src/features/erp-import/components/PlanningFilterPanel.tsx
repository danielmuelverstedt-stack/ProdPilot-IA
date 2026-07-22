"use client";

import type { ReactNode } from "react";
import { fieldClass, secondaryButton } from "@/components/ui/ModuleUi";
import { emptyPlanningFilters } from "@/features/erp-import/services/erp-planning-view-preferences";
import type { PlanningFilterOptions } from "@/features/erp-import/services/filter-engine";
import type { PlanningFilters, PlanningTechnicalState } from "@/features/erp-import/types/erp-planning-view";

interface PlanningFilterPanelProps {
  filters: PlanningFilters;
  options: PlanningFilterOptions;
  resultCount: number;
  totalCount: number;
  onChange: (filters: PlanningFilters) => void;
}

export function PlanningFilterPanel({ filters, options, resultCount, totalCount, onChange }: PlanningFilterPanelProps) {
  const patch = (value: Partial<PlanningFilters>) => onChange({ ...filters, ...value });
  return <aside className="h-fit rounded-2xl border border-[var(--app-border)] bg-white p-4 lg:sticky lg:top-4">
    <div className="flex items-start justify-between gap-3"><div><h2 className="font-semibold">Filtres</h2><p className="mt-1 text-xs text-slate-500">{resultCount.toLocaleString("fr-BE")} sur {totalCount.toLocaleString("fr-BE")} opérations</p></div><button type="button" className={secondaryButton} onClick={() => onChange(emptyPlanningFilters())}>Tout effacer</button></div>
    <label className="mt-4 block text-xs font-semibold text-slate-600">Recherche
      <input className={`${fieldClass} mt-1`} value={filters.search} onChange={(event) => patch({ search: event.target.value })} placeholder="OF, article, description, client" />
    </label>
    <FilterSection title="Clients"><ChoiceList values={options.clients} selected={filters.clients} onChange={(clients) => patch({ clients })} /></FilterSection>
    <FilterSection title="Production">
      <ChoiceGroup label="Départements" values={options.departments} selected={filters.departments} onChange={(departments) => patch({ departments })} />
      <ChoiceGroup label="Groupes de ressources" values={options.resourceGroups} selected={filters.resourceGroups} onChange={(resourceGroups) => patch({ resourceGroups })} />
      <ChoiceGroup label="Machines" values={options.machines} selected={filters.machines} onChange={(machines) => patch({ machines })} />
    </FilterSection>
    <FilterSection title="Priorités et statuts">
      <ChoiceGroup label="Priorités ERP" values={options.erpPriorities} selected={filters.erpPriorities} onChange={(erpPriorities) => patch({ erpPriorities })} />
      <ChoiceGroup label="Priorités utilisateur" values={options.userPriorities} selected={filters.userPriorities} onChange={(userPriorities) => patch({ userPriorities })} />
      <ChoiceGroup label="IDOperation_Status" values={options.erpStatusIds} selected={filters.erpStatusIds} onChange={(erpStatusIds) => patch({ erpStatusIds })} />
      <ChoiceGroup label="Status ERP" values={options.erpStatuses} selected={filters.erpStatuses} onChange={(erpStatuses) => patch({ erpStatuses })} />
    </FilterSection>
    <FilterSection title="État technique">
      <ChoiceList values={TECHNICAL_STATES.map((entry) => entry.value)} selected={filters.technicalStates} labels={Object.fromEntries(TECHNICAL_STATES.map((entry) => [entry.value, entry.label]))} onChange={(technicalStates) => patch({ technicalStates })} />
    </FilterSection>
  </aside>;
}

function FilterSection({ title, children }: { title: string; children: ReactNode }) { return <details className="mt-3 border-t border-slate-100 pt-3" open><summary className="cursor-pointer text-sm font-semibold text-slate-700">{title}</summary><div className="mt-2 space-y-3">{children}</div></details>; }

function ChoiceGroup<T extends string | number>({ label, values, selected, onChange }: { label: string; values: T[]; selected: T[]; onChange: (values: T[]) => void }) {
  if (!values.length) return <p className="text-xs text-slate-400">{label} : aucune valeur disponible</p>;
  return <div><p className="mb-1 text-xs font-semibold text-slate-500">{label}</p><ChoiceList values={values} selected={selected} onChange={onChange} /></div>;
}

function ChoiceList<T extends string | number>({ values, selected, labels, onChange }: { values: T[]; selected: T[]; labels?: Record<string, string>; onChange: (values: T[]) => void }) {
  if (!values.length) return <p className="text-xs text-slate-400">Aucune valeur disponible</p>;
  return <div className="max-h-44 space-y-1 overflow-y-auto pr-1">{values.map((value) => <label key={String(value)} className="flex items-center gap-2 rounded px-1 py-1 text-xs hover:bg-slate-50"><input type="checkbox" checked={selected.includes(value)} onChange={() => onChange(selected.includes(value) ? selected.filter((entry) => entry !== value) : [...selected, value])} /><span>{labels?.[String(value)] ?? String(value)}</span></label>)}</div>;
}

const TECHNICAL_STATES: Array<{ value: PlanningTechnicalState; label: string }> = [
  { value: "without-machine", label: "Sans machine" }, { value: "with-machine", label: "Avec machine" },
  { value: "removed", label: "Retirée de l’ERP" }, { value: "visible", label: "Visible" }, { value: "hidden", label: "Masquée" },
];
