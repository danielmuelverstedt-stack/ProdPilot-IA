"use client";

import { useMemo, useState } from "react";
import { fieldClass, secondaryButton } from "@/components/ui/ModuleUi";
import { PhotoThumbnail } from "@/components/ui/PhotoThumbnail";
import { updateDemoData, useDemoData } from "@/features/demo/services/demo-repository";
import { useSettings } from "@/features/settings/components/SettingsProvider";
import { useContactPhotos } from "@/features/contacts/services/contact-photo-store";
import { ContactPickerDialog } from "@/features/contacts/components/ContactPickerDialog";
import { contactFullName, sortContactsByName } from "@/features/contacts/services/contact-directory";
import type { Contact, Meeting, MeetingParticipant } from "@/features/demo/types/demo";

/**
 * Étape « Participants » d'une réunion : le responsable et les participants ne sont que des
 * références vers le module Contacts (photo, nom, fonction, service toujours lus en direct depuis
 * la fiche, jamais dupliqués ici) — seuls l'appartenance à la réunion et le statut Présent/Absent
 * sont enregistrés. Une personne assignée à une action pendant la réunion qui n'en fait pas encore
 * partie peut aussi y être ajoutée automatiquement, après confirmation (`MeetingWorkflow.linkActionToMeeting`).
 */
export function MeetingParticipantsPicker({ meeting }: { meeting: Meeting }) {
  const data = useDemoData();
  const { settings } = useSettings();
  const photos = useContactPhotos();
  const [search, setSearch] = useState("");
  const [picking, setPicking] = useState(false);
  const categories = settings.contacts.categories;

  const internalContacts = useMemo(() => sortContactsByName(data.contacts.filter((contact) => contact.type === "Interne")), [data.contacts]);
  const contactsById = useMemo(() => new Map(data.contacts.map((contact) => [contact.id, contact])), [data.contacts]);

  const participantContacts = meeting.participants
    .map((participant) => ({ participant, contact: contactsById.get(participant.contactId) }))
    .filter((item): item is { participant: MeetingParticipant; contact: Contact } => item.contact !== undefined);
  const normalizedSearch = search.trim().toLocaleLowerCase("fr");
  const visibleParticipants = normalizedSearch
    ? participantContacts.filter((item) => contactFullName(item.contact).toLocaleLowerCase("fr").includes(normalizedSearch))
    : participantContacts;
  const presentCount = meeting.participants.filter((item) => item.present).length;

  const responsable = meeting.responsableContactId ? contactsById.get(meeting.responsableContactId) ?? null : null;

  function serviceLabel(contact: Contact): string {
    return categories.filter((category) => contact.categoryIds.includes(category.id)).map((category) => category.label).join(", ");
  }

  function setResponsable(contactId: string) {
    updateDemoData((draft) => {
      const target = draft.meetings.find((item) => item.id === meeting.id);
      if (target) target.responsableContactId = contactId || null;
    });
  }

  function setPresent(contactId: string, present: boolean) {
    updateDemoData((draft) => {
      const entry = draft.meetings.find((item) => item.id === meeting.id)?.participants.find((item) => item.contactId === contactId);
      if (entry) entry.present = present;
    });
  }

  function removeParticipant(contactId: string) {
    updateDemoData((draft) => {
      const target = draft.meetings.find((item) => item.id === meeting.id);
      if (target) target.participants = target.participants.filter((item) => item.contactId !== contactId);
    });
  }

  function addParticipants(contactIds: string[]) {
    updateDemoData((draft) => {
      const target = draft.meetings.find((item) => item.id === meeting.id);
      if (!target) return;
      for (const contactId of contactIds) if (!target.participants.some((item) => item.contactId === contactId)) target.participants.push({ contactId, present: true });
    });
  }

  return <div className="grid gap-6">
    <section className="rounded-2xl border border-[var(--app-border)] bg-slate-50 p-4 sm:p-5">
      <h3 className="text-sm font-semibold">Responsable de la réunion</h3>
      <p className="mt-1 text-xs text-slate-500">Sélectionné parmi les contacts internes.</p>
      <select className={`${fieldClass} mt-3 w-full max-w-sm bg-white`} value={meeting.responsableContactId ?? ""} onChange={(event) => setResponsable(event.target.value)}>
        <option value="">Sélection…</option>
        {internalContacts.map((contact) => <option key={contact.id} value={contact.id}>{contactFullName(contact)}</option>)}
      </select>
      {responsable ? <div className="mt-3 flex items-center gap-3">
        <PhotoThumbnail photoDataUrl={photos[responsable.id]} alt={contactFullName(responsable)} size="md" />
        <div className="min-w-0 text-sm">
          <p className="truncate font-medium">{contactFullName(responsable)}</p>
          <p className="truncate text-xs text-slate-500">{[responsable.role, serviceLabel(responsable)].filter(Boolean).join(" · ") || "—"}</p>
        </div>
      </div> : null}
    </section>

    <section className="rounded-2xl border border-[var(--app-border)] bg-slate-50 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">Participants</h3>
        <p className="text-xs text-slate-500">{presentCount} présent{presentCount > 1 ? "s" : ""} sur {meeting.participants.length}</p>
      </div>
      <input className={`${fieldClass} mt-3 w-full max-w-sm bg-white`} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher un participant…" />
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {visibleParticipants.length ? visibleParticipants.map(({ participant, contact }) => <div key={contact.id} className="flex items-center gap-3 rounded-xl border border-[var(--app-border)] bg-white p-3">
          <PhotoThumbnail photoDataUrl={photos[contact.id]} alt={contactFullName(contact)} size="md" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{contactFullName(contact)}</p>
            <p className="truncate text-xs text-slate-500">{[contact.role, serviceLabel(contact)].filter(Boolean).join(" · ") || "—"}</p>
          </div>
          <label className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-slate-600">
            <input type="checkbox" checked={participant.present} onChange={(event) => setPresent(contact.id, event.target.checked)} />
            Présent
          </label>
          <button type="button" aria-label={`Retirer ${contactFullName(contact)} des participants`} className="shrink-0 text-slate-400 hover:text-red-600" onClick={() => removeParticipant(contact.id)}>×</button>
        </div>) : <p className="text-xs text-slate-500 sm:col-span-2">{meeting.participants.length ? "Aucun participant ne correspond à la recherche." : "Aucun participant pour l’instant."}</p>}
      </div>
      <button type="button" className={`${secondaryButton} mt-4`} onClick={() => setPicking(true)}>+ Ajouter un participant</button>
    </section>

    {picking ? <ContactPickerDialog
      title="Ajouter des participants"
      description="Sélectionnez un ou plusieurs contacts internes à ajouter à la réunion."
      typeFilter="Interne"
      excludeIds={meeting.participants.map((item) => item.contactId)}
      onConfirm={addParticipants}
      onClose={() => setPicking(false)}
    /> : null}
  </div>;
}
