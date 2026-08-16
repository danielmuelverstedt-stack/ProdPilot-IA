"use client";

import { useState, type ReactNode } from "react";
import { useSettings } from "@/features/settings/components/SettingsProvider";
import { buttonClass, Field, inputClass, SettingsPanel } from "@/features/settings/components/SettingsUi";
import { createSettingsId } from "@/features/settings/services/settings-identifiers";
import type { OrderedStandardSettings, PrioritySettings, StatusSettings, TaskTypeSettings } from "@/features/settings/types/settings";

type StandardKey = "halls" | "departments" | "priorities" | "statuses" | "maintenanceStatuses" | "taskTypes" | "maintenanceTypes" | "projetSuiviStatuses";

export function ProductionStandardsSettings() {
  const { settings } = useSettings();
  return <div className="space-y-5">
    <StandardsEditor title="Halls" description="Ajoutez, renommez, activez et ordonnez les halls proposés dans le Planning Atelier. Un hall contenant encore des catégories ou des machines ne peut pas être supprimé." settingKey="halls" items={settings.production.halls} canDelete={(hall) => !settings.production.departments.some((department) => department.hallId === hall.id) && !settings.production.machines.some((machine) => machine.hallId === hall.id)} />
    <StandardsEditor title="Départements" description="Les onglets du Planning suivent cet ordre, ces libellés et ces couleurs." settingKey="departments" items={settings.production.departments} />
    <StandardsEditor title="Priorités" description="Libellés, ordre, activation et couleurs utilisés sur les cartes du Planning." settingKey="priorities" items={settings.production.priorities} extra={(item, patch) => <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={(item as PrioritySettings).highlight} onChange={(event) => patch({ highlight: event.target.checked })} /> Mettre en évidence</label>} createExtra={{ highlight: false }} />
    <StandardsEditor title="Statuts des opérations" description="Les comportements pilotent notamment le blocage et le statut choisi lors d’un ajout." settingKey="statuses" items={settings.production.statuses} extra={(item, patch) => <Field label="Comportement"><select className={inputClass} value={(item as StatusSettings).behavior} onChange={(event) => patch({ behavior: event.target.value as StatusSettings["behavior"] })}><option value="neutral">Neutre</option><option value="planned">Planifié</option><option value="in-progress">En cours</option><option value="blocked">Bloquant</option><option value="completed">Terminé</option></select></Field>} createExtra={{ behavior: "neutral" }} />
    <StandardsEditor title="Statuts de maintenance" description="Statuts disponibles pour les interventions affichées dans le Planning." settingKey="maintenanceStatuses" items={settings.production.maintenanceStatuses} extra={(item, patch) => <Field label="Comportement"><select className={inputClass} value={(item as StatusSettings).behavior} onChange={(event) => patch({ behavior: event.target.value as StatusSettings["behavior"] })}><option value="neutral">Neutre</option><option value="planned">Planifié</option><option value="in-progress">En cours</option><option value="blocked">Bloquant</option><option value="completed">Terminé</option></select></Field>} createExtra={{ behavior: "neutral" }} />
    <StandardsEditor title="Types de tâches Planning" description="Catégories des tâches libres et couleurs des blocs correspondants." settingKey="taskTypes" items={settings.production.taskTypes} extra={(item, patch) => <Field label="Catégorie"><select className={inputClass} value={(item as TaskTypeSettings).category} onChange={(event) => patch({ category: event.target.value as TaskTypeSettings["category"] })}><option value="maintenance">Maintenance</option><option value="other">Autre tâche</option></select></Field>} createExtra={{ category: "other" }} />
    <StandardsEditor title="Types de maintenance" description="Types proposés lorsqu’une tâche appartient à la catégorie maintenance." settingKey="maintenanceTypes" items={settings.production.maintenanceTypes} />
    <StandardsEditor title="Statuts de suivi de projet" description="Statuts proposés pour le point daté posé sur un OF suivi à l’étape « Cinq projets critiques » de la réunion Production." settingKey="projetSuiviStatuses" items={settings.production.projetSuiviStatuses} />
  </div>;
}

