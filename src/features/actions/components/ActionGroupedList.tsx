"use client";

import { useMemo } from "react";
import { EmptyState } from "@/components/ui/ModuleUi";
import { ActionRow } from "@/features/actions/components/ActionRow";
import { groupActions, type ActionGroupMode } from "@/features/actions/services/action-grouping";
import type { ProductionAction } from "@/features/demo/types/demo";
import type { ActionColumnSettings, ActionOriginSettings } from "@/features/settings/types/settings";

export function ActionGroupedList({ actions, mode, columns, origins }: {
  actions: ProductionAction[];
  mode: ActionGroupMode;
  columns: ActionColumnSettings[];
  origins: ActionOriginSettings[];
}) {
  const groups = useMemo(() => groupActions(actions, mode), [actions, mode]);
  const visibleColumns = useMemo(() => [...columns].filter((column) => column.visible).sort((a, b) => a.order - b.order), [columns]);

  if (!groups.length) return <EmptyState title="Aucune action" description="Aucune action ne correspond aux filtres sélectionnés." />;

  return <div className="mt-5 space-y-6">{groups.map((group) => <section key={group.key}>
    <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">{group.label} <span className="font-normal text-slate-400">({group.items.length})</span></h2>
    <div className="overflow-x-auto rounded-2xl border border-[var(--app-border)] bg-white shadow-sm">
      <table className="w-full min-w-[960px] text-left text-sm">
        <thead className="border-b border-[var(--app-border)] bg-slate-50 text-xs uppercase text-slate-500">
          <tr>{visibleColumns.map((column) => <th key={column.id} className="p-3">{column.label}</th>)}<th className="p-3">Actions rapides</th></tr>
        </thead>
        <tbody>{group.items.map((action) => <ActionRow key={action.id} action={action} columns={visibleColumns} origins={origins} />)}</tbody>
      </table>
    </div>
  </section>)}</div>;
}
