"use client";

import { useState } from "react";
import { fieldClass, primaryButton, secondaryButton, StatusPill } from "@/components/ui/ModuleUi";
import { updateDemoData, useDemoData } from "@/features/demo/services/demo-repository";
import { PlanningDialogShell } from "@/features/planning/components/PlanningDialogShell";
import { CONSUMABLE_CATEGORIES, machineConsumableService, type MachineConsumableInput } from "@/features/machines/services/machine-consumable-service";
import type { ConsumableCategory, MachineConsumable } from "@/features/demo/types/demo";

const emptyInput: MachineConsumableInput = { category: "Filtre", designation: "", manufacturerReference: "", supplier: "", replacementFrequency: "", storageLocation: "", notes: "" };

const categoryTone: Record<ConsumableCategory, "neutral" | "success" | "warning" | "danger" | "info"> = {
  "Filtre": "info",
  "Huile": "warning",
  "Graisse": "neutral",
  "Liquide de coupe": "success",
  "Autre": "danger",
};

function ConsumableForm({ input, onChange }: { input: MachineConsumableInput; onChange: (input: MachineConsumableInput) => void }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="text-sm font-medium">Catégorie<select className={`${fieldClass} mt-1 w-full`} value={input.category} onChange={(event) => onChange({ ...input, category: event.target.value as ConsumableCategory })}>{CONSUMABLE_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}</select></label>
      <label className="text-sm font-medium">Désignation<input required className={`${fieldClass} mt-1 w-full`} value={input.designation} onChange={(event) => onChange({ ...input, designation: event.target.value })} /></label>
      <label className="text-sm font-medium">Référence fabricant<input className={`${fieldClass} mt-1 w-full`} value={input.manufacturerReference} onChange={(event) => onChange({ ...input, manufacturerReference: event.target.value })} /></label>
      <label className="text-sm font-medium">Fournisseur<input className={`${fieldClass} mt-1 w-full`} value={input.supplier} onChange={(event) => onChange({ ...input, supplier: event.target.value })} /></label>
      <label className="text-sm font-medium">Fréquence de remplacement<input className={`${fieldClass} mt-1 w-full`} value={input.replacementFrequency} onChange={(event) => onChange({ ...input, replacementFrequency: event.target.value })} /></label>
      <label className="text-sm font-medium">Lieu de stockage<input className={`${fieldClass} mt-1 w-full`} value={input.storageLocation} onChange={(event) => onChange({ ...input, storageLocation: event.target.value })} /></label>
      <label className="text-sm font-medium sm:col-span-2">Remarques<textarea className={`${fieldClass} mt-1 min-h-16 w-full py-2`} value={input.notes} onChange={(event) => onChange({ ...input, notes: event.target.value })} /></label>
    </div>
  );
}

export function MachineConsumablesPanel({ machineId }: { machineId: string }) {
  const data = useDemoData();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<ConsumableCategory | "">("");
  const [editingConsumable, setEditingConsumable] = useState<MachineConsumable | null>(null);
  const [creating, setCreating] = useState(false);
  const [input, setInput] = useState<MachineConsumableInput>(emptyInput);

  const machineConsumables = data.consumables.filter((entry) => entry.machineId === machineId);
  const term = search.trim().toLowerCase();
  const filtered = machineConsumables.filter((entry) => {
    if (categoryFilter && entry.category !== categoryFilter) return false;
    if (!term) return true;
    return [entry.designation, entry.manufacturerReference, entry.supplier].some((value) => value.toLowerCase().includes(term));
  });

  function openCreate() { setInput(emptyInput); setCreating(true); }
  function openEdit(consumable: MachineConsumable) { setInput(consumable); setEditingConsumable(consumable); }
  function close() { setCreating(false); setEditingConsumable(null); }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!input.designation.trim()) return;
    if (editingConsumable) updateDemoData((draft) => machineConsumableService.update(draft, editingConsumable.id, input));
    else updateDemoData((draft) => machineConsumableService.create(draft, machineId, input));
    close();
  }

  function remove(id: string) {
    if (!window.confirm("Supprimer ce consommable ?")) return;
    updateDemoData((draft) => machineConsumableService.remove(draft, id));
  }

  return (
    <section className="mt-8 border-t border-slate-100 pt-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">Consommables</h3>
        <button className={secondaryButton} onClick={openCreate}>Ajouter un consommable</button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <input className={`${fieldClass} min-w-48 flex-1`} placeholder="Rechercher (désignation, référence, fournisseur)" value={search} onChange={(event) => setSearch(event.target.value)} />
        <select className={`${fieldClass}`} value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value as ConsumableCategory | "")}>
          <option value="">Toutes les catégories</option>
          {CONSUMABLE_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
        </select>
      </div>

      {filtered.length ? (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead><tr className="text-xs font-semibold uppercase text-slate-500">
              <th className="border-b border-slate-200 p-2">Catégorie</th>
              <th className="border-b border-slate-200 p-2">Désignation</th>
              <th className="border-b border-slate-200 p-2">Référence</th>
              <th className="border-b border-slate-200 p-2">Fournisseur</th>
              <th className="border-b border-slate-200 p-2">Fréquence</th>
              <th className="border-b border-slate-200 p-2">Stockage</th>
              <th className="border-b border-slate-200 p-2">Remarques</th>
              <th className="border-b border-slate-200 p-2" />
            </tr></thead>
            <tbody>
              {filtered.map((consumable) => (
                <tr key={consumable.id}>
                  <td className="border-b border-slate-100 p-2 align-top"><StatusPill tone={categoryTone[consumable.category]}>{consumable.category}</StatusPill></td>
                  <td className="border-b border-slate-100 p-2 align-top font-medium">{consumable.designation}{consumable.isExample ? <span className="ml-2 text-xs font-normal text-slate-400">(exemple)</span> : null}</td>
                  <td className="border-b border-slate-100 p-2 align-top">{consumable.manufacturerReference || "À compléter"}</td>
                  <td className="border-b border-slate-100 p-2 align-top">{consumable.supplier || "À compléter"}</td>
                  <td className="border-b border-slate-100 p-2 align-top">{consumable.replacementFrequency || "À compléter"}</td>
                  <td className="border-b border-slate-100 p-2 align-top">{consumable.storageLocation || "À compléter"}</td>
                  <td className="border-b border-slate-100 p-2 align-top text-slate-500">{consumable.notes || "—"}</td>
                  <td className="border-b border-slate-100 p-2 align-top">
                    <div className="flex gap-2">
                      <button className={secondaryButton} onClick={() => openEdit(consumable)}>Modifier</button>
                      <button className={secondaryButton} onClick={() => remove(consumable.id)}>Supprimer</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <p className="mt-3 text-sm text-slate-500">{machineConsumables.length ? "Aucun consommable ne correspond à la recherche." : "Aucun consommable enregistré pour cette machine."}</p>}

      {creating || editingConsumable ? (
        <PlanningDialogShell title={editingConsumable ? "Modifier le consommable" : "Nouveau consommable"} onClose={close} actions={<><button type="button" className={secondaryButton} onClick={close}>Annuler</button><button type="submit" form="machine-consumable-form" className={primaryButton}>Enregistrer</button></>}>
          <form id="machine-consumable-form" onSubmit={submit}>
            <ConsumableForm input={input} onChange={setInput} />
          </form>
        </PlanningDialogShell>
      ) : null}
    </section>
  );
}