function StandardsEditor<T extends OrderedStandardSettings>({ title, description, settingKey, items, extra, createExtra = {}, canDelete = () => true }: {
  title: string;
  description: string;
  settingKey: StandardKey;
  items: T[];
  extra?: (item: T, patch: (value: Partial<T>) => void) => ReactNode;
  createExtra?: Partial<T>;
  canDelete?: (item: T) => boolean;
}) {
  const { settings, updateSettings } = useSettings();
  const [editing, setEditing] = useState<T | null>(null);
  const sorted = [...items].sort((a, b) => a.order - b.order);
  function startNew() {
    setEditing({ id: "", value: "", label: "", color: settings.theme.information, textColor: settings.theme.card, active: true, order: items.length, ...createExtra } as T);
  }
  function save() {
    if (!editing?.label.trim()) return;
    const saved = { ...editing, id: editing.id || createSettingsId("standard", editing.label, items.map((item) => item.id)), value: editing.value || editing.label.trim(), label: editing.label.trim() };
    updateSettings((draft) => {
      const list = draft.production[settingKey] as T[];
      const index = list.findIndex((item) => item.id === saved.id);
      if (index >= 0) list[index] = saved; else list.push(saved);
    }, `${title} mis à jour`);
    setEditing(null);
  }
  function reorder(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (!sorted[target]) return;
    const reordered = [...sorted];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    updateSettings((draft) => { (draft.production[settingKey] as T[]) = reordered.map((item, order) => ({ ...item, order })); }, `Ordre ${title.toLocaleLowerCase("fr")} modifié`);
  }
  return <SettingsPanel title={title} description={description} actions={<button className={buttonClass} onClick={startNew}>Ajouter</button>}>
    <div className="space-y-2">{sorted.map((item, index) => <div key={item.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-[var(--app-border)] p-3"><span className="h-5 w-5 rounded" style={{ background: item.color }} /><strong className="min-w-36 flex-1 text-sm">{item.label}</strong><span className="text-xs text-slate-500">{item.active ? "Actif" : "Inactif"}</span><button className={buttonClass} disabled={index === 0} onClick={() => reorder(index, -1)}>↑</button><button className={buttonClass} disabled={index === sorted.length - 1} onClick={() => reorder(index, 1)}>↓</button><button className={buttonClass} onClick={() => setEditing({ ...item })}>Modifier</button><button className={buttonClass} disabled={!canDelete(item)} title={!canDelete(item) ? "Déplacez d’abord les catégories et les machines de ce hall." : undefined} onClick={() => updateSettings((draft) => { draft.production[settingKey] = draft.production[settingKey].filter((entry) => entry.id !== item.id) as never; }, `${title} supprimé`)}>Supprimer</button></div>)}</div>
    {editing ? <div className="mt-4 grid gap-4 rounded-xl border border-[var(--app-border)] bg-slate-50 p-4 md:grid-cols-2"><Field label="Libellé"><input className={inputClass} value={editing.label} onChange={(event) => setEditing({ ...editing, label: event.target.value })} /></Field><label className="flex items-center gap-2 self-end pb-2 text-sm"><input type="checkbox" checked={editing.active} onChange={(event) => setEditing({ ...editing, active: event.target.checked })} /> Actif</label><Field label="Couleur"><input type="color" className={`${inputClass} h-11 w-full p-1`} value={editing.color} onChange={(event) => setEditing({ ...editing, color: event.target.value })} /></Field><Field label="Couleur du texte"><input type="color" className={`${inputClass} h-11 w-full p-1`} value={editing.textColor} onChange={(event) => setEditing({ ...editing, textColor: event.target.value })} /></Field>{extra?.(editing, (value) => setEditing({ ...editing, ...value }))}<div className="flex gap-2 md:col-span-2"><button className={buttonClass} onClick={save}>Enregistrer</button><button className={buttonClass} onClick={() => setEditing(null)}>Annuler</button></div></div> : null}
  </SettingsPanel>;
}
