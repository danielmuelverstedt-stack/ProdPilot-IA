export interface ColumnSortState<ColumnId extends string> {
  column: ColumnId | null;
  direction: "asc" | "desc";
}

export function defaultColumnSort<ColumnId extends string>(): ColumnSortState<ColumnId> {
  return { column: null, direction: "desc" };
}

/**
 * Clic sur l'en-tête d'une colonne triable : décroissant → croissant → aucun tri, une seule
 * colonne active à la fois (comme un tableur) — cliquer une autre colonne bascule dessus.
 */
export function cycleColumnSort<ColumnId extends string>(current: ColumnSortState<ColumnId>, column: ColumnId): ColumnSortState<ColumnId> {
  if (current.column !== column) return { column, direction: "desc" };
  if (current.direction === "desc") return { column, direction: "asc" };
  return defaultColumnSort();
}

/** Déplace une colonne juste avant/à la place d'une autre, par simple retrait/réinsertion — même logique de glisser-déposer que toute la colonne d'origine. */
export function moveColumnId<ColumnId extends string>(order: readonly ColumnId[], sourceId: ColumnId, targetId: ColumnId): ColumnId[] {
  const sourceIndex = order.indexOf(sourceId);
  const targetIndex = order.indexOf(targetId);
  if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) return [...order];
  const next = [...order];
  const [source] = next.splice(sourceIndex, 1);
  next.splice(targetIndex, 0, source);
  return next;
}

/**
 * Tri générique null-safe : les valeurs `null`/`undefined` coulent toujours en bas, quelle que
 * soit la direction. Comparaison numérique si les deux valeurs sont des `number`, sinon texte
 * en locale française (accents, nombres inclus dans le texte triés naturellement).
 */
export function sortRows<Row, ColumnId extends string>(rows: Row[], sort: ColumnSortState<ColumnId>, getValue: (row: Row, column: ColumnId) => string | number | null | undefined): Row[] {
  if (!sort.column) return rows;
  const column = sort.column;
  const factor = sort.direction === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    const valueA = getValue(a, column);
    const valueB = getValue(b, column);
    if (valueA == null && valueB == null) return 0;
    if (valueA == null) return 1;
    if (valueB == null) return -1;
    if (typeof valueA === "number" && typeof valueB === "number") return factor * (valueA - valueB);
    return factor * String(valueA).localeCompare(String(valueB), "fr", { numeric: true });
  });
}
