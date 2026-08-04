"use client";

import { useMemo, useState } from "react";
import { useDemoData } from "@/features/demo/services/demo-repository";
import { useSettings } from "@/features/settings/components/SettingsProvider";
import { ActionGroupedList } from "@/features/actions/components/ActionGroupedList";
import type { ActionGroupMode } from "@/features/actions/services/action-grouping";

const GROUP_OPTIONS: { mode: ActionGroupMode; label: string }[] = [
  { mode: "personne", label: "Par personne" },
  { mode: "echeance", label: "Par échéance" },
];

/**
 * Étape 1 des réunions QRQC/Production : revue des actions « À faire » de cette origine, avant
 * les nouveaux sujets. Réutilise directement le tableau du module Actions (mêmes colonnes
 * configurées dans Réglages → Actions, même `ActionRow`, mêmes actions rapides Fait/Reporter),
 * plutôt qu'une présentation ad hoc, pour que les deux écrans restent immédiatement
 * reconnaissables l'un de l'autre. Regroupement par origine non proposé ici : toutes les actions
 * affichées partagent déjà la même origine, celle de la réunion en cours.
 */
export function MeetingActionReview({ origine }: { origine: string }) {
  const data = useDemoData();
  const { settings } = useSettings();
  const [mode, setMode] = useState<ActionGroupMode>("personne");
  const items = useMemo(() => data.actions.filter((item) => item.origine === origine && item.statut === "À faire"), [data.actions, origine]);

  if (!items.length) return <p className="mt-4 text-sm text-slate-600">Aucune action « À faire » en attente pour cette origine. Vous pouvez passer aux nouveaux sujets.</p>;

  return <div className="mt-4">
    <div className="flex flex-wrap gap-2">{GROUP_OPTIONS.map((option) => <button key={option.mode} type="button" onClick={() => setMode(option.mode)} className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${mode === option.mode ? "border-[color-mix(in_srgb,var(--app-primary)_45%,transparent)] bg-[color-mix(in_srgb,var(--app-primary)_10%,white)] text-[var(--app-primary)]" : "border-[var(--app-border)] bg-white text-slate-600 hover:bg-slate-50"}`}>{option.label}</button>)}</div>
    <ActionGroupedList actions={items} mode={mode} columns={settings.actions.columns} origins={settings.actions.origins} people={data.people} variant="current" />
  </div>;
}
