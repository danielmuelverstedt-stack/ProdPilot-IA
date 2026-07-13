"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { EmptyState, fieldClass, formatEuropeanDate, ModuleHeader, primaryButton, secondaryButton, StatusPill } from "@/components/ui/ModuleUi";
import { updateDemoData, useDemoData } from "@/features/demo/services/demo-repository";
import type { ActionStatus, Priority, ProductionAction } from "@/features/demo/types/demo";

export function ActionsModule() {
  const data = useDemoData();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("Tous");
  const [priority, setPriority] = useState("Toutes");
  const [responsible, setResponsible] = useState("Tous");
  const [origin, setOrigin] = useState("Toutes");
  const [creating, setCreating] = useState(false);
  const filtered = useMemo(() => data.actions.filter((item) => {
    const text = `${item.id} ${item.title} ${item.description} ${item.workOrderId ?? ""}`.toLocaleLowerCase("fr");
    return text.includes(search.toLocaleLowerCase("fr")) && (status === "Tous" || item.status === status) && (priority === "Toutes" || item.priority === priority) && (responsible === "Tous" || item.responsible === responsible) && (origin === "Toutes" || item.sourceType === origin);
  }), [data.actions, origin, priority, responsible, search, status]);

  function changeStatus(action: ProductionAction, nextStatus: ActionStatus) {
    updateDemoData((draft) => { const target = draft.actions.find((item) => item.id === action.id); if (target) { target.status = nextStatus; target.history.unshift({ id: crypto.randomUUID(), date: new Date().toISOString(), author: "Daniel Mülverstedt", description: `Statut modifié : ${nextStatus}` }); } });
  }

  function remove(action: ProductionAction) {
    if (!window.confirm(`Supprimer l’action « ${action.title} » ? Cette opération est définitive dans la démonstration.`)) return;
    updateDemoData((draft) => { draft.actions = draft.actions.filter((item) => item.id !== action.id); });
  }

  return <div className="mx-auto max-w-7xl"><ModuleHeader eyebrow="Pilotage opérationnel" title="Actions" description="Centralisez les décisions et engagements issus des e-mails, réunions, OF, machines et demandes." actions={<button className={primaryButton} onClick={() => setCreating(true)}>Créer une action</button>} />
    {creating ? <CreateActionForm onClose={() => setCreating(false)} /> : null}
    <section aria-label="Filtres des actions" className="mt-6 grid gap-2 rounded-2xl border border-[var(--app-border)] bg-white p-4 sm:grid-cols-2 xl:grid-cols-5"><input className={fieldClass} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher…" /><Select value={status} onChange={setStatus} values={["Tous", "Ouverte", "En cours", "Reportée", "Terminée"]} /><Select value={priority} onChange={setPriority} values={["Toutes", "Basse", "Normale", "Haute", "Urgente", "Bloquante"]} /><Select value={responsible} onChange={setResponsible} values={["Tous", ...new Set(data.actions.map((item) => item.responsible))]} /><Select value={origin} onChange={setOrigin} values={["Toutes", ...new Set(data.actions.map((item) => item.sourceType))]} /></section>
    <div className="mt-5 grid gap-3">{filtered.length ? filtered.map((action) => <article key={action.id} className="rounded-2xl border border-[var(--app-border)] bg-white p-5 shadow-sm"><div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div className="min-w-0"><div className="flex flex-wrap gap-2"><StatusPill tone={action.priority === "Bloquante" || action.priority === "Urgente" ? "danger" : action.priority === "Haute" ? "warning" : "neutral"}>{action.priority}</StatusPill><StatusPill tone={action.status === "Terminée" ? "success" : action.status === "En cours" ? "info" : "neutral"}>{action.status}</StatusPill><span className="text-xs text-slate-500">{action.id}</span></div><Link href={`/actions/${action.id}`} className="mt-3 block text-lg font-semibold hover:text-[var(--app-primary)]">{action.title}</Link><p className="mt-2 text-sm leading-6 text-slate-600">{action.description}</p><dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500"><div><dt className="inline font-semibold">Responsable : </dt><dd className="inline">{action.responsible}</dd></div><div><dt className="inline font-semibold">Échéance : </dt><dd className="inline">{formatEuropeanDate(action.dueDate)}</dd></div><div><dt className="inline font-semibold">Origine : </dt><dd className="inline">{action.sourceType}</dd></div>{action.workOrderId ? <div><dt className="inline font-semibold">OF : </dt><dd className="inline"><Link className="underline" href={`/of/${action.workOrderId}`}>{action.workOrderId}</Link></dd></div> : null}</dl></div><div className="flex shrink-0 flex-wrap gap-2"><button className={secondaryButton} onClick={() => changeStatus(action, "Terminée")}>Terminer</button><button className={secondaryButton} onClick={() => changeStatus(action, "Reportée")}>Reporter</button><Link className={secondaryButton} href={`/actions/${action.id}`}>Modifier</Link><button className={`${secondaryButton} text-red-700`} onClick={() => remove(action)}>Supprimer</button></div></div></article>) : <EmptyState title="Aucune action" description="Aucune action ne correspond aux filtres sélectionnés." />}</div>
  </div>;
}

function Select({ value, onChange, values }: { value: string; onChange: (value: string) => void; values: Iterable<string> }) { return <select className={fieldClass} value={value} onChange={(event) => onChange(event.target.value)}>{[...values].map((item) => <option key={item}>{item}</option>)}</select>; }

function CreateActionForm({ onClose }: { onClose: () => void }) {
  function submit(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); const form = new FormData(event.currentTarget); const now = new Date().toISOString(); updateDemoData((draft) => { const id = `ACT-${String(draft.actions.length + 1).padStart(3, "0")}`; draft.actions.unshift({ id, title: String(form.get("title")), description: String(form.get("description")), responsible: String(form.get("responsible")), department: String(form.get("department")), priority: String(form.get("priority")) as Priority, status: "Ouverte", dueDate: String(form.get("dueDate")), createdAt: now.slice(0, 10), sourceType: "manual", sourceId: null, workOrderId: String(form.get("workOrderId")) || null, machineId: null, project: null, comments: [], history: [{ id: crypto.randomUUID(), date: now, author: "Daniel Mülverstedt", description: "Action créée manuellement" }] }); }); onClose(); }
  return <form onSubmit={submit} className="mt-6 grid gap-3 rounded-2xl border border-blue-200 bg-blue-50/40 p-5 sm:grid-cols-2"><h2 className="font-semibold sm:col-span-2">Nouvelle action</h2><input required name="title" className={fieldClass} placeholder="Titre" /><input required name="responsible" className={fieldClass} placeholder="Responsable" /><textarea required name="description" className={`${fieldClass} min-h-24 py-3 sm:col-span-2`} placeholder="Description" /><input required name="department" className={fieldClass} placeholder="Département" /><select name="priority" className={fieldClass}><option>Normale</option><option>Haute</option><option>Urgente</option><option>Bloquante</option></select><input required name="dueDate" type="date" className={fieldClass} /><input name="workOrderId" className={fieldClass} placeholder="OF lié (facultatif)" /><div className="flex gap-2 sm:col-span-2"><button className={primaryButton}>Créer</button><button type="button" className={secondaryButton} onClick={onClose}>Annuler</button></div></form>;
}
