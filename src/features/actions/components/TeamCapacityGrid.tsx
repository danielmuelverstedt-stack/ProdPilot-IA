"use client";

import { useMemo, useState } from "react";
import { fieldClass } from "@/components/ui/ModuleUi";
import { MoveActionMenu } from "@/features/actions/components/MoveActionMenu";
import styles from "@/features/actions/components/TeamPlanning.module.css";
import { TeamCapacityCard } from "@/features/actions/components/TeamCapacityCard";
import { enumerateIsoMonths, isoMonthLabel, isoWeekDateRangeLabel, isoWeekLabel } from "@/features/actions/services/iso-week";
import { assignAction, buildTeamPlanningIndex, cellKey, loadPercent, moveToMonth, previewCellHours, reorderWithinCell, unassignAction, updateTeamMember, weeksInMonth, type TeamPlanningIndex } from "@/features/actions/services/team-planning-service";
import type { ProductionAction, TeamMember } from "@/features/demo/types/demo";

type PeriodMode = "week" | "month";
type LoadColors = { normal: string; warning: string; critical: string };

/**
 * Grille personnes × semaines/mois — même gabarit visuel que PlanningGrid/MachinePlanningRow
 * (Planning capacité), CSS module propre à Actions. Index construit une seule fois par rendu
 * (`buildTeamPlanningIndex`, mémoïsé) : les cases dérivent leurs totaux de l'index, aucun
 * refiltrage de la liste complète des actions à chaque case.
 */
export function TeamCapacityGrid({ actions, people, weeks, draggedId, onDragStart, onDragEnd, loadWarningPercent, loadCriticalPercent, loadColors, onEditTeam }: {
  actions: ProductionAction[];
  people: TeamMember[];
  weeks: string[];
  draggedId: string | null;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  loadWarningPercent: number;
  loadCriticalPercent: number;
  loadColors: LoadColors;
  onEditTeam: () => void;
}) {
  const [mode, setMode] = useState<PeriodMode>("week");
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const months = useMemo(() => enumerateIsoMonths(weeks), [weeks]);
  const periods = mode === "week" ? weeks : months;
  const index = useMemo(() => buildTeamPlanningIndex(actions), [actions]);
  const sortedPeople = useMemo(() => [...people].sort((a, b) => a.order - b.order), [people]);
  const draggedAction = draggedId ? actions.find((item) => item.id === draggedId) ?? null : null;

  function handleDrop(personId: string, period: string) {
    if (!draggedId) return;
    if (mode === "week") assignAction(draggedId, personId, period);
    else moveToMonth(draggedId, personId, period);
    onDragEnd();
    setDragOverKey(null);
  }

  /** Dépose une carte au-dessus d'une autre (même case) : réordonne ; case différente : assigne puis insère à la position visée. */
  function handleDropOnCard(personId: string, weekKey: string, targetActionId: string) {
    if (!draggedId || draggedId === targetActionId) return;
    if (mode !== "week") { handleDrop(personId, weekKey); return; }
    const sameCell = draggedAction?.responsableId === personId && draggedAction?.plannedWeek === weekKey;
    if (!sameCell) assignAction(draggedId, personId, weekKey);
    const currentIds = (index.actionsByCell.get(cellKey(personId, weekKey)) ?? []).map((item) => item.id).filter((id) => id !== draggedId);
    const targetIndex = currentIds.indexOf(targetActionId);
    const ordered = targetIndex < 0 ? [...currentIds, draggedId] : [...currentIds.slice(0, targetIndex), draggedId, ...currentIds.slice(targetIndex)];
    reorderWithinCell(personId, weekKey, ordered);
    onDragEnd();
    setDragOverKey(null);
  }

  return <div className={styles.planningCard}>
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--app-border)] p-3">
      <div className="flex gap-2">
        <button type="button" onClick={() => setMode("week")} className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${mode === "week" ? "border-[color-mix(in_srgb,var(--app-primary)_45%,transparent)] bg-[color-mix(in_srgb,var(--app-primary)_10%,white)] text-[var(--app-primary)]" : "border-[var(--app-border)] bg-white text-slate-600 hover:bg-slate-50"}`}>Semaine</button>
        <button type="button" onClick={() => setMode("month")} className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${mode === "month" ? "border-[color-mix(in_srgb,var(--app-primary)_45%,transparent)] bg-[color-mix(in_srgb,var(--app-primary)_10%,white)] text-[var(--app-primary)]" : "border-[var(--app-border)] bg-white text-slate-600 hover:bg-slate-50"}`}>Mois</button>
      </div>
      <button type="button" className="text-xs font-semibold text-[var(--app-primary)] hover:underline" onClick={onEditTeam}>Gérer l’équipe</button>
    </div>
    {!sortedPeople.length ? <p className="p-4 text-sm text-slate-500">Aucune personne dans l’équipe — cliquez « Gérer l’équipe » pour en ajouter une.</p> : <div className={styles.gridScroller}>
      <table className={styles.grid}>
        <thead>
          <tr>
            <th className={`${styles.personColumn} p-3 align-bottom`}>Personne</th>
            {periods.map((period) => <th key={period} className={styles.periodHeader} title={mode === "week" ? isoWeekDateRangeLabel(period) : undefined}>{mode === "week" ? isoWeekLabel(period) : isoMonthLabel(period)}</th>)}
          </tr>
        </thead>
        <tbody>
          {sortedPeople.map((person) => <PersonRow
            key={person.id}
            person={person}
            periods={periods}
            mode={mode}
            index={index}
            draggedId={draggedId}
            draggedAction={draggedAction}
            dragOverKey={dragOverKey}
            openMenuId={openMenuId}
            people={sortedPeople}
            weeks={weeks}
            loadWarningPercent={loadWarningPercent}
            loadCriticalPercent={loadCriticalPercent}
            loadColors={loadColors}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onDragOverKey={setDragOverKey}
            onDrop={handleDrop}
            onDropOnCard={handleDropOnCard}
            onOpenMenu={setOpenMenuId}
            onEditCapacity={(hours) => updateTeamMember(person.id, { weeklyCapacityHours: hours })}
          />)}
          <TotalRow periods={periods} mode={mode} people={sortedPeople} index={index} loadWarningPercent={loadWarningPercent} loadCriticalPercent={loadCriticalPercent} loadColors={loadColors} />
        </tbody>
      </table>
    </div>}
  </div>;
}

