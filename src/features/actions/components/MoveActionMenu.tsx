"use client";

import { useState } from "react";
import { fieldClass, primaryButton, secondaryButton } from "@/components/ui/ModuleUi";
import { isoWeekLabel } from "@/features/actions/services/iso-week";
import type { ProductionAction, TeamMember } from "@/features/demo/types/demo";

/**
 * Repli clic/clavier du glisser-déposer : cliquer une carte ouvre ce petit menu « Déplacer vers… »
 * (personne + semaine), qui appelle exactement les mêmes fonctions de service que le drag — aucune
 * divergence de logique entre les deux chemins. Rendu par le parent (case de grille ou panneau
 * « Non planifiées ») dans un conteneur `relative`, positionné en popover comme WorkshopMachinePicker.
 */
export function MoveActionMenu({ action, people, weeks, onMove, onUnassign, onClose }: {
  action: ProductionAction;
  people: TeamMember[];
  weeks: string[];
  onMove: (personId: string, weekKey: string) => void;
  onUnassign: () => void;
  onClose: () => void;
}) {
  const [personId, setPersonId] = useState(action.responsableId ?? people[0]?.id ?? "");
  const [weekKey, setWeekKey] = useState(action.plannedWeek ?? weeks[0] ?? "");

  return <div className="absolute z-40 mt-1 w-64 rounded-xl border border-[var(--app-border)] bg-white p-3 text-left shadow-lg" onClick={(event) => event.stopPropagation()}>
    <p className="text-xs font-semibold text-slate-600">Déplacer « {action.id} » vers…</p>
    <label className="mt-2 block text-xs font-medium">Personne
      <select className={`${fieldClass} mt-1 w-full`} value={personId} onChange={(event) => setPersonId(event.target.value)}>
        {!people.length ? <option value="">Aucune personne</option> : null}
        {people.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}
      </select>
    </label>
    <label className="mt-2 block text-xs font-medium">Semaine
      <select className={`${fieldClass} mt-1 w-full`} value={weekKey} onChange={(event) => setWeekKey(event.target.value)}>
        {weeks.map((week) => <option key={week} value={week}>{isoWeekLabel(week)}</option>)}
      </select>
    </label>
    <div className="mt-3 flex flex-wrap gap-2">
      <button type="button" className={primaryButton} disabled={!personId || !weekKey} onClick={() => { onMove(personId, weekKey); onClose(); }}>Déplacer</button>
      {action.plannedWeek ? <button type="button" className={secondaryButton} onClick={() => { onUnassign(); onClose(); }}>Retirer la période</button> : null}
      <button type="button" className={secondaryButton} onClick={onClose}>Annuler</button>
    </div>
  </div>;
}
