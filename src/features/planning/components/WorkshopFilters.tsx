"use client";

import { useRef, useState, type ReactNode } from "react";
import { fieldClass, secondaryButton } from "@/components/ui/ModuleUi";
import { createDefaultWorkshopFilters } from "@/features/planning/services/workshop-view-preferences";
import type { WorkshopFilterState } from "@/features/planning/types/workshop-view";

const SEARCH_DEBOUNCE_MS = 250;

interface WorkshopFiltersProps {
  filters: WorkshopFilterState;
  resultCount: number;
  totalCount: number;
  onChange: (update: (filters: WorkshopFilterState) => WorkshopFilterState) => void;
}

/**
 * Menu « Filtres » (machines, articles) de l'Atelier. Les catégories visibles ne vivent plus ici :
 * à la demande explicite de l'utilisateur, un seul endroit les configure — le crayon (✎) de chaque
 * département (`DepartmentLinksDialog`) — pour éviter deux réglages qui peuvent diverger.
 */
export function WorkshopFilters({ filters, resultCount, totalCount, onChange }: WorkshopFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const patch = (value: Partial<WorkshopFilterState>) => onChange((current) => ({ ...current, ...value }));

  // Recherche debouncée (~250 ms) : taper met à jour l'affichage du champ instantanément, mais ne
  // redéclenche le filtrage/regroupement réel (et le re-rendu de toutes les lignes affichées) qu'une
  // fois la frappe interrompue — sinon chaque caractère tapé refiltre/re-rend tout le département actif.
  const [searchInput, setSearchInput] = useState(filters.search);
  const [syncedSearch, setSyncedSearch] = useState(filters.search);
  const searchTimerRef = useRef<number | null>(null);
  // Resynchronise l'affichage local si filters.search change pour une autre raison que la saisie
  // (ex. « Tout effacer », changement d'onglet) — mise à jour pendant le rendu plutôt que dans un
  // effet, seule façon recommandée par React d'ajuster un état dérivé d'une prop sans rendu superflu.
  if (filters.search !== syncedSearch) {
    setSyncedSearch(filters.search);
    setSearchInput(filters.search);
  }
  function handleSearchChange(value: string) {
    setSearchInput(value);
    if (searchTimerRef.current !== null) window.clearTimeout(searchTimerRef.current);
    searchTimerRef.current = window.setTimeout(() => patch({ search: value }), SEARCH_DEBOUNCE_MS);
  }

  return <section className="rounded-2xl border border-[var(--app-border)] bg-white p-3">
    <div className="flex flex-wrap items-center gap-3">
      <button type="button" className={secondaryButton} aria-expanded={isOpen} onClick={() => setIsOpen((current) => !current)}>{isOpen ? "Fermer les filtres" : "Filtres"}</button>
      <input className={`${fieldClass} min-w-[220px] flex-1`} value={searchInput} onChange={(event) => handleSearchChange(event.target.value)} placeholder="Rechercher : OF, article, code article, description, client" />
      <span className="whitespace-nowrap text-xs text-slate-500">{resultCount.toLocaleString("fr-BE")} sur {totalCount.toLocaleString("fr-BE")} opérations</span>
      <button type="button" className={secondaryButton} onClick={() => onChange(createDefaultWorkshopFilters)}>Tout effacer</button>
    </div>
    {isOpen ? <div className="mt-3 flex flex-wrap gap-x-8 gap-y-3 border-t border-slate-100 pt-3">
      <FilterGroup title="Machines">
        <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={filters.showActiveMachines} onChange={(event) => patch({ showActiveMachines: event.target.checked })} /><span>Actives</span></label>
        <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={filters.showInactiveMachines} onChange={(event) => patch({ showInactiveMachines: event.target.checked })} /><span>Inactives</span></label>
        <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={filters.showMaskedMachines} onChange={(event) => patch({ showMaskedMachines: event.target.checked })} /><span>Masquées</span></label>
        <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={filters.showMachinesWithoutOperations} onChange={(event) => patch({ showMachinesWithoutOperations: event.target.checked })} /><span>Sans OF</span></label>
      </FilterGroup>
      <FilterGroup title="Articles">
        <select className={`${fieldClass} h-9 py-0 text-xs`} value={filters.articleMultiplicity} onChange={(event) => patch({ articleMultiplicity: event.target.value as WorkshopFilterState["articleMultiplicity"] })}>
          <option value="all">Tous les articles</option>
          <option value="multiple">Présents dans plusieurs OF</option>
          <option value="unique">Présents dans un seul OF</option>
        </select>
      </FilterGroup>
    </div> : null}
  </section>;
}

function FilterGroup({ title, children }: { title: string; children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-3"><span className="text-xs font-semibold uppercase text-slate-500">{title}</span>{children}</div>;
}
