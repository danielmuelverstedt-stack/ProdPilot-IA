/* Les aperçus locaux en data URL ne passent pas par l’optimiseur d’images. */
/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import { CapacitySettingsEditor } from "@/features/settings/components/CapacitySettingsEditor";
import { ProductionStandardsSettings } from "@/features/settings/components/ProductionStandardsSettings";
import { useSettings } from "@/features/settings/components/SettingsProvider";
import { buttonClass, Field, inputClass, SettingsPanel } from "@/features/settings/components/SettingsUi";
import type { MachineSettings } from "@/features/settings/types/settings";

export function ProductionSettingsPanel() {
  const { settings, updateSettings } = useSettings();
  const [editing, setEditing] = useState<MachineSettings | null>(null);
  const machines = [...settings.production.machines].sort((a, b) => a.order - b.order);
  const departments = [...settings.production.departments].sort((a, b) => a.order - b.order);
  function createMachine() {
    const department = departments.find((item) => item.active) ?? departments[0];
    setEditing({ id: "", active: true, name: "", displayName: "", department: department?.label ?? "", departmentId: department?.id ?? "", machineType: "", color: "", order: machines.length, photoDataUrl: "", technicalInformation: "" });
  }
  function saveMachine() {
    if (!editing?.id.trim() || !editing.name.trim() || !editing.departmentId) return;
    const department = departments.find((item) => item.id === editing.departmentId);
    const saved = { ...editing, id: editing.id.trim(), name: editing.name.trim(), displayName: editing.displayName.trim() || editing.name.trim(), department: department?.label ?? editing.department };
    updateSettings((draft) => { const index = draft.production.machines.findIndex((item) => item.id === saved.id); if (index >= 0) draft.production.machines[index] = saved; else draft.production.machines.push(saved); }, "Machine enregistrée");
    setEditing(null);
  }
  function reorderMachine(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (!machines[target]) return;
    const reordered = [...machines];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    updateSettings((draft) => { draft.production.machines = reordered.map((item, order) => ({ ...item, order })); }, "Ordre des machines modifié");
  }
  function readPhoto(file?: File) { if (!file || !editing || !file.type.startsWith("image/")) return; const reader = new FileReader(); reader.onload = () => setEditing((current) => current ? { ...current, photoDataUrl: String(reader.result) } : current); reader.readAsDataURL(file); }

  return <div className="space-y-5">
    <SettingsPanel title="Machines" description="Référentiel central utilisé en temps réel par le Planning, ses filtres et ses impressions." actions={<button className={buttonClass} onClick={createMachine}>Ajouter une machine</button>}>
      <div className="overflow-x-auto"><table className="w-full min-w-[860px] text-left text-sm"><thead className="border-b border-[var(--app-border)] text-xs uppercase text-slate-500"><tr><th className="p-3">Active</th><th className="p-3">Identifiant</th><th className="p-3">Nom affiché</th><th className="p-3">Département</th><th className="p-3">Type</th><th className="p-3">Ordre</th><th className="p-3">Actions</th></tr></thead><tbody>{machines.map((machine, index) => <tr key={machine.id} className="border-b border-slate-100"><td className="p-3">{machine.active ? "Oui" : "Non"}</td><td className="p-3 font-mono">{machine.id}</td><td className="p-3 font-medium"><span className="mr-2 inline-block h-3 w-3 rounded" style={{ background: machine.color || departments.find((item) => item.id === machine.departmentId)?.color }} />{machine.displayName}</td><td className="p-3">{departments.find((item) => item.id === machine.departmentId)?.label ?? machine.department}</td><td className="p-3">{machine.machineType}</td><td className="p-3">{index + 1}</td><td className="p-3"><div className="flex gap-2"><button className={buttonClass} disabled={index === 0} onClick={() => reorderMachine(index, -1)}>↑</button><button className={buttonClass} disabled={index === machines.length - 1} onClick={() => reorderMachine(index, 1)}>↓</button><button className={buttonClass} onClick={() => setEditing({ ...machine })}>Modifier</button><button className={buttonClass} onClick={() => updateSettings((draft) => { draft.production.machines = draft.production.machines.filter((item) => item.id !== machine.id); }, "Machine supprimée")}>Supprimer</button></div></td></tr>)}</tbody></table></div>
    </SettingsPanel>
    {editing ? <SettingsPanel title={settings.production.machines.some((item) => item.id === editing.id) ? "Modifier la machine" : "Nouvelle machine"}><div className="grid gap-4 md:grid-cols-2"><Field label="Identifiant"><input className={inputClass} value={editing.id} disabled={settings.production.machines.some((item) => item.id === editing.id)} onChange={(event) => setEditing({ ...editing, id: event.target.value })} /></Field><Field label="Nom technique"><input className={inputClass} value={editing.name} onChange={(event) => setEditing({ ...editing, name: event.target.value })} /></Field><Field label="Nom affiché"><input className={inputClass} value={editing.displayName} onChange={(event) => setEditing({ ...editing, displayName: event.target.value })} /></Field><Field label="Département"><select className={inputClass} value={editing.departmentId} onChange={(event) => setEditing({ ...editing, departmentId: event.target.value })}>{departments.filter((item) => item.active).map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></Field><Field label="Type"><input className={inputClass} value={editing.machineType} onChange={(event) => setEditing({ ...editing, machineType: event.target.value })} /></Field><Field label="Couleur spécifique (facultative)"><input type="color" className={`${inputClass} h-11 w-full p-1`} value={editing.color || departments.find((item) => item.id === editing.departmentId)?.color || settings.theme.information} onChange={(event) => setEditing({ ...editing, color: event.target.value })} /></Field><Field label="Photo"><input type="file" accept="image/*" className="block w-full text-sm" onChange={(event) => readPhoto(event.target.files?.[0])} /></Field><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editing.active} onChange={(event) => setEditing({ ...editing, active: event.target.checked })} /> Machine active</label><Field label="Informations techniques"><textarea className={`${inputClass} min-h-24 py-2`} value={editing.technicalInformation} onChange={(event) => setEditing({ ...editing, technicalInformation: event.target.value })} /></Field></div>{editing.photoDataUrl ? <img src={editing.photoDataUrl} alt="Aperçu de la machine" className="mt-4 h-28 w-44 rounded-lg border border-[var(--app-border)] object-contain" /> : null}<div className="mt-4 flex gap-2"><button className={buttonClass} onClick={saveMachine}>Enregistrer</button><button className={buttonClass} onClick={() => setEditing(null)}>Annuler</button></div></SettingsPanel> : null}
    <PlanningDefaultsSettings />
    <CapacitySettingsEditor />
    <ProductionStandardsSettings />
    <WorkOrderTypesSettings />
  </div>;
}

