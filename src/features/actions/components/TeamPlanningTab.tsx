"use client";

import { useMemo, useState } from "react";
import { useSettings } from "@/features/settings/components/SettingsProvider";
import { TeamCapacityGrid } from "@/features/actions/components/TeamCapacityGrid";
import { TeamManagementDialog } from "@/features/actions/components/TeamManagementDialog";
import { UnscheduledActionsPanel } from "@/features/actions/components/UnscheduledActionsPanel";
import { enumerateIsoWeeks, isoWeekKey } from "@/features/actions/services/iso-week";
import type { ProductionAction, TeamMember } from "@/features/demo/types/demo";

const WEEK_COUNT = 12;

/**
 * Onglet « Planification équipe » : assemble le panneau « Non planifiées » et la grille
 * personnes × semaines/mois, avec un état de glisser-déposer partagé (une carte glissée depuis la
 * grille doit pouvoir être déposée sur le panneau, et inversement) — mêmes seuils/couleurs de
 * charge que Planning capacité (Réglages → Production → Planning), jamais de valeur réinventée.
 */
export function TeamPlanningTab({ actions, people }: { actions: ProductionAction[]; people: TeamMember[] }) {
  const { settings } = useSettings();
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [managingTeam, setManagingTeam] = useState(false);
  const weeks = useMemo(() => enumerateIsoWeeks(isoWeekKey(new Date()), WEEK_COUNT), []);
  const loadColors = { normal: settings.theme.success, warning: settings.theme.warning, critical: settings.theme.danger };

  return <div className="mt-4 space-y-4">
    <UnscheduledActionsPanel
      actions={actions}
      people={people}
      weeks={weeks}
      draggedId={draggedId}
      onDragStart={setDraggedId}
      onDragEnd={() => setDraggedId(null)}
    />
    <TeamCapacityGrid
      actions={actions}
      people={people}
      weeks={weeks}
      draggedId={draggedId}
      onDragStart={setDraggedId}
      onDragEnd={() => setDraggedId(null)}
      loadWarningPercent={settings.production.planning.loadWarningPercent}
      loadCriticalPercent={settings.production.planning.loadCriticalPercent}
      loadColors={loadColors}
      onEditTeam={() => setManagingTeam(true)}
    />
    {managingTeam ? <TeamManagementDialog people={people} onClose={() => setManagingTeam(false)} /> : null}
  </div>;
}
