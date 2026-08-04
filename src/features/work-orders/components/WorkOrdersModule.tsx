"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { EmptyState, fieldClass, formatEuropeanDate, ModuleHeader, StatusPill } from "@/components/ui/ModuleUi";
import { useDemoData } from "@/features/demo/services/demo-repository";
import { useSettings } from "@/features/settings/components/SettingsProvider";
import { ERP_OPERATION_STATUS_LABELS, erpOperationStatusTone } from "@/features/erp-import/services/erp-operation-status-presentation";
import { groupErpPlanningRows } from "@/features/erp-import/services/erp-planning-grouping";
import type { ErpPlanningOverview } from "@/features/erp-import/types/erp-import";
import { useErpImportActive } from "@/features/planning/hooks/useErpImportActive";
import { useWorkshopOperations } from "@/features/planning/hooks/useWorkshopOperations";
import { matchesErpWorkOrderFilters, summarizeErpWorkOrder } from "@/features/work-orders/services/erp-work-order-summary";
import { useVisibleTaskCategoryCodes } from "@/lib/visible-task-categories-store";

type WorkOrderView = "all" | "closed" | "new" | "waiting";

/** Fenêtres proposées pour l'onglet « Clôturées récemment ». */
const CLOSED_PERIOD_OPTIONS = [7, 30] as const;

function closedAfterDate(days: number): string {
  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - days);
  return cutoff.toISOString().slice(0, 10);
}

