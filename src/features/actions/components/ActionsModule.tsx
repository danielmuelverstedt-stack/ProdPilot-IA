"use client";

import { useMemo, useState } from "react";
import { fieldClass, ModuleHeader, primaryButton } from "@/components/ui/ModuleUi";
import { useDemoData } from "@/features/demo/services/demo-repository";
import { useSettings } from "@/features/settings/components/SettingsProvider";
import { ActionFormDialog } from "@/features/actions/components/ActionFormDialog";
import { ActionGroupedList } from "@/features/actions/components/ActionGroupedList";
import type { ActionGroupMode } from "@/features/actions/services/action-grouping";

const groupOptions: { mode: ActionGroupMode; label: string }[] = [
  { mode: "personne", label: "Par personne" },
  { mode: "origine", label: "Par origine" },
  { mode: "echeance", label: "Par échéance" },
];

export function ActionsModule() {
  const data = useDemoData();
  const { settings } = useSettings();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("À faire");
  const [origin, setOrigin] = useState("Toutes");
  const [responsible, setResponsible] = useState("Tous");
  const [mode, setMode] = useState<ActionGroupMode>("personne");
  const [creating, setCreating] = useState(false);

  const origins = settings.actions.origins;
  const responsibles = useMemo(() => [...new Set(data.actions.map((item) => item.responsable))].sort((a, b) => a.localeCompare(b, "fr")), [data.actions]);

  const filtered = useMemo(() => data.actions.filter((item) => {
    const text = `${item.id} ${item.description} ${item.responsable}`.toLocaleLowerCase("fr");
    return text.includes(search.toLocaleLowerCase("fr"))
      && (status === "Tous" || item.statut === status)
      && (origin === "Toutes" || item.origine === origin)
      && (responsible === "Tous" || item.responsable === responsible);
  }), [data.actions, origin, responsible, search, status]);

  return <div className="mx-auto max-w-7xl">
    <ModuleHeader eyebrow="Pilotage opérationnel" title="Actions" description="Registre unique des décisions et engagements issus des e-mails, réunions, OF, machines et demandes." actions={<button className={primaryButton} onClick={() => setCreating(true)}>+ Nouvelle action</button>} />
    {creating ? <ActionFormDialog origine="Manuel" onClose={() => setCreating(false)} /> : null}

    <div className="mt-6 flex flex-wrap gap-2">{groupOptions.map((option) => <button key={option.mode} onClick={() => setMode(option.mode)} className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${mode === option.mode ? "border-[color-mix(in_srgb,var(--app-primary)_45%,transparent)] bg-[color-mix(in_srgb,var(--app-primary)_10%,white)] text-[var(--app-primary)]" : "border-[var(--app-border)] bg-white text-slate-600 hover:bg-slate-50"}`}>{option.label}</button>)}</div>

    <section aria-label="Filtres des actions" className="mt-4 grid gap-2 rounded-2xl border border-[var(--app-border)] bg-white p-4 sm:grid-cols-2 xl:grid-cols-4">
      <input className={fieldClass} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher…" />
      <Select value={status} onChange={setStatus} values={["Tous", "À faire", "Reporté", "Fait"]} />
      <Select value={origin} onChange={setOrigin} values={["Toutes", ...origins.map((item) => item.value)]} />
      <Select value={responsible} onChange={setResponsible} values={["Tous", ...responsibles]} />
    </section>

    <ActionGroupedList actions={filtered} mode={mode} columns={settings.actions.columns} origins={origins} />
  </div>;
}

function Select({ value, onChange, values }: { value: string; onChange: (value: string) => void; values: Iterable<string> }) {
  return <select className={fieldClass} value={value} onChange={(event) => onChange(event.target.value)}>{[...values].map((item) => <option key={item}>{item}</option>)}</select>;
}
