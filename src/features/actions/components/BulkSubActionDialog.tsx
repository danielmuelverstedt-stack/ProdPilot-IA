"use client";

import { useState } from "react";
import { fieldClass, primaryButton, secondaryButton } from "@/components/ui/ModuleUi";
import { createSubActions } from "@/features/actions/services/action-service";
import { useDemoData } from "@/features/demo/services/demo-repository";
import { PlanningDialogShell } from "@/features/planning/components/PlanningDialogShell";
import { useSettings } from "@/features/settings/components/SettingsProvider";
import { currentDemoUserName } from "@/features/settings/services/current-user";

interface Row { id: number; description: string; responsable: string; echeance: string }
let rowSequence = 3;
const emptyRows = (): Row[] => [1, 2, 3].map((id) => ({ id, description: "", responsable: "", echeance: "" }));

export function BulkSubActionDialog({ parentActionId, origine, onClose }: { parentActionId: string; origine: string; onClose: () => void }) {
  const data = useDemoData(); const { settings } = useSettings();
  const [rows, setRows] = useState<Row[]>(emptyRows);
  const [error, setError] = useState("");
  const people = [...new Set([...settings.users.filter((item) => item.active).map((item) => `${item.firstName} ${item.lastName}`), ...data.actions.map((item) => item.responsable)].filter(Boolean))].sort((a, b) => a.localeCompare(b, "fr"));
  function update(id: number, patch: Partial<Row>) { setRows((current) => current.map((row) => row.id === id ? { ...row, ...patch } : row)); }
  function addRow() { rowSequence += 1; setRows((current) => [...current, { id: rowSequence, description: "", responsable: "", echeance: "" }]); }
  function submit() {
    const used = rows.filter((row) => row.description.trim() || row.responsable.trim() || row.echeance);
    if (!used.length) { setError("Ajoutez au moins une sous-action."); return; }
    if (used.some((row) => !row.description.trim() || !row.responsable.trim() || !row.echeance)) { setError("Complétez la description, le responsable et l’échéance de chaque ligne utilisée."); return; }
    createSubActions(parentActionId, used.map((row) => ({ description: row.description, responsable: row.responsable, echeance: row.echeance, origine, introduitPar: currentDemoUserName(settings), contextLinks: [] })));
    onClose();
  }
  return <PlanningDialogShell title="Ajouter plusieurs sous-actions" description="Complétez autant de lignes que nécessaire, puis validez une seule fois." maxWidthClassName="max-w-5xl" onClose={onClose} actions={<><button className={secondaryButton} onClick={onClose}>Annuler</button><button className={primaryButton} onClick={submit}>Créer les sous-actions</button></>}>
    <div className="overflow-x-auto"><div className="min-w-[700px]"><div className="grid grid-cols-[minmax(260px,1fr)_190px_160px_42px] gap-2 px-2 pb-2 text-xs font-semibold uppercase text-slate-500"><span>Sous-action</span><span>Responsable</span><span>Échéance</span><span /></div><div className="grid gap-2">{rows.map((row, index) => <div key={row.id} className="grid grid-cols-[minmax(260px,1fr)_190px_160px_42px] items-center gap-2 rounded-lg bg-slate-50 p-2"><input autoFocus={index === 0} className={fieldClass} value={row.description} onChange={(event) => update(row.id, { description: event.target.value })} placeholder={`Sous-action ${index + 1}`} /><input list="bulk-subaction-people" className={fieldClass} value={row.responsable} onChange={(event) => update(row.id, { responsable: event.target.value })} placeholder="Responsable" /><input type="date" className={fieldClass} value={row.echeance} onChange={(event) => update(row.id, { echeance: event.target.value })} /><button className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-700" aria-label={`Retirer la ligne ${index + 1}`} disabled={rows.length === 1} onClick={() => setRows((current) => current.filter((item) => item.id !== row.id))}>×</button></div>)}</div><datalist id="bulk-subaction-people">{people.map((person) => <option key={person} value={person} />)}</datalist></div></div>
    {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}<button className={`${secondaryButton} mt-3`} onClick={addRow}>+ Ajouter une ligne</button><p className="mt-2 text-xs text-slate-500">Les lignes entièrement vides ne seront pas enregistrées.</p>
  </PlanningDialogShell>;
}
