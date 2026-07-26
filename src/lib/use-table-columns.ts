import "client-only";

import { useEffect, useState } from "react";
import { type ColumnSortState, cycleColumnSort, defaultColumnSort, moveColumnId } from "@/lib/table-columns";

const STORAGE_PREFIX = "prodpilot.table-columns.v1";

interface StoredTableColumnsState<ColumnId extends string> {
  order: ColumnId[];
  sort: ColumnSortState<ColumnId>;
}

export interface UseTableColumnsResult<ColumnId extends string> {
  order: ColumnId[];
  sort: ColumnSortState<ColumnId>;
  moveColumn: (sourceId: ColumnId, targetId: ColumnId) => void;
  cycleSort: (column: ColumnId) => void;
}

/**
 * Préférence d'affichage locale (ordre des colonnes + tri actif) pour un tableau de données,
 * persistée en localStorage. Volontairement plus léger que les préférences de vue de l'Atelier
 * (pas de portée companyId/siteId/userId) : ce sont de simples préférences d'affichage, pas de
 * raison de complexifier avant qu'un vrai besoin multi-utilisateur ne se présente.
 */
export function useTableColumns<ColumnId extends string>(storageKey: string, columnIds: readonly ColumnId[]): UseTableColumnsResult<ColumnId> {
  const [state, setState] = useState<StoredTableColumnsState<ColumnId>>(() => loadState(storageKey, columnIds));

  useEffect(() => {
    try {
      window.localStorage.setItem(fullKey(storageKey), JSON.stringify(state));
    } catch {
      // Préférence locale non bloquante : une écriture en échec (quota, navigation privée…) ne doit jamais interrompre l'utilisateur.
    }
  }, [storageKey, state]);

  function moveColumn(sourceId: ColumnId, targetId: ColumnId) {
    setState((current) => ({ ...current, order: moveColumnId(current.order, sourceId, targetId) }));
  }

  function cycleSort(column: ColumnId) {
    setState((current) => ({ ...current, sort: cycleColumnSort(current.sort, column) }));
  }

  return { order: state.order, sort: state.sort, moveColumn, cycleSort };
}

function fullKey(storageKey: string): string {
  return `${STORAGE_PREFIX}:${storageKey}`;
}

function loadState<ColumnId extends string>(storageKey: string, columnIds: readonly ColumnId[]): StoredTableColumnsState<ColumnId> {
  const fallback: StoredTableColumnsState<ColumnId> = { order: [...columnIds], sort: defaultColumnSort() };
  try {
    const raw = window.localStorage.getItem(fullKey(storageKey));
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as unknown;
    return parseState(parsed, columnIds) ?? fallback;
  } catch {
    return fallback;
  }
}

function parseState<ColumnId extends string>(value: unknown, columnIds: readonly ColumnId[]): StoredTableColumnsState<ColumnId> | null {
  if (!isRecord(value)) return null;
  const known = new Set<string>(columnIds);
  const storedOrder = Array.isArray(value.order) ? value.order.filter((id): id is ColumnId => typeof id === "string" && known.has(id)) : [];
  const order = [...new Set(storedOrder)];
  columnIds.forEach((id) => { if (!order.includes(id)) order.push(id); });
  const sort = isRecord(value.sort) && isSortColumnOrNull(value.sort.column, known) && isSortDirection(value.sort.direction)
    ? { column: value.sort.column as ColumnId | null, direction: value.sort.direction }
    : defaultColumnSort<ColumnId>();
  return { order, sort };
}

function isSortColumnOrNull(value: unknown, known: Set<string>): boolean {
  return value === null || (typeof value === "string" && known.has(value));
}

function isSortDirection(value: unknown): value is "asc" | "desc" {
  return value === "asc" || value === "desc";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
