"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StatusPill } from "@/components/ui/ModuleUi";
import { resolveCapacity } from "@/features/planning/services/planning-view";
import { clampColumnWidth } from "@/features/planning/services/workshop-view-preferences";
import { computeVirtualRowRange } from "@/features/planning/services/virtual-rows";
import { reorderOperationIds } from "@/features/planning/services/workshop-view-service";
import { WorkshopMachinePrintDialog } from "@/features/planning/components/WorkshopMachinePrintDialog";
import { WorkshopOperationRow } from "@/features/planning/components/WorkshopOperationRow";
import type { OperationView } from "@/features/erp-import/types/erp-import";
import type { CapacitySettings, MachineSettings } from "@/features/settings/types/settings";
import { SORTABLE_COLUMN_IDS, type WorkshopColumnId, type WorkshopMachineGroup, type WorkshopRowsPerMachine, type WorkshopSortColumn, type WorkshopSortState } from "@/features/planning/types/workshop-view";
import { WORKSHOP_COLUMN_LABELS } from "@/features/planning/services/workshop-view-preferences";

const COLUMN_DRAG_MIME_TYPE = "application/x-prodpilot-workshop-column";
const ROW_HEIGHT_PX = 52;
const HEADER_HEIGHT_PX = 40;
const ACTIONS_COLUMN_WIDTH_PX = 220;

/** Largeur par défaut de chaque colonne tant qu'elle n'a pas été redimensionnée à la souris. */
const DEFAULT_COLUMN_WIDTH_PX: Record<WorkshopColumnId, number> = {
  priority: 90,
  "work-order": 110,
  operation: 150,
  article: 220,
  client: 180,
  quantity: 100,
  description: 220,
  time: 110,
  status: 130,
  "start-date": 110,
  "end-date": 110,
  delay: 130,
  machine: 220,
};

const SORTABLE_COLUMNS = new Set<string>(SORTABLE_COLUMN_IDS);

function sortIcon(sort: WorkshopSortState, column: WorkshopSortColumn): string {
  if (sort.column !== column) return "⇅";
  return sort.direction === "desc" ? "▼" : "▲";
}

function sortTitle(sort: WorkshopSortState, column: WorkshopSortColumn): string {
  if (sort.column !== column) return "Trier par ordre décroissant";
  return sort.direction === "desc" ? "Trier par ordre croissant" : "Annuler le tri";
}

interface WorkshopMachinePanelProps {
  group: WorkshopMachineGroup;
  visibleColumnIds: WorkshopColumnId[];
  isCollapsed: boolean;
  rowsPerMachine: WorkshopRowsPerMachine;
  sort: WorkshopSortState;
  machines: MachineSettings[];
  capacities: CapacitySettings[];
  defaultCapacityHours: number;
  columnWidths: Partial<Record<WorkshopColumnId, number>>;
  busy: boolean;
  /** Rattachée individuellement au département actif (plutôt que via une catégorie) : affiche le badge « Machine liée directement ». */
  isDirectlyLinked?: boolean;
  onToggleCollapsed: (machineId: string) => void;
  onUpdatePriority: (operationId: string, priority: number) => void;
  onUpdateMachine: (operationId: string, machineId: string) => void;
  onReorderOperations: (orderedOperationIds: string[]) => void;
  onRenumberOperations: (orderedOperationIds: string[]) => void;
  onMoveColumn: (sourceId: WorkshopColumnId, targetId: WorkshopColumnId) => void;
  onResizeColumn: (columnId: WorkshopColumnId, width: number) => void;
  onCycleSort: (column: WorkshopSortColumn) => void;
  onPrint: (machine: MachineSettings | null, operations: OperationView[], totalOperationCount: number) => void;
}

