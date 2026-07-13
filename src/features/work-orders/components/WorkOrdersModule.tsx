"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { EmptyState, fieldClass, formatEuropeanDate, ModuleHeader, StatusPill } from "@/components/ui/ModuleUi";
import { useDemoData } from "@/features/demo/services/demo-repository";

export function WorkOrdersModule() {
  const data = useDemoData();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("Tous");
  const [priority, setPriority] = useState("Toutes");
  const [machine, setMachine] = useState("Toutes");
  const [department, setDepartment] = useState("Tous");
  const [delay, setDelay] = useState("Tous");
  const filtered = useMemo(() => data.workOrders.filter((item) => {
    const text = `${item.id} ${item.customer} ${item.article} ${item.description}`.toLocaleLowerCase("fr");
    const machines = item.operations.map((operation) => operation.machineId);
    const departments = item.operations.map((operation) => operation.department);
    const late = new Date(item.dueDate) < new Date("2026-07-13T00:00:00.000Z") && item.status !== "Terminé";
    return text.includes(search.toLocaleLowerCase("fr")) && (status === "Tous" || item.status === status) && (priority === "Toutes" || item.priority === priority) && (machine === "Toutes" || machines.includes(machine)) && (department === "Tous" || departments.includes(department)) && (delay === "Tous" || (delay === "En retard") === late);
  }), [data.workOrders, delay, department, machine, priority, search, status]);
  return <div className="mx-auto max-w-7xl"><ModuleHeader eyebrow="Production" title="Ordres de fabrication" description="Consultez les OF, leurs gammes, leur avancement et les problèmes détectés dans les données de démonstration." />
    <section aria-label="Filtres des OF" className="mt-6 grid gap-2 rounded-2xl border border-[var(--app-border)] bg-white p-4 sm:grid-cols-2 xl:grid-cols-6"><input className={fieldClass} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="OF, client, article…" /><Filter value={status} setValue={setStatus} values={["Tous", "À lancer", "En production", "Bloqué", "Terminé"]} /><Filter value={priority} setValue={setPriority} values={["Toutes", "Normale", "Haute", "Urgente", "Bloquante"]} /><Filter value={machine} setValue={setMachine} values={["Toutes", ...data.machines.map((item) => item.id)]} /><Filter value={department} setValue={setDepartment} values={["Tous", ...new Set(data.machines.map((item) => item.department))]} /><Filter value={delay} setValue={setDelay} values={["Tous", "En retard", "À l’heure"]} /></section>
    <div className="mt-5 overflow-hidden rounded-2xl border border-[var(--app-border)] bg-white"><div className="hidden grid-cols-[1fr_1.2fr_1fr_110px_120px_100px] gap-3 border-b bg-slate-50 p-4 text-xs font-semibold uppercase text-slate-500 md:grid"><span>OF / article</span><span>Client</span><span>État</span><span>Échéance</span><span>Machine</span><span>Progression</span></div>{filtered.length ? filtered.map((item) => { const current = item.operations.find((operation) => operation.status === "En cours" || operation.status === "Bloquée") ?? item.operations[0]; const late = new Date(item.dueDate) < new Date("2026-07-13T00:00:00.000Z") && item.status !== "Terminé"; return <Link href={`/of/${item.id}`} key={item.id} className="grid gap-3 border-b border-[var(--app-border)] p-4 last:border-0 hover:bg-slate-50 md:grid-cols-[1fr_1.2fr_1fr_110px_120px_100px] md:items-center"><div><strong className="block text-sm">{item.id}</strong><span className="text-xs text-slate-500">{item.article}</span></div><div><strong className="block text-sm font-medium">{item.customer}</strong><span className="text-xs text-slate-500">{item.description}</span></div><div className="flex flex-wrap gap-1"><StatusPill tone={item.status === "Bloqué" ? "danger" : item.status === "En production" ? "info" : "neutral"}>{item.status}</StatusPill><StatusPill tone={item.priority === "Urgente" || item.priority === "Bloquante" ? "danger" : "warning"}>{item.priority}</StatusPill></div><span className={late ? "text-sm font-semibold text-red-700" : "text-sm"}>{formatEuropeanDate(item.dueDate)}</span><span className="text-sm">{current.machineId ?? "Non définie"}</span><div><span className="text-xs font-semibold">{item.progress} %</span><div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100"><span className="block h-full bg-[var(--app-primary)]" style={{ width: `${item.progress}%` }} /></div></div></Link>; }) : <div className="p-4"><EmptyState title="Aucun OF" description="Aucun ordre ne correspond aux filtres." /></div>}</div>
  </div>;
}

function Filter({ value, setValue, values }: { value: string; setValue: (value: string) => void; values: Iterable<string> }) { return <select className={fieldClass} value={value} onChange={(event) => setValue(event.target.value)}>{[...values].map((item) => <option key={item}>{item}</option>)}</select>; }
