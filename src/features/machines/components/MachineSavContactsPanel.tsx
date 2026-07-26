"use client";

import { useState } from "react";
import { fieldClass, formatEuropeanDate, primaryButton, secondaryButton } from "@/components/ui/ModuleUi";
import { updateDemoData, useDemoData } from "@/features/demo/services/demo-repository";
import { PlanningDialogShell } from "@/features/planning/components/PlanningDialogShell";
import { machineSavContactService, type MachineSavContactInput } from "@/features/machines/services/machine-sav-contact-service";
import type { MachineSavContact } from "@/features/demo/types/demo";

const emptyInput: MachineSavContactInput = { company: "", contactName: "", phone: "", email: "", contractReference: "", contractExpiry: null, notes: "" };

function ContactForm({ input, onChange }: { input: MachineSavContactInput; onChange: (input: MachineSavContactInput) => void }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="text-sm font-medium">Société<input required className={`${fieldClass} mt-1 w-full`} value={input.company} onChange={(event) => onChange({ ...input, company: event.target.value })} /></label>
      <label className="text-sm font-medium">Contact<input className={`${fieldClass} mt-1 w-full`} value={input.contactName} onChange={(event) => onChange({ ...input, contactName: event.target.value })} /></label>
      <label className="text-sm font-medium">Téléphone<input className={`${fieldClass} mt-1 w-full`} value={input.phone} onChange={(event) => onChange({ ...input, phone: event.target.value })} /></label>
      <label className="text-sm font-medium">E-mail<input type="email" className={`${fieldClass} mt-1 w-full`} value={input.email} onChange={(event) => onChange({ ...input, email: event.target.value })} /></label>
      <label className="text-sm font-medium">N° de contrat<input className={`${fieldClass} mt-1 w-full`} value={input.contractReference} onChange={(event) => onChange({ ...input, contractReference: event.target.value })} /></label>
      <label className="text-sm font-medium">Échéance du contrat<input type="date" className={`${fieldClass} mt-1 w-full`} value={input.contractExpiry ?? ""} onChange={(event) => onChange({ ...input, contractExpiry: event.target.value || null })} /></label>
      <label className="text-sm font-medium sm:col-span-2">Remarques<textarea className={`${fieldClass} mt-1 min-h-16 w-full py-2`} value={input.notes} onChange={(event) => onChange({ ...input, notes: event.target.value })} /></label>
    </div>
  );
}

export function MachineSavContactsPanel({ machineId }: { machineId: string }) {
  const data = useDemoData();
  const contacts = data.savContacts.filter((entry) => entry.machineId === machineId);
  const [editingContact, setEditingContact] = useState<MachineSavContact | null>(null);
  const [creating, setCreating] = useState(false);
  const [input, setInput] = useState<MachineSavContactInput>(emptyInput);

  function openCreate() { setInput(emptyInput); setCreating(true); }
  function openEdit(contact: MachineSavContact) { setInput(contact); setEditingContact(contact); }
  function close() { setCreating(false); setEditingContact(null); }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!input.company.trim()) return;
    if (editingContact) updateDemoData((draft) => machineSavContactService.update(draft, editingContact.id, input));
    else updateDemoData((draft) => machineSavContactService.create(draft, machineId, input));
    close();
  }

  function remove(id: string) {
    if (!window.confirm("Supprimer ce contact SAV ?")) return;
    updateDemoData((draft) => machineSavContactService.remove(draft, id));
  }

  return (
    <section className="mt-8 border-t border-slate-100 pt-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">Contacts SAV</h3>
        <button className={secondaryButton} onClick={openCreate}>Ajouter un contact</button>
      </div>
      {contacts.length ? (
        <div className="mt-3 grid gap-3">
          {contacts.map((contact) => (
            <article key={contact.id} className="rounded-xl bg-slate-50 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <strong>{contact.company}</strong>
                  {contact.contactName ? <span className="text-sm text-slate-600"> · {contact.contactName}</span> : null}
                  <p className="mt-1 text-sm text-slate-600">{[contact.phone, contact.email].filter(Boolean).join(" · ") || "À compléter"}</p>
                  <p className="mt-1 text-xs text-slate-500">{contact.contractReference ? `Contrat ${contact.contractReference}` : "Aucun contrat renseigné"}{contact.contractExpiry ? ` · échéance ${formatEuropeanDate(contact.contractExpiry)}` : ""}</p>
                  {contact.notes ? <p className="mt-1 text-xs text-slate-500">{contact.notes}</p> : null}
                </div>
                <div className="flex gap-2">
                  <button className={secondaryButton} onClick={() => openEdit(contact)}>Modifier</button>
                  <button className={secondaryButton} onClick={() => remove(contact.id)}>Supprimer</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : <p className="mt-3 text-sm text-slate-500">Aucun contact SAV enregistré pour cette machine.</p>}

      {creating || editingContact ? (
        <PlanningDialogShell title={editingContact ? "Modifier le contact SAV" : "Nouveau contact SAV"} onClose={close} actions={<><button type="button" className={secondaryButton} onClick={close}>Annuler</button><button type="submit" form="machine-sav-contact-form" className={primaryButton}>Enregistrer</button></>}>
          <form id="machine-sav-contact-form" onSubmit={submit}>
            <ContactForm input={input} onChange={setInput} />
          </form>
        </PlanningDialogShell>
      ) : null}
    </section>
  );
}
