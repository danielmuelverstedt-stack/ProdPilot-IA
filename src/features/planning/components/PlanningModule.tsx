"use client";
/* Les logos locaux en data URL ne passent pas par l’optimiseur d’images. */
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useMemo, useState } from "react";
import { fieldClass, formatEuropeanDate, ModuleHeader, primaryButton, secondaryButton, StatusPill } from "@/components/ui/ModuleUi";
import { updateDemoData, useDemoData } from "@/features/demo/services/demo-repository";
import { useSettings } from "@/features/settings/components/SettingsProvider";

type GroupMode = "machine" | "department";
type PeriodMode = "day" | "week";

export function PlanningModule() {
  const data = useDemoData();
  const { settings } = useSettings();
  const [groupMode, setGroupMode] = useState<GroupMode>("machine");
  const [period, setPeriod] = useState<PeriodMode>("week");
  const [department, setDepartment] = useState("Tous");
  const [machine, setMachine] = useState("Toutes");
  const [customer, setCustomer] = useState("");
  const [workOrder, setWorkOrder] = useState("");
  const [printOpen, setPrintOpen] = useState(false);
  const rows = useMemo(() => data.planning.map((plan) => {
    const order = data.workOrders.find((item) => item.id === plan.workOrderId)!;
    const operation = order.operations.find((item) => item.id === plan.operationId)!;
    const machineItem = data.machines.find((item) => item.id === plan.machineId)!;
    return { plan, order, operation, machine: machineItem };
  }).filter((row) => (department === "Tous" || row.machine.department === department) && (machine === "Toutes" || row.machine.id === machine) && row.order.customer.toLocaleLowerCase("fr").includes(customer.toLocaleLowerCase("fr")) && row.order.id.toLocaleLowerCase("fr").includes(workOrder.toLocaleLowerCase("fr"))), [customer, data.machines, data.planning, data.workOrders, department, machine, workOrder]);
  const groups = Map.groupBy(rows, (row) => groupMode === "machine" ? `${row.machine.id} · ${row.machine.displayName}` : row.machine.department);

  function move(id: string, direction: -1 | 1) {
    const index = data.planning.findIndex((item) => item.id === id);
    const targetIndex = index + direction;
    if (index < 0 || targetIndex < 0 || targetIndex >= data.planning.length) return;
    const current = data.planning[index]; const target = data.planning[targetIndex];
    if (!window.confirm(`Déplacer ${current.workOrderId} ${direction < 0 ? "avant" : "après"} ${target.workOrderId} ?\nImpact : leurs créneaux planifiés seront intervertis.`)) return;
    updateDemoData((draft) => { const first = draft.planning[index]; const second = draft.planning[targetIndex]; [first.startAt, second.startAt] = [second.startAt, first.startAt]; [first.endAt, second.endAt] = [second.endAt, first.endAt]; });
  }

  function changeMachine(id: string, nextMachine: string) {
    const plan = data.planning.find((item) => item.id === id); const target = data.machines.find((item) => item.id === nextMachine);
    if (!plan || !target || !window.confirm(`Déplacer ${plan.workOrderId} vers ${target.displayName} ?\nImpact : vérifier la compatibilité d’outillage et la charge du nouveau poste.`)) return;
    updateDemoData((draft) => { const item = draft.planning.find((entry) => entry.id === id); if (item) item.machineId = nextMachine; });
  }

  function changeDate(id: string, date: string) {
    const plan = data.planning.find((item) => item.id === id); if (!plan || !window.confirm(`Replanifier ${plan.workOrderId} au ${formatEuropeanDate(date)} ?\nImpact : les opérations suivantes doivent être revérifiées.`)) return;
    updateDemoData((draft) => { const item = draft.planning.find((entry) => entry.id === id); if (!item) return; const duration = new Date(item.endAt).getTime() - new Date(item.startAt).getTime(); const start = new Date(`${date}T06:00:00.000Z`); item.startAt = start.toISOString(); item.endAt = new Date(start.getTime() + duration).toISOString(); });
  }

  const overloads = [...groups].filter(([, entries]) => entries.reduce((sum, row) => sum + row.operation.plannedDurationHours, 0) > (period === "day" ? 16 : 40));
  return <div className="mx-auto max-w-[1500px]"><ModuleHeader eyebrow="Ordonnancement local" title="Planning" description="Arbitrez le planning mock par machine ou département. Chaque mouvement est confirmé et conservé localement." actions={<button className={secondaryButton} onClick={() => setPrintOpen((value) => !value)}>Aperçu avant impression</button>} />
    <section className="mt-6 flex flex-wrap gap-2 rounded-2xl border border-[var(--app-border)] bg-white p-4"><Toggle active={groupMode === "machine"} onClick={() => setGroupMode("machine")}>Par machine</Toggle><Toggle active={groupMode === "department"} onClick={() => setGroupMode("department")}>Par département</Toggle><Toggle active={period === "day"} onClick={() => setPeriod("day")}>Jour</Toggle><Toggle active={period === "week"} onClick={() => setPeriod("week")}>Semaine</Toggle><select className={fieldClass} value={department} onChange={(event) => setDepartment(event.target.value)}><option>Tous</option>{settings.production.departments.slice(0, 3).map((item) => <option key={item}>{item}</option>)}</select><select className={fieldClass} value={machine} onChange={(event) => setMachine(event.target.value)}><option>Toutes</option>{data.machines.map((item) => <option key={item.id} value={item.id}>{item.displayName}</option>)}</select><input className={fieldClass} value={customer} onChange={(event) => setCustomer(event.target.value)} placeholder="Client" /><input className={fieldClass} value={workOrder} onChange={(event) => setWorkOrder(event.target.value)} placeholder="OF" /></section>
    {overloads.length ? <aside className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><strong>Surcharge détectée :</strong> {overloads.map(([name]) => name).join(", ")}. Vérifiez les créneaux et les maintenances.</aside> : null}
    {printOpen ? <PlanningPrint rows={rows} onClose={() => setPrintOpen(false)} /> : null}
    <div className="mt-5 space-y-5">{[...groups].map(([group, entries]) => <section key={group} className="overflow-hidden rounded-2xl border border-[var(--app-border)] bg-white"><header className="flex flex-wrap items-center justify-between gap-2 border-b bg-slate-50 p-4"><h2 className="font-semibold">{group}</h2><span className="text-xs text-slate-500">{entries.reduce((sum, row) => sum + row.operation.plannedDurationHours, 0)} h planifiées</span></header><div className="grid gap-3 p-4">{entries.sort((a, b) => a.plan.startAt.localeCompare(b.plan.startAt)).map((row, index) => { const conflict = data.maintenance.some((item) => item.machineId === row.machine.id && item.status !== "Terminée" && item.date.slice(0, 10) === row.plan.startAt.slice(0, 10)); const risk = row.order.dueDate <= row.plan.endAt.slice(0, 10) || row.machine.status === "En panne"; return <article key={row.plan.id} className={`rounded-xl border p-4 ${conflict ? "border-red-300 bg-red-50/40" : "border-[var(--app-border)]"}`}><div className="grid gap-3 lg:grid-cols-[1fr_1fr_150px_190px_auto] lg:items-center"><div><Link href={`/of/${row.order.id}`} className="font-semibold text-[var(--app-primary)] hover:underline">{row.order.id}</Link><p className="text-sm">{row.order.customer}</p><p className="text-xs text-slate-500">{row.order.article} · {row.order.quantity} pièces</p></div><div><p className="text-sm font-medium">Op. {row.operation.number} · {row.operation.description}</p><p className="text-xs text-slate-500">{row.operation.plannedDurationHours} h · {row.machine.displayName}</p></div><div className="flex flex-wrap gap-1"><StatusPill tone={risk ? "danger" : "success"}>{risk ? "Risque délai" : "Délai maîtrisé"}</StatusPill>{conflict ? <StatusPill tone="danger">Conflit maintenance</StatusPill> : null}</div><div className="text-xs"><p>{formatEuropeanDate(row.plan.startAt, true)}</p><p>→ {formatEuropeanDate(row.plan.endAt, true)}</p></div><div className="flex flex-wrap gap-1"><button className={secondaryButton} disabled={index === 0} onClick={() => move(row.plan.id, -1)}>↑</button><button className={secondaryButton} disabled={index === entries.length - 1} onClick={() => move(row.plan.id, 1)}>↓</button><select aria-label={`Machine de ${row.order.id}`} className={`${fieldClass} max-w-36`} value={row.machine.id} onChange={(event) => changeMachine(row.plan.id, event.target.value)}>{data.machines.filter((item) => item.department === row.machine.department).map((item) => <option key={item.id} value={item.id}>{item.displayName}</option>)}</select><input aria-label={`Date de ${row.order.id}`} type="date" className={fieldClass} value={row.plan.startAt.slice(0, 10)} onChange={(event) => changeDate(row.plan.id, event.target.value)} /></div></div></article>; })}</div></section>)}</div>
  </div>;
}