function PersonRow({ person, periods, mode, index, draggedId, draggedAction, dragOverKey, openMenuId, people, weeks, loadWarningPercent, loadCriticalPercent, loadColors, onDragStart, onDragEnd, onDragOverKey, onDrop, onDropOnCard, onOpenMenu, onEditCapacity }: {
  person: TeamMember;
  periods: string[];
  mode: PeriodMode;
  index: TeamPlanningIndex;
  draggedId: string | null;
  draggedAction: ProductionAction | null;
  dragOverKey: string | null;
  openMenuId: string | null;
  people: TeamMember[];
  weeks: string[];
  loadWarningPercent: number;
  loadCriticalPercent: number;
  loadColors: LoadColors;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onDragOverKey: (key: string) => void;
  onDrop: (personId: string, period: string) => void;
  onDropOnCard: (personId: string, weekKey: string, targetActionId: string) => void;
  onOpenMenu: (id: string | null) => void;
  onEditCapacity: (hours: number) => void;
}) {
  return <tr>
    <td className={`${styles.personColumn} p-3 align-top`}>
      <strong className="block truncate">{person.name}</strong>
      <label className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
        <input
          key={person.weeklyCapacityHours}
          type="number" min="0" step="0.5"
          className={`${fieldClass} h-7 w-16 py-0 text-xs`}
          defaultValue={person.weeklyCapacityHours}
          onBlur={(event) => {
            const value = Number(event.target.value);
            if (Number.isFinite(value) && value >= 0 && value !== person.weeklyCapacityHours) onEditCapacity(value);
          }}
        />h/sem.
      </label>
    </td>
    {periods.map((period) => {
      const capacity = mode === "week" ? person.weeklyCapacityHours : person.weeklyCapacityHours * weeksInMonth(period).length;
      const cellActions = mode === "week"
        ? index.actionsByCell.get(cellKey(person.id, period)) ?? []
        : weeksInMonth(period).flatMap((week) => index.actionsByCell.get(cellKey(person.id, week)) ?? []);
      const baseHours = mode === "week" ? index.hoursByCell.get(cellKey(person.id, period)) ?? 0 : weeksInMonth(period).reduce((sum, week) => sum + (index.hoursByCell.get(cellKey(person.id, week)) ?? 0), 0);
      const key = `${person.id}:${period}`;
      const previewing = mode === "week" && draggedAction && dragOverKey === key;
      const hours = previewing ? previewCellHours(index, person.id, period, draggedAction!) : baseHours;
      const pct = loadPercent(hours, capacity);
      const color = pct >= loadCriticalPercent ? loadColors.critical : pct >= loadWarningPercent ? loadColors.warning : loadColors.normal;
      return <td key={period} className={styles.cell}>
        <div
          className={`${styles.cellInner} ${dragOverKey === key ? styles.dragOver : ""}`}
          onDragOver={(event) => { if (!draggedId) return; event.preventDefault(); onDragOverKey(key); }}
          onDragLeave={() => onDragOverKey("")}
          onDrop={(event) => { event.preventDefault(); onDrop(person.id, period); }}
        >
          {cellActions.map((action) => <div
            key={action.id}
            className="relative"
            onDragOver={(event) => { if (!draggedId) return; event.preventDefault(); event.stopPropagation(); onDragOverKey(key); }}
            onDrop={(event) => { event.preventDefault(); event.stopPropagation(); onDropOnCard(person.id, mode === "week" ? (action.plannedWeek ?? period) : period, action.id); }}
          >
            <TeamCapacityCard
              action={action}
              onDragStart={() => onDragStart(action.id)}
              onDragEnd={onDragEnd}
              onClick={() => onOpenMenu(openMenuId === action.id ? null : action.id)}
            />
            {openMenuId === action.id ? <MoveActionMenu
              action={action}
              people={people}
              weeks={weeks}
              onMove={(personId, weekKey) => assignAction(action.id, personId, weekKey)}
              onUnassign={() => unassignAction(action.id)}
              onClose={() => onOpenMenu(null)}
            /> : null}
          </div>)}
          <span className="mt-auto text-[9px] font-semibold" style={{ color }}>{hours.toLocaleString("fr-BE")}/{capacity.toLocaleString("fr-BE")} h · {pct} %</span>
        </div>
      </td>;
    })}
  </tr>;
}

