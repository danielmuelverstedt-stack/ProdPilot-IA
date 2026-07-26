"use client";

import { useState } from "react";
import { fieldClass, secondaryButton } from "@/components/ui/ModuleUi";
import { TASK_CATEGORY_CODES, TASK_CATEGORY_LABELS, UNCATEGORIZED_TASK_CATEGORY_VALUE } from "@/lib/task-category-dictionary";

/**
 * Champs seuls (recherche, tout afficher/masquer, liste à cocher) sans bouton ni popover — pour
 * être embarqués dans un menu de filtres existant (ex. WorkshopFilters) sans dupliquer la liste des
 * 41 catégories. `TaskCategoryVisibilityControl` ci-dessous les enveloppe dans son propre bouton
 * quand un menu dédié est préférable (Cockpit ERP, Planning capacité).
 */
export function TaskCategoryVisibilityFields({ visibleTaskCategoryCodes, onChange }: {
  visibleTaskCategoryCodes: string[];
  onChange: (codes: string[]) => void;
}) {
  const [search, setSearch] = useState("");
  const normalizedSearch = search.trim().toLocaleLowerCase("fr");
  const filteredCodes = TASK_CATEGORY_CODES.filter((code) => !normalizedSearch || `${code} ${TASK_CATEGORY_LABELS[code]}`.toLocaleLowerCase("fr").includes(normalizedSearch));

  function toggle(code: string) {
    onChange(visibleTaskCategoryCodes.includes(code) ? visibleTaskCategoryCodes.filter((entry) => entry !== code) : [...visibleTaskCategoryCodes, code]);
  }

  return <div className="w-72 max-w-full">
    <input autoFocus className={`${fieldClass} h-8 w-full py-0 text-xs`} placeholder="Rechercher une catégorie" value={search} onChange={(event) => setSearch(event.target.value)} />
    <div className="mt-2 flex justify-between text-xs">
      <button type="button" className="text-[var(--app-primary)] underline" onClick={() => onChange([...TASK_CATEGORY_CODES, UNCATEGORIZED_TASK_CATEGORY_VALUE])}>Tout afficher</button>
      <button type="button" className="text-[var(--app-primary)] underline" onClick={() => onChange([])}>Tout masquer</button>
    </div>
    <div className="mt-2 max-h-56 space-y-1 overflow-y-auto pr-1">
      {filteredCodes.map((code) => <label key={code} className="flex items-center gap-2 rounded px-1 py-1 text-xs hover:bg-slate-50">
        <input type="checkbox" checked={visibleTaskCategoryCodes.includes(code)} onChange={() => toggle(code)} />
        <span>{code} — {TASK_CATEGORY_LABELS[code]}</span>
      </label>)}
      {!filteredCodes.length ? <p className="text-xs text-slate-400">Aucune catégorie trouvée</p> : null}
    </div>
    <label className="mt-2 flex items-center gap-2 rounded border-t border-slate-100 px-1 pt-2 text-xs hover:bg-slate-50">
      <input type="checkbox" checked={visibleTaskCategoryCodes.includes(UNCATEGORIZED_TASK_CATEGORY_VALUE)} onChange={() => toggle(UNCATEGORIZED_TASK_CATEGORY_VALUE)} />
      <span>Non catégorisées <span className="text-slate-400">(machines/postes sans catégorie assignée)</span></span>
    </label>
  </div>;
}

/**
 * Contrôle compact (bouton + volet replié par défaut) pour afficher/masquer les catégories de
 * tâche ERP (`Code_Tâche`). Partagé entre le Cockpit ERP et Planning capacité pour que le masquage
 * reste le même réglage partout, sans dupliquer la liste des 41 catégories connues. L'Atelier
 * embarque directement `TaskCategoryVisibilityFields` dans son propre menu « Filtres » plutôt que
 * ce bouton séparé, à la demande explicite de l'utilisateur (un seul menu au lieu de deux).
 */
export function TaskCategoryVisibilityControl({ visibleTaskCategoryCodes, onChange }: {
  visibleTaskCategoryCodes: string[];
  onChange: (codes: string[]) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return <div className="relative inline-block">
    <button type="button" className={secondaryButton} aria-expanded={isOpen} onClick={() => setIsOpen((current) => !current)}>
      Catégories ({visibleTaskCategoryCodes.length}/{TASK_CATEGORY_CODES.length} visibles)
    </button>
    {isOpen ? <div className="absolute z-30 mt-1 rounded-xl border border-[var(--app-border)] bg-white p-3 shadow-lg">
      <TaskCategoryVisibilityFields visibleTaskCategoryCodes={visibleTaskCategoryCodes} onChange={onChange} />
    </div> : null}
  </div>;
}
