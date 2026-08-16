"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ActionFormDialog } from "@/features/actions/components/ActionFormDialog";
import { actionStatusTone } from "@/features/actions/services/action-status";
import { Button, EmptyState, fieldClass, FilterBar, formatEuropeanDate, MetricCard, primaryButton, SearchInput, secondaryButton, Select, StatusPill } from "@/components/ui/ModuleUi";
import { updateDemoData, useDemoData } from "@/features/demo/services/demo-repository";
import { MaintenanceProblemDialog, MachinePhoto } from "@/features/maintenance/components/MaintenanceProblemDialog";
import { addMaintenanceProblemComment, linkActionToMaintenanceProblem, resolveMaintenanceProblem, setProblemIncludedInMeeting, updateMaintenanceProblem } from "@/features/maintenance/services/maintenance-problem-service";
import { useMachinePhotos } from "@/features/machines/services/machine-photo-store";
import { useSettings } from "@/features/settings/components/SettingsProvider";
import { currentDemoUserName } from "@/features/settings/services/current-user";
import type { ActionContextLink, MaintenanceProblemStatus } from "@/features/demo/types/demo";
import { createMasterDataResolver, missingReferenceLabel } from "@/features/master-data/services/master-data-resolver";

type Filter = "Ouverts" | "Arrêt" | "En cours" | "En attente" | "Résolus" | "Tous";
function statusTone(status: MaintenanceProblemStatus): "neutral" | "info" | "warning" | "success" { return status === "Résolu" ? "success" : status === "En attente" ? "warning" : status === "En cours" ? "info" : "neutral"; }