export function WorkOrdersModule() {
  const data = useDemoData();
  const { settings } = useSettings();
  const machines = settings.production.machines;
  // Réglage partagé « catégories visibles », dans son propre stockage rapide (pas dans les Réglages
  // partagés) : voir src/lib/visible-task-categories-store.ts.
  const visibleTaskCategoryCodes = useVisibleTaskCategoryCodes();
  const { rows, isLoading } = useWorkshopOperations(machines, visibleTaskCategoryCodes);
  const { hasActiveImport } = useErpImportActive();
  // Id du dernier import actif, pour repérer les OF apparues depuis (voir ErpWorkOrder.firstSeenImportId) — même point d'accès que MachineDetail.tsx/ErpQualityModule.tsx.
  const [activeImportId, setActiveImportId] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    void fetch("/api/erp/imports", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : null)
      .then((payload) => { if (active && payload) setActiveImportId((payload as ErpPlanningOverview).activeImport?.id ?? null); })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("Tous");
  const [priority, setPriority] = useState("Toutes");
  const [machineFilter, setMachineFilter] = useState("Toutes");
  const [department, setDepartment] = useState("Tous");
  const [delay, setDelay] = useState("Tous");
  // Onglet unique (comme les départements de l'Atelier/Parc Machines), à la demande explicite de
  // l'utilisateur, à la place d'un filtre déroulant + une case à cocher séparés.
  const [view, setView] = useState<WorkOrderView>("all");
  const [closedPeriodDays, setClosedPeriodDays] = useState<(typeof CLOSED_PERIOD_OPTIONS)[number]>(7);
  const closedAfter = view === "closed" ? closedAfterDate(closedPeriodDays) : null;
  const newOnly = view === "new";
  const waitingOnly = view === "waiting";

  const filteredDemo = useMemo(() => data.workOrders.filter((item) => {
    const text = `${item.id} ${item.customer} ${item.article} ${item.description}`.toLocaleLowerCase("fr");
    const itemMachines = item.operations.map((operation) => operation.machineId);
    const departments = item.operations.map((operation) => operation.department);
    const late = new Date(item.dueDate) < new Date("2026-07-13T00:00:00.000Z") && item.status !== "Terminé";
    return text.includes(search.toLocaleLowerCase("fr")) && (status === "Tous" || item.status === status) && (priority === "Toutes" || item.priority === priority) && (machineFilter === "Toutes" || itemMachines.includes(machineFilter)) && (department === "Tous" || departments.includes(department)) && (delay === "Tous" || (delay === "En retard") === late);
  }), [data.workOrders, delay, department, machineFilter, priority, search, status]);

  const erpSummaries = useMemo(() => {
    if (!hasActiveImport) return [];
    const groups = groupErpPlanningRows(rows, "work-order", machines);
    return groups.map((group) => summarizeErpWorkOrder(group.rows)).sort((a, b) => {
      if (a.isLate !== b.isLate) return a.isLate ? -1 : 1;
      return (a.dueDate ?? "9999-99-99").localeCompare(b.dueDate ?? "9999-99-99");
    });
  }, [hasActiveImport, rows, machines]);

  const erpMachineOptions = useMemo(() => [...new Set(erpSummaries.map((item) => item.machine).filter((value) => value !== "Non définie"))].sort((a, b) => a.localeCompare(b, "fr")), [erpSummaries]);
  const erpDepartmentOptions = useMemo(() => [...new Set(machines.map((item) => item.department))].sort((a, b) => a.localeCompare(b, "fr")), [machines]);

  // Compteurs par onglet indépendants des autres filtres (recherche, statut…), comme les onglets de
  // département de l'Atelier/Parc Machines.
  const closedCount = useMemo(() => erpSummaries.filter((item) => item.closedAt !== null && item.closedAt >= closedAfterDate(closedPeriodDays)).length, [erpSummaries, closedPeriodDays]);
  const newCount = useMemo(() => erpSummaries.filter((item) => item.firstSeenImportId !== null && item.firstSeenImportId === activeImportId).length, [erpSummaries, activeImportId]);
  const waitingCount = useMemo(() => erpSummaries.filter((item) => item.hasWaitingOperation).length, [erpSummaries]);

  const filteredErp = useMemo(
    () => erpSummaries.filter((item) => matchesErpWorkOrderFilters(item, { search, statusLabel: status, machine: machineFilter, department, delay, closedAfter, newOnly, activeImportId, waitingOnly }, ERP_OPERATION_STATUS_LABELS)),
    [erpSummaries, search, status, machineFilter, department, delay, closedAfter, newOnly, activeImportId, waitingOnly],
  );

  if (hasActiveImport) {
    return <div className="mx-auto max-w-7xl">
      <ModuleHeader eyebrow="Production" title="Ordres de fabrication" description="Consultez les OF réels importés d’ERP, leur avancement et leurs opérations." />
      <div className="mt-6 flex flex-wrap items-center gap-2 overflow-x-auto pb-1">
        <WorkOrderViewTabButton label="Tous" count={erpSummaries.length} isSelected={view === "all"} onClick={() => setView("all")} />
        <WorkOrderViewTabButton label="Clôturées récemment" count={closedCount} isSelected={view === "closed"} onClick={() => setView("closed")} />
        <WorkOrderViewTabButton label="Nouvelles depuis le dernier import" count={newCount} isSelected={view === "new"} onClick={() => setView("new")} />
        <WorkOrderViewTabButton label="En attente" count={waitingCount} isSelected={view === "waiting"} onClick={() => setView("waiting")} />
        {view === "closed" ? <div className="ml-1 flex items-center gap-1">
          {CLOSED_PERIOD_OPTIONS.map((days) => <button key={days} type="button" onClick={() => setClosedPeriodDays(days)} className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${closedPeriodDays === days ? "bg-slate-800 text-white" : "border border-[var(--app-border)] bg-white text-slate-600 hover:bg-slate-50"}`}>{days} derniers jours</button>)}
        </div> : null}
      </div>
      <section aria-label="Filtres des OF" className="mt-3 grid gap-2 rounded-2xl border border-[var(--app-border)] bg-white p-4 sm:grid-cols-2 xl:grid-cols-4">
        <input className={fieldClass} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="OF, client, article…" />
        <Filter value={status} setValue={setStatus} values={["Tous", ...Object.values(ERP_OPERATION_STATUS_LABELS)]} />
        <Filter value={machineFilter} setValue={setMachineFilter} values={["Toutes", ...erpMachineOptions]} />
        <Filter value={department} setValue={setDepartment} values={["Tous", ...erpDepartmentOptions]} />
        <Filter value={delay} setValue={setDelay} values={["Tous", "En retard", "À l’heure"]} />
      </section>
      <div className="mt-5 overflow-hidden rounded-2xl border border-[var(--app-border)] bg-white">
        <div className="hidden grid-cols-[1fr_1.2fr_1fr_110px_120px_100px] gap-3 border-b bg-slate-50 p-4 text-xs font-semibold uppercase text-slate-500 md:grid"><span>OF / article</span><span>Client</span><span>État</span><span>Échéance</span><span>Machine</span><span>Progression</span></div>
        {filteredErp.length ? filteredErp.map((item) => <Link href={`/of/${item.id}`} key={item.id} className="grid gap-3 border-b border-[var(--app-border)] p-4 last:border-0 hover:bg-slate-50 md:grid-cols-[1fr_1.2fr_1fr_110px_120px_100px] md:items-center">
          <div><strong className="block text-sm">{item.id}</strong><span className="text-xs text-slate-500">{item.article}</span></div>
          <div><strong className="block text-sm font-medium">{item.customer}</strong><span className="text-xs text-slate-500">{item.description}</span></div>
          <div className="flex flex-wrap gap-1"><StatusPill tone={erpOperationStatusTone(item.status)}>{ERP_OPERATION_STATUS_LABELS[item.status]}</StatusPill></div>
          <span className={item.isLate ? "text-sm font-semibold text-red-700" : "text-sm"}>{item.dueDate ? formatEuropeanDate(item.dueDate) : "—"}</span>
          <span className="text-sm">{item.machine}</span>
          <div><span className="text-xs font-semibold">{item.progress} %</span><div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100"><span className="block h-full bg-[var(--app-primary)]" style={{ width: `${item.progress}%` }} /></div></div>
        </Link>) : <div className="p-4"><EmptyState title={isLoading ? "Chargement…" : "Aucun OF"} description="Aucun ordre ne correspond aux filtres." /></div>}
      </div>
    </div>;
  }

  return <div className="mx-auto max-w-7xl"><ModuleHeader eyebrow="Production" title="Ordres de fabrication" description="Consultez les OF, leurs gammes, leur avancement et les problèmes détectés dans les données de démonstration." />
    <section aria-label="Filtres des OF" className="mt-6 grid gap-2 rounded-2xl border border-[var(--app-border)] bg-white p-4 sm:grid-cols-2 xl:grid-cols-6"><input className={fieldClass} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="OF, client, article…" /><Filter value={status} setValue={setStatus} values={["Tous", "À lancer", "En production", "Bloqué", "Terminé"]} /><Filter value={priority} setValue={setPriority} values={["Toutes", "Normale", "Haute", "Urgente", "Bloquante"]} /><Filter value={machineFilter} setValue={setMachineFilter} values={["Toutes", ...data.machines.map((item) => item.id)]} /><Filter value={department} setValue={setDepartment} values={["Tous", ...new Set(data.machines.map((item) => item.department))]} /><Filter value={delay} setValue={setDelay} values={["Tous", "En retard", "À l’heure"]} /></section>
    <div className="mt-5 overflow-hidden rounded-2xl border border-[var(--app-border)] bg-white"><div className="hidden grid-cols-[1fr_1.2fr_1fr_110px_120px_100px] gap-3 border-b bg-slate-50 p-4 text-xs font-semibold uppercase text-slate-500 md:grid"><span>OF / article</span><span>Client</span><span>État</span><span>Échéance</span><span>Machine</span><span>Progression</span></div>{filteredDemo.length ? filteredDemo.map((item) => { const current = item.operations.find((operation) => operation.status === "En cours" || operation.status === "Bloquée") ?? item.operations[0]; const late = new Date(item.dueDate) < new Date("2026-07-13T00:00:00.000Z") && item.status !== "Terminé"; return <Link href={`/of/${item.id}`} key={item.id} className="grid gap-3 border-b border-[var(--app-border)] p-4 last:border-0 hover:bg-slate-50 md:grid-cols-[1fr_1.2fr_1fr_110px_120px_100px] md:items-center"><div><strong className="block text-sm">{item.id}</strong><span className="text-xs text-slate-500">{item.article}</span></div><div><strong className="block text-sm font-medium">{item.customer}</strong><span className="text-xs text-slate-500">{item.description}</span></div><div className="flex flex-wrap gap-1"><StatusPill tone={item.status === "Bloqué" ? "danger" : item.status === "En production" ? "info" : "neutral"}>{item.status}</StatusPill><StatusPill tone={item.priority === "Urgente" || item.priority === "Bloquante" ? "danger" : "warning"}>{item.priority}</StatusPill></div><span className={late ? "text-sm font-semibold text-red-700" : "text-sm"}>{formatEuropeanDate(item.dueDate)}</span><span className="text-sm">{current.machineId ?? "Non définie"}</span><div><span className="text-xs font-semibold">{item.progress} %</span><div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100"><span className="block h-full bg-[var(--app-primary)]" style={{ width: `${item.progress}%` }} /></div></div></Link>; }) : <div className="p-4"><EmptyState title="Aucun OF" description="Aucun ordre ne correspond aux filtres." /></div>}</div>
  </div>;
}

function Filter({ value, setValue, values }: { value: string; setValue: (value: string) => void; values: Iterable<string> }) { return <select className={fieldClass} value={value} onChange={(event) => setValue(event.target.value)}>{[...values].map((item) => <option key={item}>{item}</option>)}</select>; }

/** Même gabarit que les onglets de département (Atelier, Parc Machines) : pastille comptée, un seul onglet actif à la fois. */
function WorkOrderViewTabButton({ label, count, isSelected, onClick }: { label: string; count: number; isSelected: boolean; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={`shrink-0 rounded-full px-3 py-2 text-sm font-semibold transition ${isSelected ? "bg-[var(--app-primary)] text-white" : "border border-[var(--app-border)] bg-white text-slate-600 hover:bg-slate-50"}`}>
    {label} <span className={`text-xs font-normal ${isSelected ? "text-white/80" : "text-slate-500"}`}>({count.toLocaleString("fr-BE")})</span>
  </button>;
}
