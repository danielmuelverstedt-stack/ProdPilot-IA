"use client";

import { useState } from "react";
import { fieldClass, primaryButton, secondaryButton } from "@/components/ui/ModuleUi";
import { PlanningDialogShell } from "@/features/planning/components/PlanningDialogShell";
import { machineSettingsService } from "@/features/settings/services/machine-settings-service";
import type { MachineCreateInput, MachineCreateResult } from "@/features/settings/services/machine-settings-service";
import type { AppSettings } from "@/features/settings/types/settings";

/**
 * Formulaire de création de machine partagé entre Réglages → Production → Machines et le Parc
 * Machines : une seule fenêtre, une seule validation (`machineSettingsService.createMachine`),
 * pour ne pas dupliquer cette logique entre les deux points d'entrée. L'identifiant n'est plus
 * saisi à la main : il reprend automatiquement la numérotation déjà en place pour le département
 * choisi (ex. TOU-01, TOU-02… pour Tournage), via `machineSettingsService.suggestMachineId`.
 */
export function MachineCreateDialog({ settings, onSubmit, onClose }: {
  settings: AppSettings;
  onSubmit: (input: MachineCreateInput) => MachineCreateResult;
  onClose: () => void;
}) {
  const activeDepartments = settings.production.departments.filter((item) => item.active);
  const [name, setName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [departmentId, setDepartmentId] = useState(activeDepartments[0]?.id ?? "");
  const [isWorkstation, setIsWorkstation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const suggestedId = departmentId ? machineSettingsService.suggestMachineId(settings, departmentId) : "";

  function submit() {
    const result = onSubmit({ id: suggestedId, name, displayName, departmentId, kind: isWorkstation ? "poste" : "machine" });
    if (!result.ok) setError(result.error);
  }

  return <PlanningDialogShell
    title="Ajouter une machine"
    description="L’identifiant est généré automatiquement à partir du département. Le reste des informations (type, code ERP, couleur, capacité, photo, fiche technique…) se complète ensuite depuis la fiche machine."
    onClose={onClose}
    actions={<><button type="button" className={secondaryButton} onClick={onClose}>Annuler</button><button type="button" className={primaryButton} onClick={submit}>Créer et ouvrir la fiche</button></>}
  >
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="text-sm font-medium">Identifiant<input readOnly disabled title="Généré automatiquement à partir du département sélectionné" className={`${fieldClass} mt-1 w-full cursor-not-allowed bg-slate-50 text-slate-500`} value={suggestedId} /></label>
      <label className="text-sm font-medium">Nom technique<input autoFocus className={`${fieldClass} mt-1 w-full`} value={name} onChange={(event) => setName(event.target.value)} /></label>
      <label className="text-sm font-medium">Nom affiché<input className={`${fieldClass} mt-1 w-full`} value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder={name || "Identique au nom technique"} /></label>
      <label className="text-sm font-medium">Département<select className={`${fieldClass} mt-1 w-full`} value={departmentId} onChange={(event) => setDepartmentId(event.target.value)}>{activeDepartments.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
    </div>
    <label className="mt-3 flex items-center gap-2 text-sm font-medium">
      <input type="checkbox" checked={isWorkstation} onChange={(event) => setIsWorkstation(event.target.checked)} /> Poste de travail (sans machine physique)
    </label>
    {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
  </PlanningDialogShell>;
}
