"use client";

import { useState } from "react";
import styles from "@/features/actions/components/TeamPlanning.module.css";
import { MoveActionMenu } from "@/features/actions/components/MoveActionMenu";
import { TeamCapacityCard } from "@/features/actions/components/TeamCapacityCard";
import { assignAction, unassignAction, unscheduledActions } from "@/features/actions/services/team-planning-service";
import type { ProductionAction, TeamMember } from "@/features/demo/types/demo";

/**
 * Panneau « Non planifiées » : actions avec responsable + charge mais sans semaine. Cible de drop
 * pour un glisser depuis la grille (retire la période, garde le responsable) et point d'entrée du
 * repli clic « Déplacer vers… » pour poser une première période sans drag & drop.
 */
export function UnscheduledActionsPanel({ actions, people, weeks, draggedId, onDragStart, onDragEnd }: {
  actions: ProductionAction[];
  people: TeamMember[];
  weeks: string[];
  draggedId: string | null;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
}) {
  const [dragOver, setDragOver] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const list = unscheduledActions(actions);

  return <div className={styles.planningCard}>
    <div className="flex items-center justify-between border-b border-[var(--app-border)] p-3">
      <h3 className="text-sm font-bold">Non planifiées</h3>
      <span className="text-xs text-slate-500">{list.length}</span>
    </div>
    <div
      className={`flex min-h-24 flex-wrap gap-2 p-3 ${dragOver ? styles.dragOver : ""}`}
      onDragOver={(event) => { if (!draggedId) return; event.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragOver(false);
        const id = event.dataTransfer.getData("text/plain");
        if (id) unassignAction(id);
      }}
    >
      {!list.length ? <p className="text-xs text-slate-400">Aucune action en attente de période — glissez une carte ici pour la retirer de son créneau.</p> : null}
      {list.map((action) => <div key={action.id} className="relative w-40">
        <TeamCapacityCard
          action={action}
          onDragStart={() => onDragStart(action.id)}
          onDragEnd={onDragEnd}
          onClick={() => setOpenMenuId((current) => current === action.id ? null : action.id)}
        />
        {openMenuId === action.id ? <MoveActionMenu
          action={action}
          people={people}
          weeks={weeks}
          onMove={(personId, weekKey) => assignAction(action.id, personId, weekKey)}
          onUnassign={() => unassignAction(action.id)}
          onClose={() => setOpenMenuId(null)}
        /> : null}
      </div>)}
    </div>
  </div>;
}
