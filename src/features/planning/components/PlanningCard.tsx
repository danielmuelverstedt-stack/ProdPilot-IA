import Link from "next/link";
import styles from "@/features/planning/components/Planning.module.css";
import type { PlanningBlock } from "@/features/planning/types/planning";

export function PlanningCard({ block, canEdit, canMoveUp, canMoveDown, onMove, onMoveUp, onMoveDown, onDragStart, onDragEnd }: {
  block: PlanningBlock;
  canEdit: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
}) {
  const isBlocked = block.status === "Bloquée" || block.source === "task";
  const title = block.source === "work-order"
    ? `${block.order.id} — ${block.order.customer} — ${block.order.article} — ${block.operation.description} — ${block.durationHours} h — ${block.comments || "Sans commentaire"}`
    : `${block.label} — ${block.durationHours} h — ${block.responsible || "Sans responsable"}`;
  return <div
    className={`${styles.block} ${statusClass(block.status)}`}
    draggable={canEdit && !isBlocked}
    onDragStart={(event) => { event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", block.id); onDragStart(); }}
    onDragEnd={onDragEnd}
    title={title}
  >
    {block.priority === "Urgente" || block.priority === "Bloquante" ? <i className={styles.priority} title={`Priorité ${block.priority}`} /> : null}
    {block.source === "work-order" ? <>
      <Link href={`/of/${block.order.id}`} className="font-bold underline-offset-2 hover:underline" onClick={(event) => event.stopPropagation()}>{block.order.id.replace("OF-", "")}{block.hasMatchingArticle ? " ⧉" : ""}</Link>
      <span className="block truncate">OP{block.operation.number} {block.operation.description}</span>
      <span className="block truncate opacity-80">{block.durationHours.toLocaleString("fr-BE")} h · {block.order.customer}</span>
    </> : <>
      <strong>🔧 {block.status}</strong>
      <span className="block truncate">{block.label}</span>
      <span className="block truncate opacity-80">{block.durationHours.toLocaleString("fr-BE")} h{block.responsible ? ` · ${block.responsible}` : ""}</span>
    </>}
    {canEdit && block.source === "work-order" ? <div className={styles.blockControls}>
      <button type="button" className={styles.blockControl} disabled={!canMoveUp} aria-label={`Remonter ${block.order.id}`} onClick={(event) => { event.stopPropagation(); onMoveUp(); }}>↑</button>
      <button type="button" className={styles.blockControl} disabled={!canMoveDown} aria-label={`Descendre ${block.order.id}`} onClick={(event) => { event.stopPropagation(); onMoveDown(); }}>↓</button>
      <button type="button" className={styles.blockControl} disabled={isBlocked} aria-label={`Déplacer ${block.order.id}`} onClick={(event) => { event.stopPropagation(); onMove(); }}>↗</button>
    </div> : null}
  </div>;
}

function statusClass(status: PlanningBlock["status"]): string {
  if (status === "En cours") return styles.ongoing;
  if (status === "Planifiée") return styles.planned;
  if (status === "Bloquée") return styles.blocked;
  if (status === "Maintenance") return styles.maintenance;
  if (status === "Divers") return styles.misc;
  return styles.unplanned;
}