function Toggle({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) { return <button type="button" onClick={onClick} className={`${secondaryButton} ${active ? "border-[var(--app-primary)] bg-blue-50 text-[var(--app-primary)]" : ""}`}>{children}</button>; }

type PlanningRow = { plan: ReturnType<typeof useDemoData>["planning"][number]; order: ReturnType<typeof useDemoData>["workOrders"][number]; operation: ReturnType<typeof useDemoData>["workOrders"][number]["operations"][number]; machine: ReturnType<typeof useDemoData>["machines"][number] };

function PlanningPrint({ rows, onClose }: { rows: PlanningRow[]; onClose: () => void }) {
  const { settings } = useSettings();
  const columns = [...settings.print.columns].filter((item) => item.visible).sort((a, b) => a.order - b.order);
  const visible = new Set(columns.map((item) => item.id));
  return <section className="mt-5 rounded-2xl border-2 border-dashed border-slate-300 bg-white p-5 print:border-0 print:p-0"><div className="mb-4 flex flex-wrap justify-between gap-2 print:hidden"><div><h2 className="font-semibold">Aperçu avant impression</h2><p className="text-xs text-slate-500">{settings.print.paperSize} · {settings.print.orientation}</p></div><div className="flex gap-2"><button className={primaryButton} onClick={() => window.print()}>Imprimer</button><button className={secondaryButton} onClick={onClose}>Fermer</button></div></div><header className="flex items-center gap-4 border-b pb-4">{visible.has("logo") && settings.company.logoDataUrl ? <img src={settings.company.logoDataUrl} alt={`Logo ${settings.company.name}`} width={64} height={48} className="h-12 w-16 object-contain" /> : null}<div>{visible.has("company") ? <h2 className="text-xl font-bold">{settings.company.name}</h2> : null}{visible.has("datetime") ? <p className="text-sm text-slate-500">Planning machines · {formatEuropeanDate(new Date().toISOString(), true)}</p> : null}</div></header><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[700px] text-left text-xs"><thead><tr className="border-b">{columns.filter((item) => !["logo", "company", "datetime"].includes(item.id)).map((column) => <th className="p-2" key={column.id}>{column.label}</th>)}</tr></thead><tbody>{rows.map((row) => <tr className="border-b" key={row.plan.id}>{columns.filter((item) => !["logo", "company", "datetime"].includes(item.id)).map((column) => <td className="p-2" key={column.id}>{printValue(column.id, row)}</td>)}</tr>)}</tbody></table></div></section>;
}

function printValue(column: string, row: PlanningRow): React.ReactNode { const values: Record<string, React.ReactNode> = { machine: row.machine.displayName, "work-order": row.order.id, customer: row.order.customer, article: row.order.article, description: row.order.description, quantity: row.order.quantity, operation: `${row.operation.number} · ${row.operation.description}`, "planned-time": `${row.operation.plannedDurationHours} h`, "planned-date": formatEuropeanDate(row.plan.startAt), priority: row.order.priority, "delivery-date": formatEuropeanDate(row.order.dueDate), comments: row.plan.comments, completed: "□", problem: "□" }; return values[column] ?? "—"; }