export function WorkshopMachinePanel({ group, visibleColumnIds, isCollapsed, rowsPerMachine, sort, machines, capacities, defaultCapacityHours, columnWidths, busy, isDirectlyLinked, onToggleCollapsed, onUpdatePriority, onUpdateMachine, onReorderOperations, onRenumberOperations, onMoveColumn, onResizeColumn, onCycleSort, onPrint }: WorkshopMachinePanelProps) {
  const { machine, operations, operationCount, workOrderCount } = group;
  const panelKey = machine?.id ?? "unassigned";
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const todaysCapacity = machine ? resolveCapacity(machine.id, machine.departmentId, today, capacities, defaultCapacityHours) : null;
  const frameMaxHeight = rowsPerMachine === "all" ? undefined : HEADER_HEIGHT_PX + ROW_HEIGHT_PX * rowsPerMachine;
  const colRefs = useRef<Partial<Record<WorkshopColumnId, HTMLTableColElement>>>({});
  // `operations` est un tableau neuf à chaque rendu (regroupement/tri recalculés) même quand son
  // contenu ne change pas pour cette machine ; le lire via une ref garde `handleReorder`/
  // `handleRenumber` stables (identité inchangée), condition nécessaire pour que React.memo sur
  // WorkshopOperationRow ignore effectivement les lignes non affectées par une mutation.
  const operationsRef = useRef(operations);
  useEffect(() => { operationsRef.current = operations; }, [operations]);

  // Fenêtrage : seules les lignes proches de la position de défilement sont réellement montées
  // dans le DOM (le reste est représenté par deux lignes d'espacement de la bonne hauteur), sans
  // qu'aucune opération ne soit masquée — tout reste atteignable en faisant défiler le cadre.
  // Avant ce fenêtrage, une machine avec des centaines/milliers d'OF montait autant de <tr> d'un
  // coup à chaque changement d'onglet de département, ce qui pouvait figer l'écran plusieurs
  // secondes malgré un réglage « Lignes par machine » à 10.
  const [scrollTop, setScrollTop] = useState(0);
  const viewportHeightPx = frameMaxHeight !== undefined ? frameMaxHeight - HEADER_HEIGHT_PX : operations.length * ROW_HEIGHT_PX;
  const { startIndex, endIndex, topSpacerPx, bottomSpacerPx } = computeVirtualRowRange(scrollTop, viewportHeightPx, ROW_HEIGHT_PX, operations.length);
  const visibleOperations = operations.slice(startIndex, endIndex);

  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  // La fiche imprimable suit l'ordre/tri actuellement affiché (`operations`, pas `visibleOperations`
  // qui ne sert qu'au fenêtrage DOM) : le nombre de lignes est choisi dans la boîte de dialogue, pas
  // limité par ce qui est actuellement monté à l'écran.
  function handlePrintConfirm(lineCount: number | "all") {
    setIsPrintDialogOpen(false);
    onPrint(machine, lineCount === "all" ? operations : operations.slice(0, lineCount), operations.length);
  }

  function startResize(event: React.MouseEvent, columnId: WorkshopColumnId) {
    event.preventDefault();
    event.stopPropagation();
    const startWidth = columnWidths[columnId] ?? DEFAULT_COLUMN_WIDTH_PX[columnId];
    const startX = event.clientX;
    let nextWidth = startWidth;

    function handleMove(moveEvent: MouseEvent) {
      nextWidth = clampColumnWidth(startWidth + (moveEvent.clientX - startX));
      const col = colRefs.current[columnId];
      if (col) col.style.width = `${nextWidth}px`;
    }

    function handleUp() {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
      onResizeColumn(columnId, nextWidth);
    }

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
  }

  const handleReorder = useCallback((draggedOperationId: string, targetOperationId: string) => {
    onReorderOperations(reorderOperationIds(operationsRef.current.map((operation) => operation.id), draggedOperationId, targetOperationId));
  }, [onReorderOperations]);

  const handleRenumber = useCallback(() => {
    onRenumberOperations(operationsRef.current.map((operation) => operation.id));
  }, [onRenumberOperations]);

  return <section className="overflow-hidden rounded-2xl border border-[var(--app-border)] bg-white">
    <div className="flex w-full flex-wrap items-center gap-3 bg-slate-50 px-4 py-3">
      <button type="button" aria-expanded={!isCollapsed} onClick={() => onToggleCollapsed(panelKey)} className="flex flex-1 flex-wrap items-center gap-3 text-left">
        <span aria-hidden="true" className="text-slate-400">{isCollapsed ? "▶" : "▼"}</span>
        <span className="font-semibold">{machine?.displayName ?? "Machine non définie"}</span>
        {machine ? <MachineStatusIcon machine={machine} /> : null}
        {isDirectlyLinked ? <StatusPill tone="info">Machine liée directement</StatusPill> : null}
        <span className="text-xs text-slate-500">{operationCount.toLocaleString("fr-BE")} opération(s) · {workOrderCount.toLocaleString("fr-BE")} OF</span>
        {todaysCapacity !== null ? <span className="text-xs text-slate-500">Capacité aujourd’hui : {todaysCapacity.toLocaleString("fr-BE")} h</span> : null}
        <span className="text-xs italic text-slate-400" title="Le temps de fabrication n’est pas encore disponible dans les données ERP importées">Charge : non disponible</span>
      </button>
      <button
        type="button"
        className="shrink-0 rounded-lg border border-[var(--app-border)] bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={busy || operations.length < 2}
        title="Réattribue la priorité de 1 à la dernière opération de cette machine selon l’ordre actuellement affiché (recherche, tri et filtres compris), du haut vers le bas."
        onClick={handleRenumber}
      >
        Renuméroter
      </button>
      <button
        type="button"
        className="shrink-0 rounded-lg border border-[var(--app-border)] bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={!operations.length}
        title="Imprimer une fiche pour cette machine, avec le nombre de lignes de votre choix."
        onClick={() => setIsPrintDialogOpen(true)}
      >
        Imprimer
      </button>
    </div>
    {isPrintDialogOpen ? <WorkshopMachinePrintDialog machineLabel={machine?.displayName ?? "Machine non définie"} totalOperationCount={operations.length} onConfirm={handlePrintConfirm} onClose={() => setIsPrintDialogOpen(false)} /> : null}
    {!isCollapsed ? (operations.length ? <div className="border-t border-[var(--app-border)] p-3">
      <div className="overflow-auto rounded-xl border border-slate-200" style={{ maxHeight: frameMaxHeight }} onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}>
        <table className="w-full min-w-[760px] table-fixed text-left">
          <colgroup>
            {visibleColumnIds.map((columnId) => <col key={columnId} ref={(element) => { if (element) colRefs.current[columnId] = element; }} style={{ width: `${columnWidths[columnId] ?? DEFAULT_COLUMN_WIDTH_PX[columnId]}px` }} />)}
            <col style={{ width: `${ACTIONS_COLUMN_WIDTH_PX}px` }} />
          </colgroup>
          <thead className="sticky top-0 z-10 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              {visibleColumnIds.map((columnId) => <th
                key={columnId}
                draggable
                onDragStart={(event) => event.dataTransfer.setData(COLUMN_DRAG_MIME_TYPE, columnId)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => { const source = event.dataTransfer.getData(COLUMN_DRAG_MIME_TYPE) as WorkshopColumnId; if (source) onMoveColumn(source, columnId); }}
                className="relative overflow-hidden p-3"
              >
                <span className="cursor-grab select-none" title="Glisser pour déplacer la colonne">↔ {WORKSHOP_COLUMN_LABELS[columnId]}</span>
                {SORTABLE_COLUMNS.has(columnId) ? <button type="button" className="ml-1 text-slate-500 hover:text-slate-800" title={sortTitle(sort, columnId as WorkshopSortColumn)} onClick={() => onCycleSort(columnId as WorkshopSortColumn)}>{sortIcon(sort, columnId as WorkshopSortColumn)}</button> : null}
                <span
                  role="separator"
                  aria-orientation="vertical"
                  draggable={false}
                  className="absolute right-0 top-0 h-full w-2 cursor-col-resize select-none hover:bg-slate-300 active:bg-slate-400"
                  title="Glisser pour redimensionner la colonne"
                  onMouseDown={(event) => startResize(event, columnId)}
                  onDragStart={(event) => event.preventDefault()}
                />
              </th>)}
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {topSpacerPx > 0 ? <tr aria-hidden="true" style={{ height: topSpacerPx }}><td colSpan={visibleColumnIds.length + 1} /></tr> : null}
            {visibleOperations.map((operation) => <WorkshopOperationRow
              key={operation.id}
              operation={operation}
              visibleColumnIds={visibleColumnIds}
              machineId={machine?.id ?? null}
              machines={machines}
              busy={busy}
              onUpdatePriority={onUpdatePriority}
              onUpdateMachine={onUpdateMachine}
              onReorder={handleReorder}
            />)}
            {bottomSpacerPx > 0 ? <tr aria-hidden="true" style={{ height: bottomSpacerPx }}><td colSpan={visibleColumnIds.length + 1} /></tr> : null}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-slate-500">Glissez une ligne sur une autre pour la réordonner : la priorité s’ajuste automatiquement. Cliquez ⇅ sur l’en-tête Priorité ou Retard pour trier. Glissez le bord droit d’une colonne pour l’élargir.</p>
    </div> : <p className="px-4 py-6 text-sm text-slate-500">Aucune opération affectée à cette machine.</p>) : null}
  </section>;
}

function MachineStatusIcon({ machine }: { machine: NonNullable<WorkshopMachineGroup["machine"]> }) {
  if (!machine.active) return <StatusPill tone="neutral">Inactive</StatusPill>;
  if (!machine.visible) return <StatusPill tone="warning">Masquée</StatusPill>;
  return <StatusPill tone="success">Active</StatusPill>;
}
