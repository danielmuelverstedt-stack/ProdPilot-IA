"use client";

import { useState } from "react";
import { fieldClass, primaryButton, secondaryButton } from "@/components/ui/ModuleUi";
import { createTeamMember, deleteTeamMember, updateTeamMember } from "@/features/actions/services/team-planning-service";
import { PlanningDialogShell } from "@/features/planning/components/PlanningDialogShell";
import type { TeamMember } from "@/features/demo/types/demo";

/** Gestion de l'équipe (ajout/édition/suppression) — mutateurs auto-enregistrés, pas de bouton « Valider » global : chaque champ s'enregistre à la perte de focus, comme les autres réglages inline de l'app. */
export function TeamManagementDialog({ people, onClose }: { people: TeamMember[]; onClose: () => void }) {
  const [newName, setNewName] = useState("");
  const [newCapacity, setNewCapacity] = useState(38);
  const sorted = [...people].sort((a, b) => a.order - b.order);

  function addPerson() {
    if (!newName.trim()) return;
    createTeamMember(newName, newCapacity);
    setNewName("");
    setNewCapacity(38);
  }

  function removePerson(person: TeamMember) {
    if (!window.confirm(`Retirer ${person.name} de l’équipe ? Ses actions planifiées repasseront en « Non planifiées ».`)) return;
    deleteTeamMember(person.id);
  }

  return <PlanningDialogShell
    title="Gérer l’équipe"
    description="Les actions d’une personne retirée repassent en « Non planifiées » sans perte de responsable ni de charge."
    onClose={onClose}
    actions={<button type="button" className={primaryButton} onClick={onClose}>Fermer</button>}
  >
    <ul className="space-y-2">
      {sorted.map((person) => <li key={person.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-[var(--app-border)] p-2">
        <input
          key={`${person.id}-name`}
          className={`${fieldClass} h-8 flex-1 py-0 text-sm`}
          defaultValue={person.name}
          onBlur={(event) => { const value = event.target.value.trim(); if (value && value !== person.name) updateTeamMember(person.id, { name: value }); }}
        />
        <input
          key={`${person.id}-capacity`}
          type="number" min="0" step="0.5"
          className={`${fieldClass} h-8 w-20 py-0 text-sm`}
          defaultValue={person.weeklyCapacityHours}
          onBlur={(event) => { const value = Number(event.target.value); if (Number.isFinite(value) && value >= 0 && value !== person.weeklyCapacityHours) updateTeamMember(person.id, { weeklyCapacityHours: value }); }}
        />
        <span className="text-xs text-slate-500">h/sem.</span>
        <button type="button" className={`${secondaryButton} text-red-700`} onClick={() => removePerson(person)}>Retirer</button>
      </li>)}
      {!sorted.length ? <p className="text-sm text-slate-500">Aucune personne pour l’instant.</p> : null}
    </ul>
    <div className="mt-4 flex flex-wrap items-end gap-2 border-t border-[var(--app-border)] pt-3">
      <label className="text-sm font-medium">Nom<input autoFocus className={`${fieldClass} mt-1 w-full`} value={newName} onChange={(event) => setNewName(event.target.value)} placeholder="Prénom Nom" /></label>
      <label className="text-sm font-medium">Capacité (h/sem.)<input type="number" min="0" step="0.5" className={`${fieldClass} mt-1 w-24`} value={newCapacity} onChange={(event) => setNewCapacity(Number(event.target.value))} /></label>
      <button type="button" className={secondaryButton} onClick={addPerson} disabled={!newName.trim()}>+ Ajouter</button>
    </div>
  </PlanningDialogShell>;
}