function PlanningDefaultsSettings() {
  const { settings, updateSettings } = useSettings();
  const planning = settings.production.planning;
  return <SettingsPanel title="Standards du Planning" description="Valeurs générales utilisées lorsque aucune capacité machine ou département ne les remplace."><div className="grid gap-4 md:grid-cols-3"><Field label="Libellé Tous départements"><input className={inputClass} value={planning.allDepartmentsLabel} onChange={(event) => updateSettings((draft) => { draft.production.planning.allDepartmentsLabel = event.target.value; }, "Libellé global du Planning modifié")} /></Field><Field label="Capacité par défaut (h/jour)"><input type="number" min="0" step="0.5" className={inputClass} value={planning.defaultCapacityHours} onChange={(event) => updateSettings((draft) => { draft.production.planning.defaultCapacityHours = Number(event.target.value); }, "Capacité par défaut modifiée")} /></Field><Field label="Jours travaillés (0 à 6)"><input className={inputClass} value={planning.workingDays.join(",")} onChange={(event) => updateSettings((draft) => { draft.production.planning.workingDays = parseDays(event.target.value); }, "Jours du Planning modifiés")} /></Field><Field label="Premier jour de semaine"><input type="number" min="0" max="6" className={inputClass} value={planning.weekStartsOn} onChange={(event) => updateSettings((draft) => { draft.production.planning.weekStartsOn = Number(event.target.value); }, "Début de semaine modifié")} /></Field><Field label="Nombre de semaines visibles"><input type="number" min="1" max="12" className={inputClass} value={planning.visibleWeeks} onChange={(event) => updateSettings((draft) => { draft.production.planning.visibleWeeks = Number(event.target.value); }, "Période du Planning modifiée")} /></Field><Field label="Seuil d’attention (%)"><input type="number" min="0" max="100" className={inputClass} value={planning.loadWarningPercent} onChange={(event) => updateSettings((draft) => { draft.production.planning.loadWarningPercent = Number(event.target.value); }, "Seuil de charge modifié")} /></Field><Field label="Seuil critique (%)"><input type="number" min="0" className={inputClass} value={planning.loadCriticalPercent} onChange={(event) => updateSettings((draft) => { draft.production.planning.loadCriticalPercent = Number(event.target.value); }, "Seuil critique modifié")} /></Field></div></SettingsPanel>;
}

function WorkOrderTypesSettings() {
  const { settings, updateSettings } = useSettings();
  return <SettingsPanel title="Types d’OF" description="Une valeur par ligne."><Field label="Types d’OF"><textarea className={`${inputClass} min-h-36 py-2`} value={settings.production.workOrderTypes.join("\n")} onChange={(event) => updateSettings((draft) => { draft.production.workOrderTypes = event.target.value.split("\n").map((value) => value.trim()).filter(Boolean); }, "Types d’OF mis à jour")} /></Field></SettingsPanel>;
}

function parseDays(value: string): number[] { return [...new Set(value.split(",").map(Number).filter((day) => Number.isInteger(day) && day >= 0 && day <= 6))]; }
