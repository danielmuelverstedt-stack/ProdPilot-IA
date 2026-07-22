"use client";

import { useState } from "react";
import { useSettings } from "@/features/settings/components/SettingsProvider";
import { buttonClass, Field, inputClass, SettingsPanel } from "@/features/settings/components/SettingsUi";
import { createSettingsId } from "@/features/settings/services/settings-identifiers";
import type { MailTemplateSettings } from "@/features/settings/types/settings";

export function MailTemplatesSettingsPanel() {
  const { settings, updateSettings } = useSettings();
  const [editing, setEditing] = useState<MailTemplateSettings | null>(null);
  const templates = [...settings.mailTemplates].sort((a, b) => a.order - b.order);

  function startNew() {
    setEditing({ id: "", name: "", subject: "", body: "", active: true, order: templates.length });
  }

  function save() {
    if (!editing?.name.trim() || !editing.subject.trim() || !editing.body.trim()) return;
    const saved = { ...editing, id: editing.id || createSettingsId("mail-template", editing.name, templates.map((item) => item.id)), name: editing.name.trim(), subject: editing.subject.trim() };
    updateSettings((draft) => {
      const index = draft.mailTemplates.findIndex((item) => item.id === saved.id);
      if (index >= 0) draft.mailTemplates[index] = saved; else draft.mailTemplates.push(saved);
    }, "Modèle de mail enregistré");
    setEditing(null);
  }

  function reorder(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (!templates[target]) return;
    const reordered = [...templates];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    updateSettings((draft) => { draft.mailTemplates = reordered.map((item, order) => ({ ...item, order })); }, "Ordre des modèles de mail modifié");
  }

  function remove(item: MailTemplateSettings) {
    if (!window.confirm(`Supprimer le modèle « ${item.name} » ?`)) return;
    updateSettings((draft) => { draft.mailTemplates = draft.mailTemplates.filter((entry) => entry.id !== item.id); }, "Modèle de mail supprimé");
  }

  return <SettingsPanel title="Modèles de mails" description="Modèles réutilisables que l’assistant peut proposer et adapter au contexte de production. Placeholders disponibles : {client}, {fournisseur}, {of}, {echeance}, {probleme}." actions={<button className={buttonClass} onClick={startNew}>Ajouter</button>}>
    <div className="space-y-2">{templates.map((item, index) => <div key={item.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-[var(--app-border)] p-3">
      <strong className="min-w-40 flex-1 text-sm">{item.name}</strong>
      <span className="text-xs text-slate-500">{item.active ? "Actif" : "Inactif"}</span>
      <button className={buttonClass} disabled={index === 0} onClick={() => reorder(index, -1)}>↑</button>
      <button className={buttonClass} disabled={index === templates.length - 1} onClick={() => reorder(index, 1)}>↓</button>
      <button className={buttonClass} onClick={() => setEditing({ ...item })}>Modifier</button>
      <button className={buttonClass} onClick={() => remove(item)}>Supprimer</button>
    </div>)}</div>
    {editing ? <div className="mt-4 grid gap-4 rounded-xl border border-[var(--app-border)] bg-slate-50 p-4">
      <Field label="Nom"><input className={inputClass} value={editing.name} onChange={(event) => setEditing({ ...editing, name: event.target.value })} /></Field>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editing.active} onChange={(event) => setEditing({ ...editing, active: event.target.checked })} /> Actif</label>
      <Field label="Objet"><input className={inputClass} value={editing.subject} onChange={(event) => setEditing({ ...editing, subject: event.target.value })} /></Field>
      <Field label="Corps"><textarea className={`${inputClass} min-h-32 py-2`} value={editing.body} onChange={(event) => setEditing({ ...editing, body: event.target.value })} /></Field>
      <div className="flex gap-2"><button className={buttonClass} onClick={save}>Enregistrer</button><button className={buttonClass} onClick={() => setEditing(null)}>Annuler</button></div>
    </div> : null}
  </SettingsPanel>;
}
