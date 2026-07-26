/* Les aperçus locaux en data URL ne passent pas par l’optimiseur d’images. */
/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { formatEuropeanDate, ModuleHeader, primaryButton, secondaryButton, StatusPill } from "@/components/ui/ModuleUi";
import { useDemoData } from "@/features/demo/services/demo-repository";
import type { ErpPlanningOverview } from "@/features/erp-import/types/erp-import";
import { MachineCreateDialog } from "@/features/machines/components/MachineCreateDialog";
import { MachineOptionsDialog } from "@/features/machines/components/MachineOptionsDialog";
import { MachinePhotoStorageMigration } from "@/features/machines/components/MachinePhotoStorageMigration";
import { useMachinePhotos } from "@/features/machines/services/machine-photo-store";
import { useSettings } from "@/features/settings/components/SettingsProvider";
import { machineSettingsService } from "@/features/settings/services/machine-settings-service";
import type { MachineCreateInput, MachineCreateResult } from "@/features/settings/services/machine-settings-service";
import type { DepartmentSettings } from "@/features/settings/types/settings";
import { TASK_CATEGORY_CODES, TASK_CATEGORY_LABELS, UNCATEGORIZED_TASK_CATEGORY_VALUE } from "@/lib/task-category-dictionary";

const ALL_DEPARTMENTS_TAB = "all";

const MACHINE_DRAG_MIME_TYPE = "application/x-prodpilot-machine-card";

