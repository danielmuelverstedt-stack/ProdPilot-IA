import Link from "next/link";
import { PlanningCard } from "@/features/planning/components/PlanningCard";
import styles from "@/features/planning/components/Planning.module.css";
import type { PlanningBlock, PlanningDay, PlanningMachine, WorkOrderPlanningBlock } from "@/features/planning/types/planning";

export function MachinePlanningRow({ machine, days, blocks, canCreate, canEdit, canPrint, draggedId, dragOver, onDragStart, onDragEnd, onDragOver, onDrop, onAdd, onMove, onReorder, onPrint }: {
  machine: PlanningMachine;
  days: PlanningDay[];
  blocks: PlanningBlock[];
  canCreate: boolean;
  canEdit: boolean;
  canPrint: boolean;
  draggedId: string | null;
  dragOver: string | null;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onDragOver: (key: string) => void;
  onDrop: (machineId: string, date: string) => void;
  onAdd: (machineId: string, date: string) => void;
  onMove: (block: WorkOrderPlanningBlock) => void;
  onReorder: (id: string, direction: -1 | 1) => void;
  onPrint: (machineId: string) => void;
}) {
  const periodHours = blocks.reduce((sum, block) => sum + block.durationHours, 0);
  const capacity = machine.capacityHours * days.length;
  const load = capacity ? Math.round(periodHours / capacity * 100) : 0;
  const loadColor = load >= 95 ? "text-red-700" : load >= 80 ? "text-amber-700" : "text-emerald-700";
  return <tr>
    <td className={`${styles.machineColumn} p-3 align-top`}>
      {machine.hasDetails ? <Link href={`/machines/${machine.id}`} className="font-bold text-[var(--app-primary)] hover:underline">{machine.id}</Link> : <strong>{machine.id}</strong>}
      <span className="mt-0.5 block truncate text-[11px] text-slate-500">{machine.displayName} · {machine.department}</span>
      <span className="mt-1 block text-[10px] text-slate-500">{machine.status}</span>
      {canPrint ? <button type="button" className="mt-1 text-[11px] font-semibold text-[var(--app-primary)] hover:underline" onClick={() => onPrint(machine.id)}>Fiche imprimable</button> : null}
    </td>
    {days.map((day) => {
      const cellBlocks = blocks.filter((block) => block.date === day.date);
      const workOrderBlocks = cellBlocks.filter((block) => block.source === "work-order");
      const hours = cellBlocks.reduce((sum, block) => sum + block.durationHours, 0);
      const overloaded = hours > machine.capacityHours;
      const key = `${machine.id}:${day.date}`;
      return <td key={day.date} className={`${styles.cell} ${day.isFriday ? styles.friday : ""}`}>
        <div
          className={`${styles.cellInner} ${dragOver === key ? styles.dragOver : ""}`}
          onDragOver={(event) => { if (!draggedId) return; event.preventDefault(); onDragOver(key); }}
          onDragLeave={() => onDragOver("")}
          onDrop={(event) => { event.preventDefault(); onDrop(machine.id, day.date); }}
        >
          {cellBlocks.map((block) => { const workIndex = workOrderBlocks.findIndex((item) => item.id === block.id); return <PlanningCard
            key={block.id}
            block={block}
            canEdit={canEdit}
            canMoveUp={workIndex > 0}
            canMoveDown={workIndex >= 0 && workIndex < workOrderBlocks.length - 1}
            onMove={() => block.source === "work-order" && onMove(block)}
            onMoveUp={() => onReorder(block.id, -1)}
            onMoveDown={() => onReorder(block.id, 1)}
            onDragStart={() => onDragStart(block.id)}
            onDragEnd={onDragEnd}
          />; })}
          <div className={styles.cellFooter}>
            <span className={`text-[9px] ${overloaded ? "font-bold text-red-700" : "text-slate-500"}`}>{cellBlocks.length ? `Σ ${hours.toLocaleString("fr-BE")}/${machine.capacityHours} h${overloaded ? " ⚠" : ""}` : ""}</span>
            {canCreate ? <button type="button" className={styles.cellAdd} aria-label={`Ajouter sur ${machine.id} le ${day.dateLabel}`} onClick={() => onAdd(machine.id, day.date)}>+</button> : null}
          </div>
        </div>
      </td>;
    })}
    <td className={styles.chargeColumn}><strong className={loadColor}>{load} %</strong><span className="block text-[10px] text-slate-500">{periodHours.toLocaleString("fr-BE")}/{capacity} h</span></td>
  </tr>;
}
