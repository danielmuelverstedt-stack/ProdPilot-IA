import Link from "next/link";
import { StatusPill } from "@/components/ui/ModuleUi";
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
  const isBlocked = block.isBlocked || block.source === "task";
  const title = block.source === "work-order"
    ? `${block.order.id} — ${block.order.customer} — ${block.order.article} — ${block.operation.description} — ${block.durationHours} h — ${block.comments || "Sans commentaire"}`
    : block.source === "erp-operation"
      ? `${block.operationView.workOrderId} — ${block.operationView.workOrder?.customerName ?? "Client inconnu"} — ${block.operationView.articleCode} — ${block.operationView.description ?? "Sans description"} — Temps non disponible — ${block.comments || "Sans commentaire"}`
      : `${block.label} — ${block.durationHours} h — ${block.responsible || "Sans responsable"}`;
  const canMove = canEdit && (block.source === "work-order" || block.source === "erp-operation");
  return <div
    className={styles.block}
    style={block.source === "erp-operation"
      ? { background: "#ffffff", borderColor: "#cbd5e1", color: "#0f172a", cursor: isBlocked ? "not-allowed" : undefined }
      : { background: block.display.color, borderColor: block.display.color, color: block.display.textColor, cursor: isBlocked ? "not-allowed" : undefined }}
    draggable={canEdit && !isBlocked}
    onDragStart={(event) => { event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", block.id); onDragStart(); }}
    onDragEnd={onDragEnd}
    title={title}
  >
    {block.priority?.highlight ? <i className={styles.priority} style={{ background: block.priority.color }} title={`${block.priority.label}`} /> : null}
    {block.source === "work-order" ? <>
      <Link href={`/of/${block.order.id}`} className="font-bold underline-offset-2 hover:underline" onClick={(event) => event.stopPropagation()}>{block.order.id.replace("OF-", "")}{block.hasMatchingArticle ? " ⧉" : ""}</Link>
      <span className="block truncate">OP{block.operation.number} {block.operation.description}</span>
      <span className="block truncate opacity-80">{block.durationHours.toLocaleString("fr-BE")} h · {block.order.customer}</span>
    </> : block.source === "erp-operation" ? <>
      <span className="flex items-center gap-1 font-bold">{block.operationView.workOrderId}<StatusPill tone={block.display.tone}>{block.display.label}</StatusPill></span>
      <span className="block truncate">{block.operationView.articleCode || "Article inconnu"} · {block.operationView.description || "Sans description"}</span>
      <span className="block truncate opacity-80" title="Le temps de fabrication n’est pas encore disponible dans les données ERP importées">Temps non disponible · {block.operationView.workOrder?.customerName || "Client inconnu"}</span>
    </> : <>
      <strong>🔧 {block.taskType.label}</strong>
      <span className="block truncate">{block.label}</span>
      <span className="block truncate opacity-80">{block.durationHours.toLocaleString("fr-BE")} h{block.responsible ? ` · ${block.responsible}` : ""}</span>
    </>}
    {canEdit && block.source === "work-order" ? <div className={styles.blockControls}>
      <button type="button" className={styles.blockControl} disabled={!canMoveUp} aria-label={`Remonter ${block.order.id}`} onClick={(event) => { event.stopPropagation(); onMoveUp(); }}>↑</button>
      <button type="button" className={styles.blockControl} disabled={!canMoveDown} aria-label={`Descendre ${block.order.id}`} onClick={(event) => { event.stopPropagation(); onMoveDown(); }}>↓</button>
      <button type="button" className={styles.blockControl} disabled={isBlocked} aria-label={`Déplacer ${block.order.id}`} onClick={(event) => { event.stopPropagation(); onMove(); }}>↗</button>
    </div> : null}
    {canMove && block.source === "erp-operation" ? <div className={styles.blockControls}>
      <button type="button" className={styles.blockControl} disabled={isBlocked} aria-label={`Déplacer ${block.operationView.workOrderId}`} onClick={(event) => { event.stopPropagation(); onMove(); }}>↗</button>
    </div> : null}
  </div>;
}
