"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fieldClass, primaryButton, secondaryButton } from "@/components/ui/ModuleUi";
import { PlanningDialogShell } from "@/features/planning/components/PlanningDialogShell";
import { countDepartmentOperations, resolveDepartmentMachineIds, type DepartmentOperationIndex } from "@/features/planning/services/workshop-view-service";
import type { DepartmentLinksInput } from "@/features/settings/services/department-settings-service";
import type { DepartmentSettings, MachineSettings } from "@/features/settings/types/settings";
import { TASK_CATEGORY_CODES, TASK_CATEGORY_LABELS } from "@/lib/task-category-dictionary";

/** Débounce léger (~150 ms) pour ne pas refiltrer les listes catégories/machines à chaque frappe. */
function useDebouncedValue(value: string, delayMs: number): string {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

export function DepartmentLinksDialog({ department, machines, operationIndex, onClose, onSubmit, onDelete }: {
  /** `null` = création. */
  department: DepartmentSettings | null;
  machines: MachineSettings[];
  operationIndex: DepartmentOperationIndex;
  onClose: () => void;
  onSubmit: (input: DepartmentLinksInput) => { ok: true } | { ok: false; error: string };
  onDelete?: () => { ok: true } | { ok: false; error: string };
}) {
  const isPhysical = department?.membershipMode === "physical";
  const [name, setName] = useState(department?.label ?? "");
  const [linkedCategoryCodes, setLinkedCategoryCodes] = useState<string[]>(department?.linkedCategoryCodes ?? []);
  const [linkedMachineIds, setLinkedMachineIds] = useState<string[]>(department?.linkedMachineIds ?? []);
  const [categorySearch, setCategorySearch] = useState("");
  const [machineSearch, setMachineSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const debouncedCategorySearch = useDebouncedValue(categorySearch, 150).trim().toLocaleLowerCase("fr");
  const debouncedMachineSearch = useDebouncedValue(machineSearch, 150).trim().toLocaleLowerCase("fr");

  const machineCountByCategory = new Map<string, number>();
  machines.forEach((machine) => { if (machine.taskCategoryCode) machineCountByCategory.set(machine.taskCategoryCode, (machineCountByCategory.get(machine.taskCategoryCode) ?? 0) + 1); });
  const filteredCategoryCodes = TASK_CATEGORY_CODES.filter((code) => !debouncedCategorySearch || `${code} ${TASK_CATEGORY_LABELS[code]}`.toLocaleLowerCase("fr").includes(debouncedCategorySearch));
  const filteredMachines = machines.filter((machine) => !debouncedMachineSearch || `${machine.id} ${machine.displayName}`.toLocaleLowerCase("fr").includes(debouncedMachineSearch));

  // Pour l'affichage des cases (grisées « incluse via catégorie ») : uniquement les machines dont la fiche est taguée sur une catégorie cochée. Le poids réel (aperçu en direct) inclut en plus les machines non taguées qui portent déjà une opération de cette catégorie et les OF sans machine — même règle que l'onglet Atelier.
  const includedViaCategory = new Set(machines.filter((machine) => machine.taskCategoryCode && linkedCategoryCodes.includes(machine.taskCategoryCode)).map((machine) => machine.id));
  const draftLinks = { id: department?.id, membershipMode: department?.membershipMode, linkedCategoryCodes, linkedMachineIds };
  const includedMachineCount = resolveDepartmentMachineIds(operationIndex, machines, draftLinks).size;
  const includedOperationCount = countDepartmentOperations(operationIndex, machines, draftLinks);
  // Mode "physical" (Tournage/Fraisage/Découpe fil) : liste en lecture seule, pour transparence — rien à cocher ici, tout se règle depuis la fiche de chaque machine.
  const physicalMachines = isPhysical && department ? machines.filter((machine) => !machine.deleted && machine.departmentId === department.id) : [];

  function toggleCategory(code: string) {
    setLinkedCategoryCodes((current) => current.includes(code) ? current.filter((entry) => entry !== code) : [...current, code]);
  }

  function toggleMachine(machineId: string) {
    if (includedViaCategory.has(machineId)) return;
    setLinkedMachineIds((current) => current.includes(machineId) ? current.filter((entry) => entry !== machineId) : [...current, machineId]);
  }

  function submit() {
    const result = onSubmit({ name, linkedCategoryCodes, linkedMachineIds });
    if (!result.ok) { setError(result.error); return; }
    onClose();
  }

  function remove() {
    if (!onDelete) return;
    if (!window.confirm(`Supprimer le département « ${department?.label} » ? Les machines et les OF ne sont pas supprimés, seul cet onglet du Planning disparaît.`)) return;
    const result = onDelete();
    if (!result.ok) { setError(result.error); return; }
    onClose();
  }

  return <PlanningDialogShell
    title={department ? "Modifier le département" : "Nouveau département"}
    description={isPhysical ? "Les machines viennent de leur fiche (Parc Machines → Département) ; les catégories ci-dessous ne servent qu'à retrouver les OF pas encore assignés à une machine." : "Les catégories et machines liées déterminent automatiquement ce qui s'affiche dans cet onglet du Planning."}
    onClose={onClose}
    actions={<>
      {department && onDelete ? <button type="button" className={secondaryButton} onClick={remove}>Supprimer le département</button> : null}
      <button type="button" className={secondaryButton} onClick={onClose}>Annuler</button>
      <button type="button" className={primaryButton} onClick={submit}>{department ? "Enregistrer" : "Créer"}</button>
    </>}
  >
    <div className="space-y-4">
      <label className="block text-sm font-medium">Nom du département
        <input autoFocus required className={`${fieldClass} mt-1 w-full`} value={name} onChange={(event) => setName(event.target.value)} />
      </label>

      {isPhysical ? <p className="rounded-lg border border-[var(--app-border)] bg-slate-50 px-3 py-2 text-sm text-slate-600">
        Département de production : quelle machine apparaît ici vient du champ « Département » de sa fiche (Parc Machines → la machine → Identité), pas des catégories cochées ci-dessous. Les catégories ne déterminent que les OF <strong>sans machine assignée</strong> à afficher dans cet onglet — sans elles, un OF de cette catégorie pas encore affecté à une machine resterait invisible partout dans l’Atelier.
      </p> : null}

      <div>
        <p className="text-sm font-medium">Catégories liées{isPhysical ? " (pour les OF sans machine assignée)" : ""}</p>
        <input className={`${fieldClass} mt-1 h-8 w-full py-0 text-xs`} placeholder="Rechercher une catégorie" value={categorySearch} onChange={(event) => setCategorySearch(event.target.value)} />
        <div className="mt-2 max-h-48 space-y-1 overflow-y-auto rounded-lg border border-[var(--app-border)] p-2">
          {filteredCategoryCodes.map((code) => <label key={code} className="flex items-center gap-2 rounded px-1 py-1 text-xs hover:bg-slate-50">
            <input type="checkbox" checked={linkedCategoryCodes.includes(code)} onChange={() => toggleCategory(code)} />
            <span>{code} — {TASK_CATEGORY_LABELS[code]} <span className="text-slate-400">· {(machineCountByCategory.get(code) ?? 0).toLocaleString("fr-BE")} machine(s)</span></span>
          </label>)}
          {!filteredCategoryCodes.length ? <p className="text-xs text-slate-400">Aucune catégorie trouvée</p> : null}
        </div>
      </div>

      {isPhysical ? <div>
        <p className="text-sm font-medium">Machines actuellement rattachées</p>
        <div className="mt-2 max-h-48 space-y-1 overflow-y-auto rounded-lg border border-[var(--app-border)] p-2">
          {physicalMachines.map((machine) => <div key={machine.id} className="flex items-center justify-between gap-2 rounded px-1 py-1 text-xs">
            <span>{machine.id} — {machine.displayName}</span>
            <Link href={`/machines/${machine.id}`} className="text-[var(--app-primary)] hover:underline">Ouvrir la fiche</Link>
          </div>)}
          {!physicalMachines.length ? <p className="text-xs text-slate-400">Aucune machine n’est rattachée à ce département pour l’instant.</p> : null}
        </div>
      </div> : <div>
        <p className="text-sm font-medium">Machines individuelles (optionnel)</p>
        <input className={`${fieldClass} mt-1 h-8 w-full py-0 text-xs`} placeholder="Rechercher une machine" value={machineSearch} onChange={(event) => setMachineSearch(event.target.value)} />
        <div className="mt-2 max-h-48 space-y-1 overflow-y-auto rounded-lg border border-[var(--app-border)] p-2">
          {filteredMachines.map((machine) => {
            const viaCategory = includedViaCategory.has(machine.id);
            return <label key={machine.id} className={`flex items-center gap-2 rounded px-1 py-1 text-xs ${viaCategory ? "text-slate-400" : "hover:bg-slate-50"}`}>
              <input type="checkbox" checked={viaCategory || linkedMachineIds.includes(machine.id)} disabled={viaCategory} onChange={() => toggleMachine(machine.id)} />
              <span>{machine.id} — {machine.displayName}{machine.taskCategoryCode ? "" : " (non catégorisée)"}{machine.deleted ? " (supprimée)" : ""}</span>
              {viaCategory ? <span className="text-slate-400">incluse via catégorie</span> : null}
            </label>;
          })}
          {!filteredMachines.length ? <p className="text-xs text-slate-400">Aucune machine trouvée</p> : null}
        </div>
      </div>}

      <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm font-medium">
        {isPhysical
          ? <>→ {includedMachineCount.toLocaleString("fr-BE")} machine{includedMachineCount > 1 ? "s" : ""} (fiche machine) · {includedOperationCount.toLocaleString("fr-BE")} OF au total, dont ceux sans machine assignée des catégories cochées ci-dessus.</>
          : <>→ {includedMachineCount.toLocaleString("fr-BE")} machine{includedMachineCount > 1 ? "s" : ""} · {includedOperationCount.toLocaleString("fr-BE")} OF seront affichés automatiquement dans le planning.</>}
      </p>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  </PlanningDialogShell>;
}
