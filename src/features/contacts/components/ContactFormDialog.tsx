"use client";

import { useState } from "react";
import { PlanningDialogShell } from "@/features/planning/components/PlanningDialogShell";
import { fieldClass, primaryButton, secondaryButton } from "@/components/ui/ModuleUi";
import { useSettings } from "@/features/settings/components/SettingsProvider";
import { createContact, updateContact, type ContactInput } from "@/features/contacts/services/contact-service";
import type { Contact, ContactType } from "@/features/demo/types/demo";

const CONTACT_TYPES: ContactType[] = ["Interne", "Externe"];

function toInput(contact: Contact): ContactInput {
  return { type: contact.type, firstName: contact.firstName, lastName: contact.lastName, company: contact.company, role: contact.role, categoryIds: contact.categoryIds, phone: contact.phone, mobile: contact.mobile, email: contact.email, address: contact.address, website: contact.website, notes: contact.notes };
}

/** Fenêtre unique pour créer ou modifier un contact — mêmes champs dans les deux cas, comme `ActionFormDialog`. */
export function ContactFormDialog({ contact = null, onClose, onSaved }: { contact?: Contact | null; onClose: () => void; onSaved?: (id: string) => void }) {
  const { settings } = useSettings();
  const categories = [...settings.contacts.categories].filter((item) => item.active).sort((a, b) => a.order - b.order);
  const [form, setForm] = useState<ContactInput>(contact ? toInput(contact) : { type: "Interne", firstName: "", lastName: "", company: "", role: "", categoryIds: [], phone: "", mobile: "", email: "", address: "", website: "", notes: "" });
  const isEditing = contact !== null;

  function toggleCategory(categoryId: string) {
    setForm((current) => ({ ...current, categoryIds: current.categoryIds?.includes(categoryId) ? current.categoryIds.filter((id) => id !== categoryId) : [...(current.categoryIds ?? []), categoryId] }));
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim()) return;
    const id = isEditing ? contact.id : createContact(form);
    if (isEditing) updateContact(contact.id, form);
    onSaved?.(id);
    onClose();
  }

  return <PlanningDialogShell
    title={isEditing ? "Modifier le contact" : "Nouveau contact"}
    description="Annuaire d'entreprise centralisé : collaborateurs, fournisseurs, sous-traitants et tout autre contact professionnel."
    onClose={onClose}
    actions={<><button type="button" className={secondaryButton} onClick={onClose}>Annuler</button><button type="submit" form="contact-form-dialog" className={primaryButton}>{isEditing ? "Enregistrer" : "Créer le contact"}</button></>}
  >
    <form id="contact-form-dialog" onSubmit={submit} className="grid gap-3">
      <div className="flex flex-wrap gap-2">{CONTACT_TYPES.map((type) => <button key={type} type="button" onClick={() => setForm({ ...form, type })} className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${form.type === type ? "border-[color-mix(in_srgb,var(--app-primary)_45%,transparent)] bg-[color-mix(in_srgb,var(--app-primary)_10%,white)] text-[var(--app-primary)]" : "border-[var(--app-border)] bg-white text-slate-600 hover:bg-slate-50"}`}>{type === "Interne" ? "Contact interne" : "Contact externe"}</button>)}</div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium">Prénom<input required autoFocus className={`${fieldClass} mt-1 w-full`} value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} /></label>
        <label className="text-sm font-medium">Nom<input required className={`${fieldClass} mt-1 w-full`} value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} /></label>
      </div>
      {form.type === "Externe" ? <label className="text-sm font-medium">Société<input className={`${fieldClass} mt-1 w-full`} value={form.company ?? ""} onChange={(event) => setForm({ ...form, company: event.target.value })} /></label> : null}
      <label className="text-sm font-medium">Fonction<input className={`${fieldClass} mt-1 w-full`} value={form.role ?? ""} onChange={(event) => setForm({ ...form, role: event.target.value })} /></label>
      <div>
        <span className="text-sm font-medium">Catégories</span>
        <div className="mt-1 flex flex-wrap gap-1.5">{categories.map((category) => {
          const active = form.categoryIds?.includes(category.id) ?? false;
          return <button key={category.id} type="button" onClick={() => toggleCategory(category.id)} className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition ${active ? "text-white" : "border-[var(--app-border)] bg-white text-slate-600 hover:bg-slate-50"}`} style={active ? { backgroundColor: category.color, borderColor: category.color } : undefined}>{category.label}</button>;
        })}</div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium">Téléphone<input type="tel" className={`${fieldClass} mt-1 w-full`} value={form.phone ?? ""} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></label>
        <label className="text-sm font-medium">Mobile<input type="tel" className={`${fieldClass} mt-1 w-full`} value={form.mobile ?? ""} onChange={(event) => setForm({ ...form, mobile: event.target.value })} /></label>
      </div>
      <label className="text-sm font-medium">Adresse e-mail<input type="email" className={`${fieldClass} mt-1 w-full`} value={form.email ?? ""} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
      <label className="text-sm font-medium">Adresse<textarea className={`${fieldClass} mt-1 min-h-16 w-full py-3`} value={form.address ?? ""} onChange={(event) => setForm({ ...form, address: event.target.value })} /></label>
      <label className="text-sm font-medium">Site internet (facultatif)<input type="url" placeholder="https://…" className={`${fieldClass} mt-1 w-full`} value={form.website ?? ""} onChange={(event) => setForm({ ...form, website: event.target.value })} /></label>
      <label className="text-sm font-medium">Notes<textarea className={`${fieldClass} mt-1 min-h-16 w-full py-3`} value={form.notes ?? ""} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></label>
    </form>
  </PlanningDialogShell>;
}
