"use client";

import { useMemo, useState } from "react";
import { PlanningDialogShell } from "@/features/planning/components/PlanningDialogShell";
import { PhotoThumbnail } from "@/components/ui/PhotoThumbnail";
import { fieldClass, primaryButton, secondaryButton } from "@/components/ui/ModuleUi";
import { useDemoData } from "@/features/demo/services/demo-repository";
import { useContactPhotos } from "@/features/contacts/services/contact-photo-store";
import { ContactFormDialog } from "@/features/contacts/components/ContactFormDialog";
import { contactFullName, sortContactsByName } from "@/features/contacts/services/contact-directory";
import type { ContactType } from "@/features/demo/types/demo";

/**
 * Fenêtre de sélection multiple dans l'annuaire Contacts, réutilisable partout où un autre module a
 * besoin de rattacher une ou plusieurs personnes (réunions aujourd'hui) sans dupliquer sa liste ni sa
 * recherche. Propose la création d'un contact manquant directement depuis la sélection : une fois
 * créé, il est automatiquement coché, prêt à être ajouté avec le reste de la sélection.
 */
export function ContactPickerDialog({ title, description, typeFilter, excludeIds = [], onConfirm, onClose }: {
  title: string;
  description?: string;
  typeFilter?: ContactType;
  /** Contacts déjà rattachés ailleurs (ex. déjà participants de la réunion) : masqués de la liste, inutile de les proposer deux fois. */
  excludeIds?: string[];
  onConfirm: (contactIds: string[]) => void;
  onClose: () => void;
}) {
  const data = useDemoData();
  const photos = useContactPhotos();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  const contacts = useMemo(() => {
    const base = data.contacts.filter((contact) => !excludeIds.includes(contact.id) && (!typeFilter || contact.type === typeFilter));
    const normalized = search.trim().toLocaleLowerCase("fr");
    const filtered = normalized ? base.filter((contact) => `${contactFullName(contact)} ${contact.company ?? ""}`.toLocaleLowerCase("fr").includes(normalized)) : base;
    return sortContactsByName(filtered);
  }, [data.contacts, excludeIds, typeFilter, search]);

  function toggle(id: string) {
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  function confirm() {
    if (!selected.length) return;
    onConfirm(selected);
    onClose();
  }

  return <>
    <PlanningDialogShell
      title={title}
      description={description}
      onClose={onClose}
      actions={<><button type="button" className={secondaryButton} onClick={onClose}>Annuler</button><button type="button" className={primaryButton} disabled={!selected.length} onClick={confirm}>Ajouter{selected.length ? ` (${selected.length})` : ""}</button></>}
    >
      <input className={`${fieldClass} w-full`} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher un contact…" autoFocus />
      <div className="mt-3 max-h-80 overflow-y-auto rounded-lg border border-[var(--app-border)]">
        {contacts.length ? contacts.map((contact) => {
          const checked = selected.includes(contact.id);
          return <label key={contact.id} className="flex cursor-pointer items-center gap-3 border-b border-slate-100 px-3 py-2 text-sm last:border-0 hover:bg-slate-50">
            <input type="checkbox" checked={checked} onChange={() => toggle(contact.id)} />
            <PhotoThumbnail photoDataUrl={photos[contact.id]} alt={contactFullName(contact)} size="md" />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium">{contactFullName(contact)}</span>
              <span className="block truncate text-xs text-slate-500">{[contact.role, contact.company].filter(Boolean).join(" · ") || "—"}</span>
            </span>
          </label>;
        }) : <p className="p-3 text-xs text-slate-500">Aucun contact ne correspond{search.trim() ? " à la recherche" : ""}.</p>}
      </div>
      <button type="button" className={`${secondaryButton} mt-3 w-full`} onClick={() => setCreating(true)}>+ Créer un contact</button>
    </PlanningDialogShell>
    {creating ? <ContactFormDialog onClose={() => setCreating(false)} onSaved={(id) => { setSelected((current) => (current.includes(id) ? current : [...current, id])); setCreating(false); }} /> : null}
  </>;
}
