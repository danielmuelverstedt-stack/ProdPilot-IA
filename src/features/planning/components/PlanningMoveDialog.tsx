import { useState } from "react";
import { fieldClass, formatEuropeanDate, primaryButton, secondaryButton } from "@/components/ui/ModuleUi";
import { PlanningDialogShell } from "@/features/planning/components/PlanningDialogShell";
import type { PlanningDay, PlanningMachine, PlanningMoveTarget } from "@/features/planning/types/planning";

export function PlanningMoveDialog({ target, machines, days, currentLoad, maintenanceConflict, loadColors, onConfirm, onClose }: {
  target: PlanningMoveTarget;
  machines: PlanningMachine[];
  days: PlanningDay[];
  currentLoad: (machineId: string, date: string) => number;
  maintenanceConflict: (machineId: string, date: string) => string | null;
  loadColors: { normal: string; warning: string; critical: string };
  onConfirm: (machineId: string, date: string) => void;
  onClose: () => void;
}) {
  const [machineId, setMachineId] = useState(target.machineId);
  const [date, setDate] = useState(target.date);
  const machine = machines.find((item) => item.id === machineId);
  const isErpBlock = target.block.source === "erp-operation";
  const blockLabel = target.block.source === "work-order" ? target.block.order.id : target.block.operationView.workOrderId;
  const staysInPlace = target.block.machineId === machineId && target.block.date === date;
  const loadAfter = currentLoad(machineId, date) + (staysInPlace ? 0 : (target.block.durationHours ?? 0));
  const capacity = machine?.capacityByDate[date] ?? 0;
  const isOverloaded = loadAfter > capacity;
  const conflict = maintenanceConflict(machineId, date);
  return <PlanningDialogShell
    title={`Déplacer ${blockLabel}`}
    description={isErpBlock ? "Le changement est écrit directement dans les données ERP (même route que le Planning Atelier) et s’y reflète immédiatement." : "Le changement sera conservé dans les données locales de démonstration."}
    onClose={onClose}
    actions={<><button type="button" className={secondaryButton} onClick={onClose}>Annuler</button><button type="button" className={primaryButton} onClick={() => onConfirm(machineId, date)}>Confirmer le déplacement</button></>}
  >
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="grid gap-1 text-sm font-semibold">Machine
        <select className={fieldClass} value={machineId} onChange={(event) => setMachineId(event.target.value)}>{machines.map((item) => <option key={item.id} value={item.id}>{item.id} · {item.displayName}</option>)}</select>
      </label>
      <label className="grid gap-1 text-sm font-semibold">Date
        <select className={fieldClass} value={date} onChange={(event) => setDate(event.target.value)}>{days.map((day) => <option key={day.date} value={day.date}>{formatEuropeanDate(`${day.date}T12:00:00.000Z`)}</option>)}</select>
      </label>
    </div>
    {target.block.durationHours === null
      ? <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">Le temps de fabrication de cet OF ERP n’est pas disponible : il n’entre pas dans le calcul de charge ci-dessous.</div>
      : <div className="mt-4 rounded-xl border p-4 text-sm" style={{ borderColor: isOverloaded ? loadColors.critical : loadColors.normal, background: `color-mix(in srgb, ${isOverloaded ? loadColors.critical : loadColors.normal} 8%, white)`, color: isOverloaded ? loadColors.critical : loadColors.normal }}>
          Charge après déplacement : <strong>{loadAfter.toLocaleString("fr-BE")}/{capacity.toLocaleString("fr-BE")} h</strong>{isOverloaded ? " — surcharge" : ""}.
        </div>}
    {conflict ? <div className="mt-3 rounded-xl border p-4 text-sm" style={{ borderColor: loadColors.warning, background: `color-mix(in srgb, ${loadColors.warning} 10%, white)`, color: loadColors.warning }}><strong>Maintenance prévue :</strong> {conflict}. Vous pouvez continuer après vérification.</div> : null}
  </PlanningDialogShell>;
}
