"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { formatEuropeanDate, ModuleHeader, secondaryButton, StatusPill } from "@/components/ui/ModuleUi";
import { useDemoData } from "@/features/demo/services/demo-repository";
import type { ErpPlanningOverview } from "@/features/erp-import/types/erp-import";
import { useSettings } from "@/features/settings/components/SettingsProvider";

export function MachinesModule() {
  const { settings } = useSettings();
  const data = useDemoData();
  const [overview, setOverview] = useState<ErpPlanningOverview | null>(null);
  useEffect(() => {
    let active = true;
    void fetch("/api/erp/imports", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : null)
      .then((payload) => { if (active && payload) setOverview(payload as ErpPlanningOverview); })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);
  const machines = useMemo(() => [...settings.production.machines].sort((a, b) => Number(Boolean(b.favorite)) - Number(Boolean(a.favorite)) || a.order - b.order), [settings.production.machines]);
  const mappedCounts = new Map<string, number>();
  const validMachineIds = new Set(machines.filter((machine) => machine.active && !machine.deleted).map((machine) => machine.id));
  overview?.machineCodes.forEach((entry) => { if (entry.machineId) mappedCounts.set(entry.machineId, (mappedCounts.get(entry.machineId) ?? 0) + entry.operationCount); });

  return <div className="mx-auto max-w-7xl">
    <ModuleHeader eyebrow="Référentiel de production" title="Parc Machines" description="Référentiel central du Planning, enrichi des maintenances et actions locales existantes. Une machine supprimée reste conservée pour détecter les anciennes affectations." actions={<><Link href="/planning" className={secondaryButton}>Correspondances ERP</Link><Link href="/reglages" className={secondaryButton}>Gérer les machines</Link><Link href="/machines/maintenance" className={secondaryButton}>Planning maintenance</Link></>} />
    <section className="mt-6 grid gap-3 sm:grid-cols-3"><Metric label="Machines actives" value={machines.filter((machine) => machine.active && !machine.deleted).length} /><Metric label="Machines supprimées" value={machines.filter((machine) => machine.deleted).length} /><Metric label="Codes ERP non mappés" value={overview?.machineCodes.filter((entry) => !entry.machineId || !validMachineIds.has(entry.machineId)).length ?? 0} /></section>
    <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{machines.map((machine) => {
      const department = settings.production.departments.find((entry) => entry.id === machine.departmentId);
      const demoMachine = data.machines.find((entry) => entry.id === machine.id);
      const maintenance = data.maintenance.filter((entry) => entry.machineId === machine.id && entry.status !== "Terminée").sort((a, b) => a.date.localeCompare(b.date))[0];
      const actions = data.actions.filter((entry) => entry.contextLink?.module === "machine" && entry.contextLink.id === machine.id && entry.statut !== "Fait");
      const status = machine.deleted ? "Supprimée" : demoMachine?.status ?? (machine.active ? "Active" : "Inactive");
      const tone = machine.deleted || status === "En panne" ? "danger" : status === "Disponible" || status === "Active" ? "success" : status === "Maintenance prévue" ? "warning" : "neutral";
      return <article key={machine.id} className={`rounded-2xl border border-[var(--app-border)] bg-white p-5 shadow-sm ${machine.deleted ? "opacity-60" : ""}`}>
        <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-slate-500">{department?.label || machine.department || "Atelier non défini"}</p><h2 className="mt-1 text-xl font-bold">{machine.favorite ? "★ " : ""}{machine.displayName}</h2><p className="mt-1 font-mono text-xs text-slate-500">{machine.id}{machine.erpCode ? ` · ERP ${machine.erpCode}` : ""}</p></div><StatusPill tone={tone}>{status}</StatusPill></div>
        <dl className="mt-5 grid grid-cols-2 gap-3 text-sm"><Info label="Type" value={machine.machineType || demoMachine?.type || "—"} /><Info label="Opérations mappées" value={(mappedCounts.get(machine.id) ?? 0).toLocaleString("fr-BE")} /><Info label="Maintenance" value={maintenance ? formatEuropeanDate(maintenance.date) : "Aucune"} /><Info label="Actions ouvertes" value={actions.length.toLocaleString("fr-BE")} /><Info label="Capacité future" value={machine.futureCapacityHours == null ? "Non définie" : `${machine.futureCapacityHours.toLocaleString("fr-BE")} h/j`} /><Info label="Ordre" value={String(machine.order + 1)} /></dl>
        {machine.comments ? <p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-600">{machine.comments}</p> : null}
        {demoMachine ? <Link href={`/machines/${machine.id}`} className={`${secondaryButton} mt-4 w-full`}>Voir la fiche et les actions</Link> : null}
      </article>;
    })}</div>
  </div>;
}

function Metric({ label, value }: { label: string; value: number }) { return <div className="rounded-2xl border border-[var(--app-border)] bg-white p-4"><p className="text-xs font-bold uppercase text-slate-500">{label}</p><p className="mt-1 text-3xl font-bold">{value.toLocaleString("fr-BE")}</p></div>; }
function Info({ label, value }: { label: string; value: string }) { return <div><dt className="text-xs text-slate-500">{label}</dt><dd className="font-semibold">{value}</dd></div>; }
