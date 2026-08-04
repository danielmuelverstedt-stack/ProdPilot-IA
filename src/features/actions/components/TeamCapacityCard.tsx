import styles from "@/features/actions/components/TeamPlanning.module.css";
import type { ProductionAction } from "@/features/demo/types/demo";

const PRIORITY_COLORS: Record<NonNullable<ProductionAction["priority"]>, string> = {
  Basse: "#94a3b8",
  Normale: "#3b82f6",
  Haute: "#f59e0b",
  Urgente: "#f97316",
  Bloquante: "#dc2626",
};

/** Carte d'action déplaçable de la planification équipe — même gabarit que PlanningCard.tsx (Planning capacité), glisser-déposer HTML5 natif. */
export function TeamCapacityCard({ action, draggable = true, onDragStart, onDragEnd, onClick }: {
  action: ProductionAction;
  draggable?: boolean;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onClick?: () => void;
}) {
  const isDone = action.statut === "Fait";
  const title = `${action.id} — ${action.description} — ${action.estimatedHours ?? "?"} h${action.remarque ? ` — ${action.remarque}` : ""}`;
  return <button
    type="button"
    className={`${styles.block} ${isDone ? styles.blockDone : ""}`}
    draggable={draggable && !isDone}
    onDragStart={(event) => { event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", action.id); onDragStart?.(); }}
    onDragEnd={onDragEnd}
    onClick={onClick}
    title={title}
  >
    {action.priority ? <i className={styles.priority} style={{ background: PRIORITY_COLORS[action.priority] }} title={action.priority} /> : null}
    <strong className="truncate">{action.id}</strong>
    <span className="block truncate">{action.description}</span>
    <span className="block truncate opacity-80">{action.estimatedHours != null ? `${action.estimatedHours.toLocaleString("fr-BE")} h` : "Charge ?"}{isDone ? " · Terminée" : ""}</span>
  </button>;
}
