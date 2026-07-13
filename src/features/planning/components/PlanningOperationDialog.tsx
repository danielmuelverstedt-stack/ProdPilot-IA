import { useMemo, useState } from "react";
import { fieldClass, formatEuropeanDate, primaryButton, secondaryButton } from "@/components/ui/ModuleUi";
import type { DemoData } from "@/features/demo/types/demo";
import { PlanningDialogShell } from "@/features/planning/components/PlanningDialogShell";
import type { PlanningMachine } from "@/features/planning/types/planning";

export interface PlanningCellTarget { machineId: string; date: string; }

export function PlanningOperationDialog({ target, machine, data, currentHours, onConfirm, onTask, onClose }: {
  target: PlanningCellTarget;
  machine: PlanningMachine;
  data: DemoData;
  currentHours: number;
  onConfirm: (orderId: string, operationId: string, durationHours: number) => void;
  onTask: () => void;
  onClose: () => void;
}) {
  const candidates = useMemo(() => data.workOrders.flatMap((order) => order.operations
    .filter((operation) => operation.status !== "Terminée" && (operation.department === machine.department || operation.machineId === machine.id))
    .map((operation) => ({ order, operation }))), [data.workOrders, machine.department, machine.id]);
  const [selection, setSelection] = useState(candidates[0] ? `${candidates[0].order.id}|${candidates[0].operation.id}` : "");
  const selected = candidates.find(({ order, operation }) => `${order.id}|${operation.id}` === selection);
  const [hours, setHours] = useState(selected?.operation.plannedDurationHours ?? 1);
  return <PlanningDialogShell title={`Ajouter un OF — ${machine.id}`} description={`${formatEuropeanDate(`${target.date}T12:00:00.000Z`)} · charge actuelle ${currentHours.toLocaleString("fr-BE")}/${machine.capacityHours} h`} onClose={onClose} actions={<><button type="button" className={secondaryButton} onClick={onClose}>Annuler</button><button type="button" className={primaryButton} disabled={!selected} onClick={() => selected && onConfirm(selected.order.id, selected.operation.id, Math.max(0.5, hours))}>Ajouter au planning</button></>}>
    {candidates.length ? <div className="grid gap-4">
      <label className="grid gap-1 text-sm font-semibold">OF et opération
        <select className={fieldClass} value={selection} onChange={(event) => { setSelection(event.target.value); const next = candidates.find(({ order, operation }) => `${order.id}|${operation.id}` === event.target.value); if (next) setHours(next.operation.plannedDurationHours); }}>
          {candidates.map(({ order, operation }) => <option key={operation.id} value={`${order.id}|${operation.id}`}>{order.id} · {order.priority} · OP{operation.number} {operation.description}</option>)}
        </select>
      </label>
      {selected ? <div className="rounded-xl border border-[var(--app-border)] bg-slate-50 p-4 text-sm"><strong>{selected.order.customer}</strong><p>{selected.order.article} · {selected.order.quantity} pièces</p><p className="mt-1 text-xs text-slate-500">Échéance {formatEuropeanDate(`${selected.order.dueDate}T12:00:00.000Z`)} · {selected.order.description}</p></div> : null}
      <label className="grid gap-1 text-sm font-semibold">Durée planifiée (h)
        <input type="number" min="0.5" step="0.5" className={fieldClass} value={hours} onChange={(event) => setHours(Number(event.target.value))} />
      </label>
    </div> : <p className="text-sm text-slate-600">Aucune opération compatible avec ce département.</p>}
    <button type="button" className={`${secondaryButton} mt-5 w-full border-dashed`} onClick={onTask}>🔧 Planifier une maintenance / tâche libre sur cette case</button>
    <p className="mt-3 text-xs text-slate-500">Plusieurs OF peuvent partager la journée. La charge sera recalculée et signalée en rouge au-delà de la capacité.</p>
  </PlanningDialogShell>;
}
