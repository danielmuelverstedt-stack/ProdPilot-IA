"use client";

import { useState } from "react";
import { useSettings } from "@/features/settings/components/SettingsProvider";
import { buttonClass, Field, inputClass, SettingsPanel } from "@/features/settings/components/SettingsUi";
import { createSettingsId } from "@/features/settings/services/settings-identifiers";
import type { ActionOriginSettings } from "@/features/settings/types/settings";

export function ActionsSettingsPanel() {
  return <div className="space-y-5">
    <ActionOriginsEditor />
    <ActionColumnsEditor />
  </div>;
}

function ActionOriginsEditor() {
  const { settings, updateSettings } = useSettings();
  const [editing, setEditing] = useState<ActionOriginSettings | null>(null);
  const origins = [...settings.actions.origins].sort((a, b) => a.order - b.order);

  function startNew() {
    setEditing({ id: "", value: "", label: "", color: settings.theme.information, textColor: settings.theme.card, active: true, order: origins.length });
  }

  function save() {
    if (!editing?.label.trim()) return;
    const saved = { ...editing, id: editing.id || createSettingsId("origin", editing.label, origins.map((item) => item.id)), value: editing.value || editing.label.trim(), label: editing.label.trim() };
    updateSettings((draft) => {
      const index = draft.actions.origins.findIndex((item) => item.id === saved.id);
      if (index >= 0) draft.actions.origins[index] = saved; else draft.actions.origins.push(saved);
    }, "Origine d’action enregistrée");
    setEditing(null);
  }

  function reorder(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (!origins[target]) return;
    const reordered = [...origins];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    updateSettings((draft) => { draft.actions.origins = reordered.map((item, order) => ({ ...item, order })); }, "Ordre des origines modifié");
  }

  function remove(item: ActionOriginSettings) {
    if (!window.confirm(`Supprimer l’origine « ${item.label} » ? Les actions déjà créées conserveront ce libellé.`)) return;
    updateSettings((draft) => { draft.actions.origins = draft.actions.origins.filter((entry) => entry.id !== item.id); }, "Origine d’action supprimée");
  }

  return <SettingsPanel title="Origines des actions" description="Modules pouvant créer une action dans le registre unique. Cette liste apparaît dans les comptes rendus et sert de preuve de traçabilité." actions={<button className={buttonClass} onClick={startNew}>Ajouter</button>}>
    <div className="space-y-2">{origins.map((item, index) => <div key={item.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-[var(--app-border)] p-3">
      <span className="h-5 w-5 rounded" style={{ background: item.color }} />
      <strong className="min-w-36 flex-1 text-sm">{item.label}</strong>
      <span className="text-xs text-slate-500">{item.active ? "Active" : "Inactive"}</span>
      <button className={buttonClass} disabled={index === 0} onClick={() => reorder(index, -1)}>↑</button>
      <button className={buttonClass} disabled={index === origins.length - 1} onClick={() => reorder(index, 1)}>↓</button>
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

function ActionColumnsEditor() {
  const { settings, updateSettings } = useSettings();
  const columns = [...settings.actions.columns].sort((a, b) => a.order - b.order);

  function reorder(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (!columns[target]) return;
    const reordered = [...columns];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    updateSettings((draft) => { draft.actions.columns = reordered.map((item, order) => ({ ...item, order })); }, "Ordre des colonnes du registre d’actions modifié");
  }

  return <SettingsPanel title="Colonnes du registre" description="Choisissez les colonnes affichées dans la page Actions et leur ordre.">
    <div className="grid gap-2 sm:grid-cols-2">{columns.map((column, index) => <div key={column.id} className="flex items-center gap-2 rounded-lg border border-[var(--app-border)] p-2">
      <input type="checkbox" checked={column.visible} onChange={(event) => updateSettings((draft) => { const target = draft.actions.columns.find((item) => item.id === column.id); if (target) target.visible = event.target.checked; }, "Visibilité de colonne modifiée")} />
      <span className="flex-1 text-sm">{column.label}</span>
      <button className={buttonClass} disabled={index === 0} onClick={() => reorder(index, -1)}>↑</button>
      <button className={buttonClass} disabled={index === columns.length - 1} onClick={() => reorder(index, 1)}>↓</button>
    </div>)}</div>
  </SettingsPanel>;
}
