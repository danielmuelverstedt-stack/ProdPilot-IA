"use client";

import { useState } from "react";
import { fieldClass, primaryButton, secondaryButton } from "@/components/ui/ModuleUi";
import { PlanningDialogShell } from "@/features/planning/components/PlanningDialogShell";

const LINE_COUNT_PRESETS = [10, 25, 50] as const;

export function WorkshopMachinePrintDialog({ machineLabel, totalOperationCount, onConfirm, onClose }: {
  machineLabel: string;
  totalOperationCount: number;
  onConfirm: (lineCount: number | "all") => void;
  onClose: () => void;
}) {
  const [selection, setSelection] = useState<number | "all">(totalOperationCount > 10 ? 10 : "all");
  const [customValue, setCustomValue] = useState("");

  function selectPreset(value: number | "all") {
    setSelection(value);
    setCustomValue("");
  }

  function applyCustomValue(raw: string) {
    setCustomValue(raw);
    const parsed = Number(raw);
    if (raw.trim() && Number.isFinite(parsed) && parsed > 0) setSelection(Math.min(Math.floor(parsed), totalOperationCount));
  }

  return <PlanningDialogShell
    title="Imprimer la fiche machine"
    description={`${machineLabel} · ${totalOperationCount.toLocaleString("fr-BE")} opération(s) actuellement affichée(s)`}
    onClose={onClose}
    actions={<><button type="button" className={secondaryButton} onClick={onClose}>Annuler</button><button type="button" className={primaryButton} disabled={!totalOperationCount} onClick={() => onConfirm(selection)}>Imprimer</button></>}
  >
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium">Combien de lignes imprimer ?</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {LINE_COUNT_PRESETS.filter((preset) => preset < totalOperationCount).map((preset) => <button key={preset} type="button" className={selection === preset ? primaryButton : secondaryButton} onClick={() => selectPreset(preset)}>{preset} lignes</button>)}
          <button type="button" className={selection === "all" ? primaryButton : secondaryButton} onClick={() => selectPreset("all")}>Toutes ({totalOperationCount.toLocaleString("fr-BE")})</button>
        </div>
      </div>
      <label className="block text-sm font-medium">Ou un nombre précis
        <input type="number" min={1} max={totalOperationCount} className={`${fieldClass} mt-1 w-32`} value={customValue} placeholder="Ex. 15" onChange={(event) => applyCustomValue(event.target.value)} />
      </label>
      <p className="text-xs text-slate-500">Les lignes imprimées suivent l’ordre et le tri actuellement affichés à l’écran pour cette machine.</p>
    </div>
  </PlanningDialogShell>;
}