export function MachinesModule() {
  const router = useRouter();
  const { settings, updateSettings } = useSettings();
  const data = useDemoData();
  const photos = useMachinePhotos();
  const [overview, setOverview] = useState<ErpPlanningOverview | null>(null);
  const [creatingMachine, setCreatingMachine] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);
  useEffect(() => {
    let active = true;
    void fetch("/api/erp/imports", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : null)
      .then((payload) => { if (active && payload) setOverview(payload as ErpPlanningOverview); })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);
  const machines = useMemo(() => settings.production.machines.filter((machine) => machine.visible).sort((a, b) => a.order - b.order), [settings.production.machines]);
  const activeDepartments = useMemo(() => [...settings.production.departments].filter((department) => department.active).sort((a, b) => a.order - b.order), [settings.production.departments]);
  const machineCountByDepartmentId = useMemo(() => {
    const counts = new Map<string, number>();
    machines.forEach((machine) => counts.set(machine.departmentId, (counts.get(machine.departmentId) ?? 0) + 1));
    return counts;
  }, [machines]);
  const [departmentTab, setDepartmentTab] = useState<string>(ALL_DEPARTMENTS_TAB);
  const [categoryFilter, setCategoryFilter] = useState("");
  function selectDepartmentTab(departmentId: string) {
    setDepartmentTab(departmentId);
    // Une catégorie choisie dans un autre onglet peut ne plus exister ici : repli sur « Toutes les catégories » plutôt que garder un filtre invisible qui viderait la grille sans explication.
    setCategoryFilter("");
  }
  const departmentFilteredMachines = useMemo(
    () => departmentTab === ALL_DEPARTMENTS_TAB ? machines : machines.filter((machine) => machine.departmentId === departmentTab),
    [machines, departmentTab],
  );
  const usedCategoryCodes = useMemo(() => {
    const codes = new Set(departmentFilteredMachines.map((machine) => machine.taskCategoryCode).filter((code): code is string => Boolean(code)));
    return TASK_CATEGORY_CODES.filter((code) => codes.has(code));
  }, [departmentFilteredMachines]);
  const hasUncategorizedMachine = useMemo(() => departmentFilteredMachines.some((machine) => !machine.taskCategoryCode), [departmentFilteredMachines]);
  const displayedMachines = useMemo(() => {
    if (!categoryFilter) return departmentFilteredMachines;
    if (categoryFilter === UNCATEGORIZED_TASK_CATEGORY_VALUE) return departmentFilteredMachines.filter((machine) => !machine.taskCategoryCode);
    return departmentFilteredMachines.filter((machine) => machine.taskCategoryCode === categoryFilter);
  }, [departmentFilteredMachines, categoryFilter]);
  function moveMachine(draggedId: string, targetId: string) {
    updateSettings((draft) => { machineSettingsService.moveMachine(draft, draggedId, targetId); }, "Ordre des machines modifié");
  }
  function createMachine(input: MachineCreateInput): MachineCreateResult {
    const outcome: { result: MachineCreateResult } = { result: { ok: false, error: "Impossible de créer la machine." } };
    updateSettings((draft) => { outcome.result = machineSettingsService.createMachine(draft, input); }, "Machine créée");
    if (outcome.result.ok) {
      setCreatingMachine(false);
      router.push(`/machines/${outcome.result.machine.id}`);
    }
    return outcome.result;
  }
  const mappedCounts = new Map<string, number>();
  const validMachineIds = new Set(machines.filter((machine) => machine.active && machine.visible && !machine.deleted).map((machine) => machine.id));
  overview?.machineCodes.forEach((entry) => { if (entry.machineId) mappedCounts.set(entry.machineId, (mappedCounts.get(entry.machineId) ?? 0) + entry.operationCount); });

  return <div className="mx-auto max-w-7xl">
    <ModuleHeader eyebrow="Référentiel de production" title="Parc Machines" description="Référentiel central du Planning, enrichi des maintenances et actions locales existantes. Une machine supprimée reste conservée pour détecter les anciennes affectations." actions={<><button type="button" className={primaryButton} onClick={() => setCreatingMachine(true)}>Ajouter une machine</button><button type="button" className={secondaryButton} onClick={() => setOptionsOpen(true)}>Options</button><Link href="/planning" className={secondaryButton}>Correspondances ERP</Link><Link href="/reglages" className={secondaryButton}>Gérer les machines</Link><Link href="/machines/maintenance" className={secondaryButton}>Planning maintenance</Link></>} />
    {creatingMachine ? <MachineCreateDialog settings={settings} onSubmit={createMachine} onClose={() => setCreatingMachine(false)} /> : null}
    {optionsOpen ? <MachineOptionsDialog onClose={() => setOptionsOpen(false)} /> : null}
    <section className="mt-6 grid gap-3 sm:grid-cols-3"><Metric label="Machines actives" value={machines.filter((machine) => machine.active && !machine.deleted).length} /><Metric label="Machines supprimées" value={machines.filter((machine) => machine.deleted).length} /><Metric label="Codes ERP non mappés" value={overview?.machineCodes.filter((entry) => !entry.machineId || !validMachineIds.has(entry.machineId)).length ?? 0} /></section>
    <MachinePhotoStorageMigration />
    <div className="mt-6"><MachineDepartmentTabs departments={activeDepartments} selectedId={departmentTab} totalCount={machines.length} countsByDepartmentId={machineCountByDepartmentId} onSelect={selectDepartmentTab} /></div>
    <div className="mt-4 flex flex-wrap items-center gap-3">
      <label className="text-sm font-medium text-slate-700">Catégorie
        <select className="ml-2 rounded-lg border border-[var(--app-border)] px-3 py-1.5 text-sm" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
          <option value="">Toutes les catégories</option>
          {usedCategoryCodes.map((code) => <option key={code} value={code}>{TASK_CATEGORY_LABELS[code]}</option>)}
          {hasUncategorizedMachine ? <option value={UNCATEGORIZED_TASK_CATEGORY_VALUE}>Non catégorisées</option> : null}
        </select>
      </label>
      <span className="text-xs text-slate-500">{displayedMachines.length.toLocaleString("fr-BE")} sur {machines.length.toLocaleString("fr-BE")} machines</span>
    </div>
    <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{displayedMachines.map((machine) => {
      const department = settings.production.departments.find((entry) => entry.id === machine.departmentId);
      const demoMachine = data.machines.find((entry) => entry.id === machine.id);
      const maintenance = data.maintenance.filter((entry) => entry.machineId === machine.id && entry.status !== "Terminée").sort((a, b) => a.date.localeCompare(b.date))[0];
      const actions = data.actions.filter((entry) => entry.contextLink?.module === "machine" && entry.contextLink.id === machine.id && entry.statut !== "Fait");
      const status = machine.deleted ? "Supprimée" : demoMachine?.status ?? (machine.active ? "Active" : "Inactive");
      const tone = machine.deleted || status === "En panne" ? "danger" : status === "Disponible" || status === "Active" ? "success" : status === "Maintenance prévue" ? "warning" : "neutral";
      const photoDataUrl = photos[machine.id];
      return <article
        key={machine.id}
        draggable={!machine.deleted}
        onDragStart={(event) => event.dataTransfer.setData(MACHINE_DRAG_MIME_TYPE, machine.id)}
        onDragOver={(event) => { if (!machine.deleted) event.preventDefault(); }}
        onDrop={(event) => {
          const draggedId = event.dataTransfer.getData(MACHINE_DRAG_MIME_TYPE);
          if (draggedId && draggedId !== machine.id) moveMachine(draggedId, machine.id);
        }}
        className={`overflow-hidden rounded-2xl border border-[var(--app-border)] bg-white shadow-sm ${machine.deleted ? "opacity-60" : "cursor-grab active:cursor-grabbing"}`}
      >
        {photoDataUrl ? <img src={photoDataUrl} alt={machine.displayName} className="h-40 w-full object-cover" /> : null}
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div><p className="text-xs font-bold uppercase tracking-wide text-slate-500">{department?.label || machine.department || "Atelier non défini"}</p><h2 className="mt-1 flex flex-wrap items-center gap-2 text-xl font-bold"><span>{machine.favorite ? "★ " : ""}{machine.displayName}</span>{machine.kind === "poste" ? <StatusPill tone="info">Poste</StatusPill> : null}</h2><p className="mt-1 font-mono text-xs text-slate-500">{machine.id}</p></div>
            <div className="flex items-center gap-2">{!machine.deleted ? <span className="cursor-grab select-none text-slate-400" title="Glisser pour changer l’ordre">⠿⠿</span> : null}<StatusPill tone={tone}>{status}</StatusPill></div>
          </div>
          <dl className="mt-5 grid grid-cols-2 gap-3 text-sm"><Info label="Type" value={machine.machineType || demoMachine?.type || "—"} /><Info label="Catégorie" value={machine.taskCategoryCode ? TASK_CATEGORY_LABELS[machine.taskCategoryCode] ?? machine.taskCategoryCode : "Non catégorisée"} /><Info label="Opérations mappées" value={(mappedCounts.get(machine.id) ?? 0).toLocaleString("fr-BE")} /><Info label="Maintenance" value={maintenance ? formatEuropeanDate(maintenance.date) : "Aucune"} /><Info label="Actions ouvertes" value={actions.length.toLocaleString("fr-BE")} /><Info label="Capacité future" value={machine.futureCapacityHours == null ? "Non définie" : `${machine.futureCapacityHours.toLocaleString("fr-BE")} h/j`} /><Info label="Ordre" value={String(machine.order + 1)} /></dl>
          {machine.comments ? <p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-600">{machine.comments}</p> : null}
          <Link href={`/machines/${machine.id}`} className={`${secondaryButton} mt-4 w-full`}>Voir la fiche et les actions</Link>
        </div>
      </article>;
    })}</div>
  </div>;
}

function Metric({ label, value }: { label: string; value: number }) { return <div className="rounded-2xl border border-[var(--app-border)] bg-white p-4"><p className="text-xs font-bold uppercase text-slate-500">{label}</p><p className="mt-1 text-3xl font-bold">{value.toLocaleString("fr-BE")}</p></div>; }
function Info({ label, value }: { label: string; value: string }) { return <div><dt className="text-xs text-slate-500">{label}</dt><dd className="font-semibold">{value}</dd></div>; }

/** Onglet « Tous » + un onglet par département actif, même style de pilules que l'Atelier (WorkshopDepartmentTabs) — navigue par département physique de la machine, en plus du filtre Catégorie existant qui affine ensuite l'onglet actif. */
function MachineDepartmentTabs({ departments, selectedId, totalCount, countsByDepartmentId, onSelect }: {
  departments: DepartmentSettings[];
  selectedId: string;
  totalCount: number;
  countsByDepartmentId: Map<string, number>;
  onSelect: (departmentId: string) => void;
}) {
  return <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1">
    <DepartmentTabButton label="Tous" count={totalCount} isSelected={selectedId === ALL_DEPARTMENTS_TAB} onClick={() => onSelect(ALL_DEPARTMENTS_TAB)} />
    {departments.map((department) => <DepartmentTabButton key={department.id} label={department.label} count={countsByDepartmentId.get(department.id) ?? 0} isSelected={selectedId === department.id} onClick={() => onSelect(department.id)} />)}
  </div>;
}

function DepartmentTabButton({ label, count, isSelected, onClick }: { label: string; count: number; isSelected: boolean; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={`shrink-0 rounded-full px-3 py-2 text-sm font-semibold transition ${isSelected ? "bg-[var(--app-primary)] text-white" : "border border-[var(--app-border)] bg-white text-slate-600 hover:bg-slate-50"}`}>
    {label} <span className={`text-xs font-normal ${isSelected ? "text-white/80" : "text-slate-500"}`}>({count.toLocaleString("fr-BE")})</span>
  </button>;
}
