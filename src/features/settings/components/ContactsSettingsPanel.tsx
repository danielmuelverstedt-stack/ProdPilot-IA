"use client";

import { useState } from "react";
import { useSettings } from "@/features/settings/components/SettingsProvider";
import { buttonClass, Field, inputClass, SettingsPanel } from "@/features/settings/components/SettingsUi";
import { createSettingsId } from "@/features/settings/services/settings-identifiers";
import type { ContactCategorySettings } from "@/features/settings/types/settings";

/** Miroir de `ActionOriginsEditor` (ActionsSettingsPanel.tsx) pour les catégories de contacts : même interaction, même modèle `OrderedStandardSettings`. */
export function ContactsSettingsPanel() {
  const { settings, updateSettings } = useSettings();
  const [editing, setEditing] = useState<ContactCategorySettings | null>(null);
  const categories = [...settings.contacts.categories].sort((a, b) => a.order - b.order);

  function startNew() {
    setEditing({ id: "", value: "", label: "", color: settings.theme.information, textColor: settings.theme.card, active: true, order: categories.length });
  }

  function save() {
    if (!editing?.label.trim()) return;
    const saved = { ...editing, id: editing.id || createSettingsId("contact-category", editing.label, categories.map((item) => item.id)), value: editing.value || editing.label.trim(), label: editing.label.trim() };
    updateSettings((draft) => {
      const index = draft.contacts.categories.findIndex((item) => item.id === saved.id);
      if (index >= 0) draft.contacts.categories[index] = saved; else draft.contacts.categories.push(saved);
    }, "Catégorie de contact enregistrée");
    setEditing(null);
  }

  function reorder(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (!categories[target]) return;
    const reordered = [...categories];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    updateSettings((draft) => { draft.contacts.categories = reordered.map((item, order) => ({ ...item, order })); }, "Ordre des catégories de contact modifié");
  }

  function remove(item: ContactCategorySettings) {
    if (!window.confirm(`Supprimer la catégorie « ${item.label} » ? Les contacts déjà classés dans cette catégorie la perdront.`)) return;
    updateSettings((draft) => { draft.contacts.categories = draft.contacts.categories.filter((entry) => entry.id !== item.id); }, "Catégorie de contact supprimée");
  }

  return <SettingsPanel title="Catégories de contacts" description="Classement des fiches de l'annuaire (Direction, Production, Fournisseur, Sous-traitance…). Un contact peut appartenir à plusieurs catégories." actions={<button className={buttonClass} onClick={startNew}>Ajouter</button>}>
    <div className="space-y-2">{categories.map((item, index) => <div key={item.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-[var(--app-border)] p-3">
      <span className="h-5 w-5 rounded" style={{ background: item.color }} />
      <strong className="min-w-36 flex-1 text-sm">{item.label}</strong>
      <span className="text-xs text-slate-500">{item.active ? "Active" : "Inactive"}</span>
      <button className={buttonClass} disabled={index === 0} onClick={() => reorder(index, -1)}>↑</button>
      <button className={buttonClass} disabled={index === categories.length - 1} onClick={() => reorder(index, 1)}>↓</button>
      <button className={buttonClass} onClick={() => setEditing({ ...item })}>Modifier</button>
      <button className={buttonClass} onClick={() => remove(item)}>Supprimer</button>
    </div>)}</div>
    {editing ? <div className="mt-4 grid gap-4 rounded-xl border border-[var(--app-border)] bg-slate-50 p-4 md:grid-cols-2">
      <Field label="Libellé"><input className={inputClass} value={editing.label} onChange={(event) => setEditing({ ...editing, label: event.target.value })} /></Field>
      <label className="flex items-center gap-2 self-end pb-2 text-sm"><input type="checkbox" checked={editing.active} onChange={(event) => setEditing({ ...editing, active: event.target.checked })} /> Active</label>
      <Field label="Couleur"><input type="color" className={`${inputClass} h-11 w-full p-1`} value={editing.color} onChange={(event) => setEditing({ ...editing, color: event.target.value })} /></Field>
      <Field label="Couleur du texte"><input type="color" className={`${inputClass} h-11 w-full p-1`} value={editing.textColor} onChange={(event) => setEditing({ ...editing, textColor: event.target.value })} /></Field>
      <div className="flex gap-2 md:col-span-2"><button className={buttonClass} onClick={save}>Enregistrer</button><button className={buttonClass} onClick={() => setEditing(null)}>Annuler</button></div>
    </div> : null}
  </SettingsPanel>;
}
