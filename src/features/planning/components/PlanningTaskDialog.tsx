import { useState } from "react";
import { fieldClass, primaryButton, secondaryButton } from "@/components/ui/ModuleUi";
import { PlanningDialogShell } from "@/features/planning/components/PlanningDialogShell";
import type { PlanningDay, PlanningMachine } from "@/features/planning/types/planning";
import type { PlanningCellTarget } from "@/features/planning/components/PlanningOperationDialog";

export function PlanningTaskDialog({ initialTarget, machines, days, onConfirm, onClose }: {
  initialTarget: PlanningCellTarget;
  machines: PlanningMachine[];
  days: PlanningDay[];
  onConfirm: (value: { kind: "Maintenance" | "Divers"; machineId: string; date: string; label: string; durationHours: number; responsible: string }) => void;
  onClose: () => void;
}) {
  const [kind, setKind] = useState<"Maintenance" | "Divers">("Maintenance");
  const [machineId, setMachineId] = useState(initialTarget.machineId || machines[0]?.id || "");
  const [date, setDate] = useState(initialTarget.date || days[0]?.date || "");
  const [label, setLabel] = useState("");
  const [durationHours, setDurationHours] = useState(4);
  const [responsible, setResponsible] = useState("");
  return <PlanningDialogShell title="Planifier une tâche hors OF" onClose={onClose} actions={<><button type="button" className={secondaryButton} onClick={onClose}>Annuler</button><button type="button" className={primaryButton} disabled={!machineId || !date || !label.trim()} onClick={() => onConfirm({ kind, machineId, date, label: label.trim(), durationHours: Math.max(0.5, durationHours), responsible: responsible.trim() })}>Planifier</button></>}>
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="grid gap-1 text-sm font-semibold">Type<select className={fieldClass} value={kind} onChange={(event) => setKind(event.target.value as "Maintenance" | "Divers")}><option>Maintenance</option><option>Divers</option></select></label>
      <label className="grid gap-1 text-sm font-semibold">Machine<select className={fieldClass} value={machineId} onChange={(event) => setMachineId(event.target.value)}>{machines.map((machine) => <option key={machine.id} value={machine.id}>{machine.id} · {machine.displayName}</option>)}</select></label>
      <label className="grid gap-1 text-sm font-semibold sm:col-span-2">Libellé<input autoFocus className={fieldClass} value={label} onChange={(event) => setLabel(event.target.value)} placeholder="Ex. Révision broche" /></label>
      <label className="grid gap-1 text-sm font-semibold">Jour<select className={fieldClass} value={date} onChange={(event) => setDate(event.target.value)}>{days.map((day) => <option key={day.date} value={day.date}>{day.dayLabel} {day.dateLabel} · S{day.week}</option>)}</select></label>
      <label className="grid gap-1 text-sm font-semibold">Durée (h)<input type="number" min="0.5" step="0.5" className={fieldClass} value={durationHours} onChange={(event) => setDurationHours(Number(event.target.value))} /></label>
      <label className="grid gap-1 text-sm font-semibold sm:col-span-2">Responsable<input className={fieldClass} value={responsible} onChange={(event) => setResponsible(event.target.value)} placeholder="Nom" /></label>
    </div>
  </PlanningDialogShell>;
}
