import { useState } from "react";
import { fieldClass, formatEuropeanDate, primaryButton, secondaryButton } from "@/components/ui/ModuleUi";
import { PlanningDialogShell } from "@/features/planning/components/PlanningDialogShell";
import type { PlanningDay, PlanningMachine, PlanningMoveTarget } from "@/features/planning/types/planning";

export function PlanningMoveDialog({ target, machines, days, currentLoad, maintenanceConflict, onConfirm, onClose }: {
  target: PlanningMoveTarget;
  machines: PlanningMachine[];
  days: PlanningDay[];
  currentLoad: (machineId: string, date: string) => number;
  maintenanceConflict: (machineId: string, date: string) => string | null;
  onConfirm: (machineId: string, date: string) => void;
  onClose: () => void;
}) {
  const [machineId, setMachineId] = useState(target.machineId);
  const [date, setDate] = useState(target.date);
  const machine = machines.find((item) => item.id === machineId);
  const loadAfter = currentLoad(machineId, date) + (target.block.machineId === machineId && target.block.date === date ? 0 : target.block.durationHours);
  const conflict = maintenanceConflict(machineId, date);
  return <PlanningDialogShell title={`Déplacer ${target.block.order.id}`} description="Le changement sera conservé dans les données locales de démonstration." onClose={onClose} actions={<><button type="button" className={secondaryButton} onClick={onClose}>Annuler</button><button type="button" className={primaryButton} onClick={() => onConfirm(machineId, date)}>Confirmer le déplacement</button></>}>
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="grid gap-1 text-sm font-semibold">Machine
        <select className={fieldClass} value={machineId} onChange={(event) => setMachineId(event.target.value)}>{machines.map((item) => <option key={item.id} value={item.id}>{item.id} · {item.displayName}</option>)}</select>
      </label>
      <label className="grid gap-1 text-sm font-semibold">Date
        <select className={fieldClass} value={date} onChange={(event) => setDate(event.target.value)}>{days.map((day) => <option key={day.date} value={day.date}>{formatEuropeanDate(`${day.date}T12:00:00.000Z`)}</option>)}</select>
      </label>
    </div>
    <div className={`mt-4 rounded-xl border p-4 text-sm ${loadAfter > (machine?.capacityHours ?? 8) ? "border-red-200 bg-red-50 text-red-800" : "border-slate-200 bg-slate-50 text-slate-700"}`}>
      Charge après déplacement : <strong>{loadAfter.toLocaleString("fr-BE")}/{machine?.capacityHours ?? 8} h</strong>{loadAfter > (machine?.capacityHours ?? 8) ? " — surcharge" : ""}.
    </div>
    {conflict ? <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><strong>Maintenance prévue :</strong> {conflict}. Vous pouvez continuer après vérification.</div> : null}
  </PlanningDialogShell>;
}
