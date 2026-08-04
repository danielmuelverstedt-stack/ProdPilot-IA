"use client";

import { useMemo } from "react";
import { EmptyState } from "@/components/ui/ModuleUi";
import { ColumnSortButton } from "@/components/ui/SortableColumnHeader";
import { ActionRow, getActionSortValue } from "@/features/actions/components/ActionRow";
import { groupActions, type ActionGroupMode } from "@/features/actions/services/action-grouping";
import type { ProductionAction, TeamMember } from "@/features/demo/types/demo";
import type { ActionColumnSettings, ActionOriginSettings } from "@/features/settings/types/settings";
import { sortRows } from "@/lib/table-columns";
import { useTableColumns } from "@/lib/use-table-columns";

export function ActionGroupedList({ actions, mode, columns, origins, people, variant = "current" }: {
  actions: ProductionAction[];
  mode: ActionGroupMode;
  columns: ActionColumnSettings[];
  origins: ActionOriginSettings[];
  people: TeamMember[];
  variant?: "current" | "backlog";
}) {
  const groups = useMemo(() => groupActions(actions, mode), [actions, mode]);
  const visibleColumns = useMemo(() => [...columns].filter((column) => column.visible).sort((a, b) => a.order - b.order), [columns]);
  // Tri au clic uniquement (pas de glisser-déposer de colonnes ici) : l'ordre/la visibilité des colonnes restent pilotés par Réglages → Actions.
  const { sort, cycleSort } = useTableColumns<string>("actions-list", columns.map((column) => column.id));

  if (!groups.length) return variant === "backlog"
    ? <EmptyState title="Aucune idée en attente" description="Ajoutez une idée ou une tâche d'amélioration pour ne pas l'oublier — elle rejoindra les actions une fois planifiée." />
    : <EmptyState title="Aucune action" description="Aucune action ne correspond aux filtres sélectionnés." />;

  return <div className="mt-5 space-y-6">{groups.map((group) => {
    const sortedItems = sortRows(group.items, sort, (action, columnId) => getActionSortValue(action, columnId, origins));
    return <section key={group.key}>
      <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">{group.label} <span className="font-normal text-slate-400">({group.items.length})</span></h2>
      <div className="overflow-x-auto rounded-2xl border border-[var(--app-border)] bg-white shadow-sm">
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead className="border-b border-[var(--app-border)] bg-slate-50 text-xs uppercase text-slate-500">
            <tr>{visibleColumns.map((column) => <th key={column.id} className="p-3">{column.label}<ColumnSortButton id={column.id} sort={sort} onSort={cycleSort} /></th>)}<th className="p-3">Actions rapides</th></tr>
          </thead>
          <tbody>{sortedItems.map((action) => <ActionRow key={action.id} action={action} columns={visibleColumns} origins={origins} people={people} variant={variant} />)}</tbody>
        </table>
      </div>
    </section>;
  })}</div>;
}
