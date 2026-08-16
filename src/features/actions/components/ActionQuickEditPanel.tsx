"use client";

import Link from "next/link";
import { useState } from "react";
import { fieldClass, secondaryButton, StatusPill } from "@/components/ui/ModuleUi";
import { PhotoThumbnail } from "@/components/ui/PhotoThumbnail";
import { PlanningDialogShell } from "@/features/planning/components/PlanningDialogShell";
import { useDemoData } from "@/features/demo/services/demo-repository";
import { useSettings } from "@/features/settings/components/SettingsProvider";
import { currentDemoUserName } from "@/features/settings/services/current-user";
import { useContactPhotos } from "@/features/contacts/services/contact-photo-store";
import { contactFullName, sortContactsByName } from "@/features/contacts/services/contact-directory";
import { ActionActivity } from "@/features/actions/components/ActionActivity";
import { ActionLinkPickers } from "@/features/actions/components/ActionLinkPickers";
import { addActionComment, addActionContextLink, completeAction, postponeAction, reassignAction, reassignActionToContact, removeActionContextLink, reopenAction, updateActionEcheance } from "@/features/actions/services/action-service";
import { actionStatusTone, isActionOverdue } from "@/features/actions/services/action-status";

/**
 * Édition rapide d'une action sans quitter la réunion — fenêtre plutôt que navigation complète,
 * construite sur `PlanningDialogShell` (seul overlay réutilisable de l'app). Chaque action passe
 * par les mêmes fonctions du service Actions que la fiche complète (`ActionDetail.tsx`) : il n'existe
 * qu'une seule version de chaque action, jamais de logique dupliquée ici.
 */
export function ActionQuickEditPanel({ actionId, onClose }: { actionId: string; onClose: () => void }) {
  const data = useDemoData();
  const { settings } = useSettings();
  const photos = useContactPhotos();
  const action = data.actions.find((item) => item.id === actionId);
  const [echeance, setEcheance] = useState(action?.echeance ?? "");
  const [postponing, setPostponing] = useState(false);
  const [postponeDate, setPostponeDate] = useState(action?.echeance ?? "");
  const [freeResponsable, setFreeResponsable] = useState(false);
  const author = currentDemoUserName(settings);

  if (!action) return null;

  const internalContacts = sortContactsByName(data.contacts);
  const responsableContact = action.responsableContactId ? data.contacts.find((item) => item.id === action.responsableContactId) : null;

  function pickContact(contactId: string) {
    if (!contactId) return;
    const contact = data.contacts.find((item) => item.id === contactId);
    if (contact) reassignActionToContact(action!.id, contact.id, contactFullName(contact), author);
  }

  return <PlanningDialogShell
    title={action.description}
    description={`${action.id} · ${action.origine}`}
    maxWidthClassName="max-w-2xl"
    onClose={onClose}
    actions={<button type="button" className={secondaryButton} onClick={onClose}>Fermer</button>}
  >
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center gap-2">
        <StatusPill tone={actionStatusTone(action.statut)}>{action.statut}</StatusPill>
        {isActionOverdue(action) ? <StatusPill tone="danger">En retard</StatusPill> : null}
        <Link href={`/actions/${action.id}`} className="text-xs font-semibold text-[var(--app-primary)] underline">Ouvrir la fiche complète</Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium">Échéance
          <div className="mt-1 flex gap-1">
            <input type="date" className={`${fieldClass} min-w-0 flex-1`} value={echeance} onChange={(event) => setEcheance(event.target.value)} />
            <button type="button" className={secondaryButton} disabled={!echeance} onClick={() => updateActionEcheance(action.id, echeance, author)}>Enregistrer</button>
          </div>
        </label>
        <div>
          <span className="text-sm font-medium">Statut</span>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {action.statut !== "Fait" ? <button type="button" className={secondaryButton} onClick={() => completeAction(action.id, author)}>Marquer comme terminée</button> : null}
            {action.statut !== "Fait" ? (postponing
              ? <span className="inline-flex items-center gap-1"><input type="date" className={`${fieldClass} h-9 w-36`} value={postponeDate} onChange={(event) => setPostponeDate(event.target.value)} /><button type="button" className={secondaryButton} onClick={() => { if (postponeDate) { postponeAction(action.id, postponeDate, author); setPostponing(false); } }}>Confirmer</button></span>
              : <button type="button" className={secondaryButton} onClick={() => setPostponing(true)}>Reporter</button>) : null}
            {action.statut === "Fait" ? <button type="button" className={secondaryButton} onClick={() => reopenAction(action.id, author)}>Rouvrir</button> : null}
          </div>
        </div>
      </div>

      <div>
        <span className="text-sm font-medium">Responsable</span>
        <div className="mt-1 flex items-center gap-3">
          <PhotoThumbnail photoDataUrl={responsableContact ? photos[responsableContact.id] : undefined} alt={action.responsable} size="md" />
          <p className="min-w-0 flex-1 truncate text-sm font-medium">{action.responsable || "Non assigné"}</p>
        </div>
        <select className={`${fieldClass} mt-2 w-full`} value={action.responsableContactId ?? ""} onChange={(event) => pickContact(event.target.value)}>
          <option value="">Choisir un contact…</option>
          {internalContacts.map((contact) => <option key={contact.id} value={contact.id}>{contactFullName(contact)}</option>)}
        </select>
        {freeResponsable
          ? <input className={`${fieldClass} mt-2 w-full`} placeholder="Nom en texte libre" defaultValue={action.responsableContactId ? "" : action.responsable} onBlur={(event) => { if (event.target.value.trim()) reassignAction(action.id, event.target.value.trim(), author); }} />
          : <button type="button" className="mt-1 text-xs font-semibold text-[var(--app-primary)] underline" onClick={() => setFreeResponsable(true)}>Ou saisir un nom en texte libre</button>}
      </div>

      <div>
        <span className="text-sm font-medium">Liens</span>
        {action.contextLinks.length ? <div className="mt-1.5 flex flex-wrap gap-1.5">{action.contextLinks.map((link) => <span key={`${link.module}-${link.id}`} className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold">
          <Link href={link.href} className="hover:underline">{link.label}</Link>
          <button type="button" aria-label={`Retirer ${link.label}`} className="text-slate-400 hover:text-red-600" onClick={() => removeActionContextLink(action.id, link.module, link.id, author)}>×</button>
        </span>)}</div> : <p className="mt-1 text-xs text-slate-500">Aucun lien pour l’instant.</p>}
        <div className="mt-2"><ActionLinkPickers onAdd={(link) => addActionContextLink(action.id, link, author)} /></div>
      </div>

      <ActionActivity action={action} onAddComment={(text) => addActionComment(action.id, author, text)} />
    </div>
  </PlanningDialogShell>;
}
