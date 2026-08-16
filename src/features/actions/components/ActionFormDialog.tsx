"use client";

import { useState } from "react";
import { PlanningDialogShell } from "@/features/planning/components/PlanningDialogShell";
import { fieldClass, primaryButton, secondaryButton } from "@/components/ui/ModuleUi";
import { useDemoData } from "@/features/demo/services/demo-repository";
import { useSettings } from "@/features/settings/components/SettingsProvider";
import { createAction } from "@/features/actions/services/action-service";
import { ActionLinkPickers } from "@/features/actions/components/ActionLinkPickers";
import type { ActionContextLink } from "@/features/demo/types/demo";

/** Types de besoin proposés par les boutons de l'étape « Cinq projets critiques » d'une réunion Production — partagés avec `ActionFormDialog` (champ « Type de besoin ») pour rester la même liste des deux côtés. */
export const ACTION_NEED_TYPES = ["Qualité", "Planning", "Programme", "Outillage", "Matière", "Maintenance", "Achats", "Autre"];

export function ActionFormDialog({ origine, contextLink = null, additionalContextLinks = [], mode = "full", parentActionId = null, initialDescription = "", initialBesoinType, allowLinkPicker = false, onClose, onCreated }: {
  origine: string;
  contextLink?: ActionContextLink | null;
  additionalContextLinks?: ActionContextLink[];
  /** "backlog" : idée d'amélioration à ne pas oublier, sans responsable ni échéance à saisir tout de suite — voir l'onglet « À planifier » d'Actions. */
  mode?: "full" | "backlog";
  /** Renseigné depuis la fiche d'une action : la nouvelle action devient une sous-action de celle-ci. */
  parentActionId?: string | null;
  /** Pré-remplit la description (ex. depuis un besoin déjà identifié) — reste modifiable avant création. */
  initialDescription?: string;
  /** Affiche et pré-remplit le champ « Type de besoin » (parmi `ACTION_NEED_TYPES`) quand fourni — laissé `undefined` (champ masqué) pour toute création d'action hors contexte de besoin, afin de ne pas ajouter ce champ à la fenêtre générique. */
  initialBesoinType?: string | null;
  /** Affiche les sélecteurs machine/OF/qualité (`ActionLinkPickers`) pour rattacher l'action à plusieurs éléments en plus de `contextLink` — réservé aux appelants qui en ont besoin (ex. la réunion), masqué ailleurs pour ne pas surcharger la fenêtre. */
  allowLinkPicker?: boolean;
  onClose: () => void;
  /** `responsable` : chaîne vide pour une idée à planifier (`mode="backlog"`), sans responsable à ce stade. */
  onCreated?: (id: string, responsable: string) => void;
}) {
  const { settings } = useSettings();
  const data = useDemoData();
  const [description, setDescription] = useState(initialDescription);
  const [responsable, setResponsable] = useState("");
  const [echeance, setEcheance] = useState("");
  const [origin, setOrigin] = useState(origine);
  const [remarque, setRemarque] = useState("");
  const [besoinType, setBesoinType] = useState(initialBesoinType ?? null);
  const [extraLinks, setExtraLinks] = useState<ActionContextLink[]>([]);
  const showBesoinType = initialBesoinType !== undefined;

  function addLink(link: ActionContextLink) {
    setExtraLinks((current) => (current.some((item) => item.module === link.module && item.id === link.id) ? current : [...current, link]));
  }

  function removeLink(link: ActionContextLink) {
    setExtraLinks((current) => current.filter((item) => !(item.module === link.module && item.id === link.id)));
  }

  const knownPeople = [...new Set([
    ...settings.users.filter((user) => user.active).map((user) => `${user.firstName} ${user.lastName}`),
    ...data.actions.map((item) => item.responsable),
  ])].filter(Boolean).sort((a, b) => a.localeCompare(b, "fr"));
  const origins = [...settings.actions.origins].filter((item) => item.active).sort((a, b) => a.order - b.order);
  const introduitPar = settings.users.find((user) => user.active) ? `${settings.users.find((user) => user.active)!.firstName} ${settings.users.find((user) => user.active)!.lastName}` : "Utilisateur";
  const isBacklog = mode === "backlog";

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!description.trim() || (!isBacklog && (!responsable.trim() || !echeance))) return;
    const id = createAction({
      description,
      responsable: isBacklog ? "" : responsable,
      echeance: isBacklog ? new Date().toISOString().slice(0, 10) : echeance,
      origine: origin,
      introduitPar,
      remarque,
      contextLinks: [contextLink, ...additionalContextLinks, ...extraLinks].filter((item): item is ActionContextLink => item !== null),
      statut: isBacklog ? "À planifier" : "À faire",
      parentActionId,
      besoinType: showBesoinType ? besoinType : null,
    });
    onCreated?.(id, isBacklog ? "" : responsable);
    onClose();
  }

  return <PlanningDialogShell
    title={isBacklog ? "Nouvelle idée à planifier" : parentActionId ? "Nouvelle sous-action" : "Nouvelle action"}
    description={isBacklog ? "Mettez de côté une idée ou une tâche d'amélioration pour ne pas l'oublier — vous lui donnerez un responsable et une échéance au moment de la planifier." : parentActionId ? `Cette sous-action sera liée à ${parentActionId} et apparaîtra dans sa fiche.` : "Une seule fenêtre pour créer une action, quel que soit le module d’origine."}
    onClose={onClose}
    actions={<><button type="button" className={secondaryButton} onClick={onClose}>Annuler</button><button type="submit" form="action-form-dialog" className={primaryButton}>{isBacklog ? "Ajouter l’idée" : "Créer l’action"}</button></>}
  >
    <form id="action-form-dialog" onSubmit={submit} className="grid gap-3">
      <label className="text-sm font-medium">Description<textarea autoFocus required className={`${fieldClass} mt-1 min-h-24 w-full py-3`} value={description} onChange={(event) => setDescription(event.target.value)} /></label>
      {showBesoinType ? <label className="text-sm font-medium">Type de besoin<select className={`${fieldClass} mt-1 w-full`} value={besoinType ?? ""} onChange={(event) => setBesoinType(event.target.value || null)}><option value="">Aucun</option>{ACTION_NEED_TYPES.map((need) => <option key={need} value={need}>{need}</option>)}</select></label> : null}
      {!isBacklog ? <>
        <label className="text-sm font-medium">Responsable<input required list="action-form-known-people" className={`${fieldClass} mt-1 w-full`} value={responsable} onChange={(event) => setResponsable(event.target.value)} /></label>
        <datalist id="action-form-known-people">{knownPeople.map((person) => <option key={person} value={person} />)}</datalist>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-medium">Échéance<input required type="date" className={`${fieldClass} mt-1 w-full`} value={echeance} onChange={(event) => setEcheance(event.target.value)} /></label>
          <label className="text-sm font-medium">Origine<select className={`${fieldClass} mt-1 w-full`} value={origin} onChange={(event) => setOrigin(event.target.value)}>{origins.map((item) => <option key={item.id} value={item.value}>{item.label}</option>)}</select></label>
        </div>
      </> : <label className="text-sm font-medium">Origine<select className={`${fieldClass} mt-1 w-full`} value={origin} onChange={(event) => setOrigin(event.target.value)}>{origins.map((item) => <option key={item.id} value={item.value}>{item.label}</option>)}</select></label>}
      <label className="text-sm font-medium">Remarque (facultatif)<textarea className={`${fieldClass} mt-1 min-h-16 w-full py-3`} value={remarque} onChange={(event) => setRemarque(event.target.value)} /></label>
      {allowLinkPicker ? <div>
        <span className="text-sm font-medium">Liens (facultatif)</span>
        <div className="mt-1"><ActionLinkPickers onAdd={addLink} /></div>
        {extraLinks.length ? <div className="mt-2 flex flex-wrap gap-1.5">{extraLinks.map((link) => <span key={`${link.module}-${link.id}`} className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold">
          {link.label}
          <button type="button" aria-label={`Retirer ${link.label}`} className="text-slate-400 hover:text-red-600" onClick={() => removeLink(link)}>×</button>
        </span>)}</div> : null}
      </div> : null}
    </form>
  </PlanningDialogShell>;
}
