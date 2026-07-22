"use client";

import { useState } from "react";
import { PlanningDialogShell } from "@/features/planning/components/PlanningDialogShell";
import { fieldClass, primaryButton, secondaryButton } from "@/components/ui/ModuleUi";
import { useDemoData } from "@/features/demo/services/demo-repository";
import { useSettings } from "@/features/settings/components/SettingsProvider";
import { createAction } from "@/features/actions/services/action-service";
import type { ActionContextLink } from "@/features/demo/types/demo";

export function ActionFormDialog({ origine, contextLink = null, onClose, onCreated }: {
  origine: string;
  contextLink?: ActionContextLink | null;
  onClose: () => void;
  onCreated?: (id: string) => void;
}) {
  const { settings } = useSettings();
  const data = useDemoData();
  const [description, setDescription] = useState("");
  const [responsable, setResponsable] = useState("");
  const [echeance, setEcheance] = useState("");
  const [origin, setOrigin] = useState(origine);
  const [remarque, setRemarque] = useState("");

  const knownPeople = [...new Set([
    ...settings.users.filter((user) => user.active).map((user) => `${user.firstName} ${user.lastName}`),
    ...data.actions.map((item) => item.responsable),
  ])].filter(Boolean).sort((a, b) => a.localeCompare(b, "fr"));
  const origins = [...settings.actions.origins].filter((item) => item.active).sort((a, b) => a.order - b.order);
  const introduitPar = settings.users.find((user) => user.active) ? `${settings.users.find((user) => user.active)!.firstName} ${settings.users.find((user) => user.active)!.lastName}` : "Utilisateur";

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!description.trim() || !responsable.trim() || !echeance) return;
    const id = createAction({ description, responsable, echeance, origine: origin, introduitPar, remarque, contextLink });
    onCreated?.(id);
    onClose();
  }

  return <PlanningDialogShell title="Nouvelle action" description="Une seule fenêtre pour créer une action, quel que soit le module d’origine." onClose={onClose} actions={<><button type="button" className={secondaryButton} onClick={onClose}>Annuler</button><button type="submit" form="action-form-dialog" className={primaryButton}>Créer l’action</button></>}>
    <form id="action-form-dialog" onSubmit={submit} className="grid gap-3">
      <label className="text-sm font-medium">Description<textarea autoFocus required className={`${fieldClass} mt-1 min-h-24 w-full py-3`} value={description} onChange={(event) => setDescription(event.target.value)} /></label>
      <label className="text-sm font-medium">Responsable<input required list="action-form-known-people" className={`${fieldClass} mt-1 w-full`} value={responsable} onChange={(event) => setResponsable(event.target.value)} /></label>
      <datalist id="action-form-known-people">{knownPeople.map((person) => <option key={person} value={person} />)}</datalist>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium">Échéance<input required type="date" className={`${fieldClass} mt-1 w-full`} value={echeance} onChange={(event) => setEcheance(event.target.value)} /></label>
        <label className="text-sm font-medium">Origine<select className={`${fieldClass} mt-1 w-full`} value={origin} onChange={(event) => setOrigin(event.target.value)}>{origins.map((item) => <option key={item.id} value={item.value}>{item.label}</option>)}</select></label>
      </div>
      <label className="text-sm font-medium">Remarque (facultatif)<textarea className={`${fieldClass} mt-1 min-h-16 w-full py-3`} value={remarque} onChange={(event) => setRemarque(event.target.value)} /></label>
    </form>
  </PlanningDialogShell>;
}