export function MaintenanceProblemsWorkspace({ meetingId = null, machineId = null }: { meetingId?: string | null; machineId?: string | null }) {
  const data = useDemoData();
  const { settings } = useSettings();
  const photos = useMachinePhotos();
  const meeting = meetingId ? data.meetings.find((item) => item.id === meetingId) : null;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("Ouverts");
  const [creating, setCreating] = useState(false);
  const [creatingAction, setCreatingAction] = useState(false);
  const [comment, setComment] = useState("");
  const today = new Date().toISOString().slice(0, 10);
  const references = useMemo(() => createMasterDataResolver({ machines: settings.production.machines }), [settings.production.machines]);
  const problems = useMemo(() => data.maintenanceProblems.filter((problem) => !machineId || problem.machineId === machineId).filter((problem) => {
    const machine = references.machine(problem.machineId).entity;
    const text = `${problem.title} ${problem.description} ${problem.productionImpact} ${machine?.id ?? ""} ${machine?.displayName ?? ""}`.toLocaleLowerCase("fr");
    if (!text.includes(query.toLocaleLowerCase("fr"))) return false;
    if (filter === "Ouverts") return problem.status !== "Résolu";
    if (filter === "Arrêt") return problem.machineStopped && problem.status !== "Résolu";
    if (filter === "Résolus") return problem.status === "Résolu";
    if (filter === "En cours" || filter === "En attente") return problem.status === filter;
    return true;
  }).sort((a, b) => {
    const aIncluded = meeting?.maintenanceProblemIds.includes(a.id) ? 1 : 0;
    const bIncluded = meeting?.maintenanceProblemIds.includes(b.id) ? 1 : 0;
    return bIncluded - aIncluded || b.updatedAt.localeCompare(a.updatedAt);
  }), [data.maintenanceProblems, filter, machineId, references, meeting?.maintenanceProblemIds, query]);
  const selected = problems.find((item) => item.id === selectedId) ?? problems[0] ?? null;
  const openProblems = data.maintenanceProblems.filter((item) => item.status !== "Résolu");
  const relevantMachineIds = new Set(openProblems.map((item) => item.machineId));
  const maintenanceActions = data.actions.filter((action) => action.statut !== "Fait" && action.contextLinks.some((link) => link.module === "maintenanceProblem" || link.module === "maintenance"));
  const lateProblems = openProblems.filter((item) => item.dueDate && item.dueDate < today).length;
  const selectedActions = selected ? data.actions.filter((action) => selected.actionIds.includes(action.id) || action.contextLinks.some((link) => link.module === "maintenanceProblem" && link.id === selected.id)) : [];
  const selectedMachineResolution = references.machine(selected?.machineId);
  const selectedMachine = selectedMachineResolution.entity;
  const author = currentDemoUserName(settings);

  const problemLink: ActionContextLink | null = selected ? { module: "maintenanceProblem", id: selected.id, label: selected.title, href: `/machines/${selected.machineId}` } : null;
  const machineLink: ActionContextLink | null = selected ? { module: "machine", id: selected.machineId, label: selected.machineId, href: `/machines/${selected.machineId}` } : null;
  const meetingLink: ActionContextLink | null = meeting ? { module: "meeting", id: meeting.id, label: meeting.id, href: "/reunions/production" } : null;

  function actionCreated(actionId: string) {
    if (!selected) return;
    linkActionToMaintenanceProblem(selected.id, actionId);
    if (meeting) updateDemoData((draft) => { const target = draft.meetings.find((item) => item.id === meeting.id); if (target && !target.actionIds.includes(actionId)) target.actionIds.push(actionId); });
  }

  return <div>
    {!machineId ? <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">{[["Problèmes ouverts", openProblems.length], ["Machines concernées", relevantMachineIds.size], ["Actions ouvertes", maintenanceActions.length], ["Problèmes en retard", lateProblems]].map(([label, value]) => <MetricCard key={label} label={String(label)} value={value} />)}</div> : null}
    <FilterBar className="mt-4 flex flex-wrap gap-2"><SearchInput className="min-w-60 flex-1" value={query} onChange={(event) => setQuery(event.target.value)} onClear={() => setQuery("")} placeholder="Rechercher une machine ou un problème…" /><Select className="w-auto min-w-40" value={filter} onChange={(event) => setFilter(event.target.value as Filter)}>{["Ouverts", "Arrêt", "En cours", "En attente", "Résolus", "Tous"].map((item) => <option key={item}>{item}</option>)}</Select><Button onClick={() => setCreating(true)}>+ Ajouter un problème</Button></FilterBar>
    <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.35fr)]"><div className="grid content-start gap-2">{problems.map((problem) => { const machineResolution = references.machine(problem.machineId); const machine = machineResolution.entity; const machineLabel = machine?.displayName ?? missingReferenceLabel("machine", problem.machineId); const openActions = data.actions.filter((action) => problem.actionIds.includes(action.id) && action.statut !== "Fait").length; const included = meeting?.maintenanceProblemIds.includes(problem.id) ?? false; return <article key={problem.id} className={`rounded-xl border bg-white p-3 transition hover:bg-slate-50 ${selected?.id === problem.id ? "border-[var(--app-primary)]" : "border-[var(--app-border)]"}`}><button className="flex w-full gap-3 text-left" onClick={() => setSelectedId(problem.id)}><MachinePhoto src={photos[problem.machineId]} name={machineLabel} /><span className="min-w-0 flex-1"><span className="flex justify-between gap-2"><strong className={`truncate text-sm ${machineResolution.status === "missing" ? "text-amber-700" : ""}`}>{machineLabel}</strong><StatusPill tone={statusTone(problem.status)}>{problem.status}</StatusPill></span><span className="mt-1 block truncate text-sm">{problem.title}</span><span className="mt-2 block text-xs text-slate-500">{problem.machineStopped ? "Machine arrêtée · " : ""}{openActions} action(s) ouverte(s) · {formatEuropeanDate(problem.updatedAt, true)}</span></span></button>{meeting ? <label className="mt-3 flex items-center gap-2 border-t pt-2 text-xs font-medium"><input type="checkbox" checked={included} onChange={(event) => setProblemIncludedInMeeting(meeting.id, problem.id, event.target.checked)} /> Inclure dans la réunion</label> : null}</article>; })}{!problems.length ? <EmptyState icon="wrench" title="Aucun problème maintenance" description="Aucun problème ne correspond aux filtres sélectionnés." action={<Button variant="secondary" onClick={() => setCreating(true)}>+ Signaler un problème</Button>} /> : null}</div>
      {selected && selectedMachine ? <article className="rounded-2xl border bg-white p-5"><header className="flex flex-wrap items-start gap-3"><MachinePhoto src={photos[selected.machineId]} name={selectedMachine.displayName} /><div><h3 className="font-bold">{selectedMachine.displayName}</h3><p className="text-xs text-slate-500">{selectedMachine.department}</p></div><StatusPill tone={statusTone(selected.status)}>{selected.status}</StatusPill><Link className={`${secondaryButton} ml-auto`} href={`/machines/${selected.machineId}`}>Ouvrir la fiche machine</Link></header>
        <section className="mt-4 rounded-xl bg-slate-50 p-4"><div className="flex flex-wrap justify-between gap-2"><h4 className="font-semibold">Problème</h4>{selected.status !== "Résolu" ? <button className={primaryButton} onClick={() => { if (!window.confirm("Résoudre ce problème ?")) return; const resolution = window.prompt("Commentaire de résolution (facultatif)") ?? ""; resolveMaintenanceProblem(selected.id, resolution, author); }}>Marquer comme résolu</button> : null}</div><label className="mt-3 block text-sm font-medium">Titre<input className={`${fieldClass} mt-1 w-full bg-white`} value={selected.title} onChange={(event) => updateMaintenanceProblem(selected.id, { title: event.target.value }, author)} /></label><label className="mt-3 block text-sm font-medium">Description<textarea className={`${fieldClass} mt-1 min-h-20 w-full bg-white`} value={selected.description} onChange={(event) => updateMaintenanceProblem(selected.id, { description: event.target.value }, author)} /></label><div className="mt-3 grid gap-3 sm:grid-cols-2"><label className="text-sm font-medium">Statut<select disabled={selected.status === "Résolu"} className={`${fieldClass} mt-1 w-full bg-white`} value={selected.status} onChange={(event) => updateMaintenanceProblem(selected.id, { status: event.target.value as MaintenanceProblemStatus }, author)}>{(selected.status === "Résolu" ? ["Résolu"] : ["Ouvert", "En cours", "En attente"]).map((item) => <option key={item}>{item}</option>)}</select></label><p className="text-sm"><span className="block text-xs font-semibold uppercase text-slate-500">Date</span>{formatEuropeanDate(selected.occurredOn)}</p><p className="text-sm"><span className="block text-xs font-semibold uppercase text-slate-500">Type</span>{selected.problemType || "Non renseigné"}</p><p className="text-sm"><span className="block text-xs font-semibold uppercase text-slate-500">Machine</span>{selected.machineStopped ? "À l’arrêt" : "En fonctionnement"}</p></div>{selected.productionImpact ? <p className="mt-3 text-sm"><strong>Impact production :</strong> {selected.productionImpact}</p> : null}</section>
        <section className="mt-4 border-t pt-4"><div className="flex justify-between gap-2"><h4 className="font-semibold">Actions liées — {selectedActions.length}</h4><button className={primaryButton} onClick={() => setCreatingAction(true)}>+ Nouvelle action</button></div>{selectedActions.length ? <div className="mt-2 grid gap-2">{selectedActions.map((action) => <Link key={action.id} href={`/actions/${action.id}`} className="rounded-lg bg-slate-50 p-3 text-sm hover:bg-slate-100"><strong>{action.description}</strong><span className="mt-1 flex gap-2 text-xs text-slate-500">{action.responsable} · {formatEuropeanDate(action.echeance)} <StatusPill tone={actionStatusTone(action.statut)}>{action.statut}</StatusPill></span></Link>)}</div> : <p className="mt-2 text-sm text-slate-500">Aucune action liée à ce problème.</p>}</section>
        <section className="mt-4 border-t pt-4"><h4 className="font-semibold">Commentaires</h4><div className="mt-2 flex gap-2"><input className={`${fieldClass} flex-1`} value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Ajouter une mise à jour…" /><button className={secondaryButton} disabled={!comment.trim()} onClick={() => { addMaintenanceProblemComment(selected.id, comment, author); setComment(""); }}>Ajouter</button></div><div className="mt-3 grid gap-2">{[...selected.comments].reverse().map((item) => <div key={item.id} className="rounded-lg bg-slate-50 p-3 text-sm"><p>{item.text}</p><p className="mt-1 text-xs text-slate-500">{formatEuropeanDate(item.createdAt, true)} · {item.author}</p></div>)}</div></section>
        <details className="mt-4 border-t pt-4"><summary className="cursor-pointer font-semibold">Historique — {selected.history.length}</summary><div className="mt-2 grid gap-2">{[...selected.history].reverse().map((item) => <p key={item.id} className="border-l-2 pl-3 text-sm">{formatEuropeanDate(item.createdAt, true)} · {item.author} · {item.text}</p>)}</div></details>
      </article> : selected && selectedMachineResolution.status === "missing" ? <article className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">{missingReferenceLabel("machine", selectedMachineResolution.id)}. Le problème maintenance est conservé, mais sa fiche machine ne peut plus être ouverte.</article> : null}</div>
    {creating ? <MaintenanceProblemDialog initialMachineId={machineId} meetingId={meetingId} onClose={() => setCreating(false)} onCreated={setSelectedId} /> : null}
    {creatingAction && selected && problemLink && machineLink ? <ActionFormDialog origine="Maintenance" contextLink={problemLink} additionalContextLinks={[machineLink, ...(meetingLink ? [meetingLink] : [])]} initialDescription={`${selected.title} — `} onClose={() => setCreatingAction(false)} onCreated={actionCreated} /> : null}
  </div>;
}
