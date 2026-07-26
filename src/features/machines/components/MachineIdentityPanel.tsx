"use client";

import { useState } from "react";
import Link from "next/link";
import { fieldClass, primaryButton, secondaryButton } from "@/components/ui/ModuleUi";
import { TASK_CATEGORY_CODES, TASK_CATEGORY_LABELS } from "@/lib/task-category-dictionary";
import type { MachineIdentityUpdate } from "@/features/settings/services/machine-settings-service";
import type { DepartmentSettings, MachineSettings } from "@/features/settings/types/settings";

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm font-medium">{value}</dd>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      <span className="mb-1.5 block">{label}</span>
      {children}
    </label>
  );
}

function toPatch(machine: MachineSettings): MachineIdentityUpdate {
  return {
    name: machine.name,
    displayName: machine.displayName,
    departmentId: machine.departmentId,
    machineType: machine.machineType,
    color: machine.color,
    futureCapacityHours: machine.futureCapacityHours ?? null,
    comments: machine.comments ?? "",
    favorite: machine.favorite ?? false,
    taskCategoryCode: machine.taskCategoryCode ?? null,
  };
}

export function MachineIdentityPanel({ machine, departments, openActionsCount, mappedErpCodes, onSave }: { machine: MachineSettings; departments: DepartmentSettings[]; openActionsCount: number; mappedErpCodes: string[]; onSave: (patch: MachineIdentityUpdate) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<MachineIdentityUpdate>(() => toPatch(machine));

  if (!editing) {
    const department = departments.find((entry) => entry.id === machine.departmentId);
    return (
      <div>
        <div className="flex justify-end">
          <button className={secondaryButton} onClick={() => { setDraft(toPatch(machine)); setEditing(true); }}>Modifier</button>
        </div>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <Info label="Nom technique" value={machine.name} />
          <Info label="Nom affiché" value={machine.displayName} />
          <Info label="Département" value={department?.label ?? machine.department} />
          <Info label="Type" value={machine.machineType || "—"} />
          <Info label="Catégorie" value={machine.taskCategoryCode ? TASK_CATEGORY_LABELS[machine.taskCategoryCode] ?? machine.taskCategoryCode : "Non catégorisée"} />
          <div>
            <dt className="text-xs font-semibold uppercase text-slate-500">Code(s) ERP associé(s)</dt>
            <dd className="mt-1 text-sm font-medium">{mappedErpCodes.length ? mappedErpCodes.join(", ") : "Aucun"} <Link href="/planning" className="ml-1 text-xs font-normal text-[var(--app-primary)] hover:underline">Gérer les correspondances ERP</Link></dd>
          </div>
          <Info label="Capacité future" value={machine.futureCapacityHours == null ? "Non définie" : `${machine.futureCapacityHours.toLocaleString("fr-BE")} h/j`} />
          <Info label="Favori" value={machine.favorite ? "Oui" : "Non"} />
          <Info label="Actions ouvertes" value={String(openActionsCount)} />
          <Info label="Commentaires" value={machine.comments || "—"} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nom technique">
          <input className={`${fieldClass} w-full`} value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
        </Field>
        <Field label="Nom affiché">
          <input className={`${fieldClass} w-full`} value={draft.displayName} onChange={(event) => setDraft({ ...draft, displayName: event.target.value })} />
        </Field>
        <Field label="Département">
          <select className={`${fieldClass} w-full`} value={draft.departmentId} onChange={(event) => setDraft({ ...draft, departmentId: event.target.value })}>
            {departments.filter((item) => item.active).map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </Field>
        <Field label="Type">
          <input className={`${fieldClass} w-full`} value={draft.machineType} onChange={(event) => setDraft({ ...draft, machineType: event.target.value })} />
        </Field>
        <Field label="Catégorie">
          <select className={`${fieldClass} w-full`} value={draft.taskCategoryCode ?? ""} onChange={(event) => setDraft({ ...draft, taskCategoryCode: event.target.value || null })}>
            <option value="">Non catégorisée</option>
            {TASK_CATEGORY_CODES.map((code) => <option key={code} value={code}>{TASK_CATEGORY_LABELS[code]}</option>)}
          </select>
        </Field>
        <Field label="Capacité future (h/jour)">
          <input type="number" min="0" step="0.5" className={`${fieldClass} w-full`} value={draft.futureCapacityHours ?? ""} onChange={(event) => setDraft({ ...draft, futureCapacityHours: event.target.value === "" ? null : Number(event.target.value) })} />
        </Field>
        <Field label="Couleur spécifique">
          <input type="color" className={`${fieldClass} h-11 w-full p-1`} value={draft.color || "#64748b"} onChange={(event) => setDraft({ ...draft, color: event.target.value })} />
        </Field>
        <label className="flex items-center gap-2 text-sm font-medium sm:col-span-2">
          <input type="checkbox" checked={draft.favorite} onChange={(event) => setDraft({ ...draft, favorite: event.target.checked })} /> Machine favorite
        </label>
        <Field label="Commentaires">
          <textarea className={`${fieldClass} min-h-24 w-full py-2`} value={draft.comments} onChange={(event) => setDraft({ ...draft, comments: event.target.value })} />
        </Field>
      </div>
      <div className="mt-4 flex gap-2">
        <button className={primaryButton} onClick={() => { onSave(draft); setEditing(false); }}>Enregistrer</button>
        <button className={secondaryButton} onClick={() => setEditing(false)}>Annuler</button>
      </div>
    </div>
  );
}
