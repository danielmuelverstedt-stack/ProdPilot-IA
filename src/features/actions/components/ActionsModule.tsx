"use client";

import { useMemo, useState, type ReactNode } from "react";
import { fieldClass, ModuleHeader, primaryButton } from "@/components/ui/ModuleUi";
import { useDemoData } from "@/features/demo/services/demo-repository";
import { useSettings } from "@/features/settings/components/SettingsProvider";
import { ActionFormDialog } from "@/features/actions/components/ActionFormDialog";
import { ActionGroupedList } from "@/features/actions/components/ActionGroupedList";
import { TeamPlanningTab } from "@/features/actions/components/TeamPlanningTab";
import type { ActionGroupMode } from "@/features/actions/services/action-grouping";

const groupOptions: { mode: ActionGroupMode; label: string }[] = [
  { mode: "personne", label: "Par personne" },
  { mode: "origine", label: "Par origine" },
  { mode: "echeance", label: "Par échéance" },
];

type ActionsView = "current" | "backlog" | "team-planning";
type PlanningIssueFilter = "none" | "missing-responsable" | "missing-hours" | "missing-week";

export function ActionsModule() {
  const data = useDemoData();
  const { settings } = useSettings();
  const [view, setView] = useState<ActionsView>("current");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("À faire");
  const [origin, setOrigin] = useState("Toutes");
  const [responsible, setResponsible] = useState("Tous");
  const [mode, setMode] = useState<ActionGroupMode>("personne");
  const [creating, setCreating] = useState(false);
  const [planningIssueFilter, setPlanningIssueFilter] = useState<PlanningIssueFilter>("none");

  const origins = settings.actions.origins;
  const responsibles = useMemo(() => [...new Set(data.actions.map((item) => item.responsable))].sort((a, b) => a.localeCompare(b, "fr")), [data.actions]);
  const backlogCount = useMemo(() => data.actions.filter((item) => item.statut === "À planifier").length, [data.actions]);

  // Bandeau d'alerte : actions réelles (pas des idées « À planifier », pas déjà « Fait ») qu'il manque
  // de compléter pour qu'elles apparaissent dans la planification équipe. Compteur global sur le
  // même périmètre — une action sans charge n'entre jamais dans le total d'heures.
  const planningIssues = useMemo(() => {
    const relevant = data.actions.filter((item) => item.statut !== "À planifier" && item.statut !== "Fait");
    return {
      missingResponsable: relevant.filter((item) => !item.responsableId).length,
      missingHours: relevant.filter((item) => item.responsableId && item.estimatedHours === null).length,
      missingWeek: relevant.filter((item) => item.responsableId && item.estimatedHours !== null && !item.plannedWeek).length,
      count: data.actions.filter((item) => item.statut !== "À planifier").length,
      totalHours: data.actions.reduce((sum, item) => sum + (item.statut === "Fait" ? 0 : item.estimatedHours ?? 0), 0),
    };
  }, [data.actions]);

  // « À planifier » vit dans son propre onglet, jamais mélangé aux actions actuelles : une fois
  // planifiée (responsable + échéance donnés via planAction), une idée rejoint l'onglet Actions
  // comme une action « À faire » normale, sans étape intermédiaire ni doublon entre les deux vues.
  const filtered = useMemo(() => data.actions.filter((item) => {
    if (view === "backlog") {
      if (item.statut !== "À planifier") return false;
      const text = `${item.id} ${item.description}`.toLocaleLowerCase("fr");
      return text.includes(search.toLocaleLowerCase("fr")) && (origin === "Toutes" || item.origine === origin);
    }
    if (item.statut === "À planifier") return false;
    if (planningIssueFilter === "missing-responsable" && item.responsableId) return false;
    if (planningIssueFilter === "missing-hours" && (!item.responsableId || item.estimatedHours !== null)) return false;
    if (planningIssueFilter === "missing-week" && (!item.responsableId || item.estimatedHours === null || item.plannedWeek)) return false;
    const text = `${item.id} ${item.description} ${item.responsable}`.toLocaleLowerCase("fr");
    return text.includes(search.toLocaleLowerCase("fr"))
      && (status === "Tous" || item.statut === status)
      && (origin === "Toutes" || item.origine === origin)
      && (responsible === "Tous" || item.responsable === responsible);
  }), [data.actions, origin, planningIssueFilter, responsible, search, status, view]);

  return <div className="mx-auto max-w-7xl">
    <ModuleHeader
      eyebrow="Pilotage opérationnel"
      title="Actions"
      description="Registre unique des décisions et engagements issus des e-mails, réunions, OF, machines et demandes."
      actions={<button className={primaryButton} onClick={() => setCreating(true)}>{view === "backlog" ? "+ Nouvelle idée" : "+ Nouvelle action"}</button>}
    />
    {creating ? <ActionFormDialog origine="Manuel" mode={view === "backlog" ? "backlog" : "full"} onClose={() => setCreating(false)} /> : null}

    <div className="mt-6 flex flex-wrap gap-2 border-b border-[var(--app-border)] pb-3">
      <button onClick={() => setView("current")} className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${view === "current" ? "border-[color-mix(in_srgb,var(--app-primary)_45%,transparent)] bg-[color-mix(in_srgb,var(--app-primary)_10%,white)] text-[var(--app-primary)]" : "border-[var(--app-border)] bg-white text-slate-600 hover:bg-slate-50"}`}>Liste des actions</button>
      <button onClick={() => setView("backlog")} className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${view === "backlog" ? "border-[color-mix(in_srgb,var(--app-primary)_45%,transparent)] bg-[color-mix(in_srgb,var(--app-primary)_10%,white)] text-[var(--app-primary)]" : "border-[var(--app-border)] bg-white text-slate-600 hover:bg-slate-50"}`}>À planifier{backlogCount > 0 ? <span className="ml-2 rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-700">{backlogCount}</span> : null}</button>
      <button onClick={() => setView("team-planning")} className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${view === "team-planning" ? "border-[color-mix(in_srgb,var(--app-primary)_45%,transparent)] bg-[color-mix(in_srgb,var(--app-primary)_10%,white)] text-[var(--app-primary)]" : "border-[var(--app-border)] bg-white text-slate-600 hover:bg-slate-50"}`}>Planification équipe</button>
    </div>
    {view === "backlog" ? <p className="mt-3 text-sm text-slate-500">Idées et tâches d’amélioration mises de côté pour ne pas les oublier. Cliquez « Planifier » pour leur donner un responsable et une échéance : elles rejoignent alors l’onglet Actions.</p> : null}

    {view === "current" ? <section aria-label="État de la planification équipe" className="mt-4 space-y-2">
      {(planningIssues.missingResponsable || planningIssues.missingHours || planningIssues.missingWeek) ? <div className="flex flex-wrap items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-900">
        <span className="font-semibold">Pour la planification équipe :</span>
        {planningIssues.missingResponsable ? <IssueBadge active={planningIssueFilter === "missing-responsable"} onClick={() => setPlanningIssueFilter((current) => current === "missing-responsable" ? "none" : "missing-responsable")}>{planningIssues.missingResponsable} sans responsable</IssueBadge> : null}
        {planningIssues.missingHours ? <IssueBadge active={planningIssueFilter === "missing-hours"} onClick={() => setPlanningIssueFilter((current) => current === "missing-hours" ? "none" : "missing-hours")}>{planningIssues.missingHours} sans charge</IssueBadge> : null}
        {planningIssues.missingWeek ? <IssueBadge active={planningIssueFilter === "missing-week"} onClick={() => setPlanningIssueFilter((current) => current === "missing-week" ? "none" : "missing-week")}>{planningIssues.missingWeek} sans période</IssueBadge> : null}
        <span className="text-xs text-amber-700">— non comptées dans la planification équipe tant qu’incomplètes.</span>
      </div> : null}
      <p className="text-xs text-slate-500">{planningIssues.count.toLocaleString("fr-BE")} action{planningIssues.count > 1 ? "s" : ""} · {planningIssues.totalHours.toLocaleString("fr-BE")} h estimées</p>
    </section> : null}

    {view === "team-planning" ? <TeamPlanningTab actions={data.actions} people={data.people} /> : <>
      <section aria-label="Filtres des actions" className="mt-4 grid gap-2 rounded-2xl border border-[var(--app-border)] bg-white p-4 sm:grid-cols-2 xl:grid-cols-4">
        <input className={fieldClass} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher…" />
        {view === "current" ? <>
          <Select value={status} onChange={setStatus} values={["Tous", "À faire", "Reporté", "Fait"]} />
          <Select value={origin} onChange={setOrigin} values={["Toutes", ...origins.map((item) => item.value)]} />
          <Select value={responsible} onChange={setResponsible} values={["Tous", ...responsibles]} />
        </> : <Select value={origin} onChange={setOrigin} values={["Toutes", ...origins.map((item) => item.value)]} />}
      </section>

      {view === "current" ? <div className="mt-4 flex flex-wrap gap-2">{groupOptions.map((option) => <button key={option.mode} onClick={() => setMode(option.mode)} className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${mode === option.mode ? "border-[color-mix(in_srgb,var(--app-primary)_45%,transparent)] bg-[color-mix(in_srgb,var(--app-primary)_10%,white)] text-[var(--app-primary)]" : "border-[var(--app-border)] bg-white text-slate-600 hover:bg-slate-50"}`}>{option.label}</button>)}</div> : null}

      <ActionGroupedList actions={filtered} mode={mode} columns={settings.actions.columns} origins={origins} people={data.people} variant={view} />
    </>}
  </div>;
}

function Select({ value, onChange, values }: { value: string; onChange: (value: string) => void; values: Iterable<string> }) {
  return <select className={fieldClass} value={value} onChange={(event) => onChange(event.target.value)}>{[...values].map((item) => <option key={item}>{item}</option>)}</select>;
}

function IssueBadge({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return <button type="button" onClick={onClick} className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition ${active ? "border-amber-500 bg-amber-500 text-white" : "border-amber-300 bg-white text-amber-800 hover:bg-amber-100"}`}>{children}</button>;
}