function TotalRow({ periods, mode, people, index, loadWarningPercent, loadCriticalPercent, loadColors }: {
  periods: string[];
  mode: PeriodMode;
  people: TeamMember[];
  index: TeamPlanningIndex;
  loadWarningPercent: number;
  loadCriticalPercent: number;
  loadColors: LoadColors;
}) {
  return <tr className={styles.totalRow}>
    <td className={`${styles.personColumn} p-3`}>Total équipe</td>
    {periods.map((period) => {
      const relevantWeeks = mode === "week" ? [period] : weeksInMonth(period);
      const hours = people.reduce((sum, person) => sum + relevantWeeks.reduce((weekSum, week) => weekSum + (index.hoursByCell.get(cellKey(person.id, week)) ?? 0), 0), 0);
      const capacity = people.reduce((sum, person) => sum + person.weeklyCapacityHours * relevantWeeks.length, 0);
      const pct = loadPercent(hours, capacity);
      const color = pct >= loadCriticalPercent ? loadColors.critical : pct >= loadWarningPercent ? loadColors.warning : loadColors.normal;
      return <td key={period} className={`${styles.cell} text-center`}><strong style={{ color }}>{pct} %</strong><span className="block text-[10px] text-slate-500">{hours.toLocaleString("fr-BE")}/{capacity.toLocaleString("fr-BE")} h</span></td>;
    })}
  </tr>;
}
