"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StatusPill } from "@/components/ui/ModuleUi";
import { useMachinePhotos } from "@/features/machines/services/machine-photo-store";
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
const ROW_HEIGHT_PX = 24;
const HEADER_HEIGHT_PX = 20;
const ACTIONS_COLUMN_WIDTH_PX = 148;

/** Largeur par défaut de chaque colonne tant qu'elle n'a pas été redimensionnée à la souris. */
const DEFAULT_COLUMN_WIDTH_PX: Record<WorkshopColumnId, number> = {
  priority: 50,
  "work-order": 64,
  operation: 90,
  article: 130,
  client: 105,
  quantity: 56,
  description: 130,
  time: 65,
  status: 75,
  "start-date": 64,
  "end-date": 64,
  delay: 75,
  machine: 130,
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
  onUpdateMachine: (operationId: string, machineId: string | null) => void;
  onUpdateStatus: (operationId: string, status: OperationView["status"]) => void;
  onUpdateDuration: (operationId: string, plannedDurationHours: number) => void;
  onReorderOperations: (orderedOperationIds: string[]) => void;
  onRenumberOperations: (orderedOperationIds: string[]) => void;
  onMoveColumn: (sourceId: WorkshopColumnId, targetId: WorkshopColumnId) => void;
  onResizeColumn: (columnId: WorkshopColumnId, width: number) => void;
  onCycleSort: (column: WorkshopSortColumn) => void;
  onPrint: (machine: MachineSettings | null, operations: OperationView[], totalOperationCount: number) => void;
}

export function WorkshopMachinePanel({ group, visibleColumnIds, isCollapsed, rowsPerMachine, sort, machines, capacities, defaultCapacityHours, columnWidths, busy, isDirectlyLinked, onToggleCollapsed, onUpdatePriority, onUpdateMachine, onUpdateStatus, onUpdateDuration, onReorderOperations, onRenumberOperations, onMoveColumn, onResizeColumn, onCycleSort, onPrint }: WorkshopMachinePanelProps) {
  const { machine, operations, operationCount, workOrderCount } = group;
  const photos = useMachinePhotos();
  const machinePhoto = machine ? photos[machine.id] : undefined;
  const plannedLoadHours = useMemo(() => operations.reduce((total, operation) => total + operation.plannedDurationHours, 0), [operations]);
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
  const [isPhotoOpen, setIsPhotoOpen] = useState(false);
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

  return <section className="overflow-hidden rounded-lg border border-[var(--app-border)] bg-white">
    <div className="flex w-full items-center gap-2 border-b border-slate-100 bg-slate-50 p-1.5">
      {machinePhoto ? <button
        type="button"
        className="relative h-14 w-20 shrink-0 overflow-hidden rounded-md border border-slate-200 bg-white bg-contain bg-center bg-no-repeat transition hover:border-[var(--app-primary)] sm:h-16 sm:w-24"
        style={{ backgroundImage: `url(${machinePhoto})` }}
        aria-label={`Agrandir la photo de la machine ${machine?.displayName}`}
        title="Cliquer pour agrandir la photo"
        onClick={() => setIsPhotoOpen(true)}
      ><span className="absolute bottom-1 right-1 rounded bg-slate-950/65 px-1 py-0.5 text-[9px] font-semibold text-white">⌕</span></button> : null}
      <button type="button" aria-expanded={!isCollapsed} onClick={() => onToggleCollapsed(panelKey)} className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-0.5 text-left">
        <span aria-hidden="true" className="text-[10px] text-slate-400">{isCollapsed ? "▶" : "▼"}</span>
        <span className="text-sm font-bold text-slate-900">{machine?.displayName ?? "Machine non définie"}</span>
        {machine ? <MachineStatusIcon machine={machine} /> : null}
        {isDirectlyLinked ? <StatusPill tone="info">Machine liée directement</StatusPill> : null}
        <span className="text-[10px] text-slate-500">{operationCount.toLocaleString("fr-BE")} opération(s) · {workOrderCount.toLocaleString("fr-BE")} OF</span>
        {todaysCapacity !== null ? <span className="text-[10px] text-slate-500">Capacité aujourd’hui : {todaysCapacity.toLocaleString("fr-BE")} h</span> : null}
        <span className="text-[10px] font-semibold text-slate-600">Charge : {plannedLoadHours.toLocaleString("fr-BE")} h</span>
      </button>
      <button
        type="button"
        className="relative z-10 shrink-0 rounded-md border border-[var(--app-border)] bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={busy || operations.length < 2}
        title="Réattribue la priorité de 1 à la dernière opération de cette machine selon l’ordre actuellement affiché (recherche, tri et filtres compris), du haut vers le bas."
        onClick={handleRenumber}
      >
        Renuméroter
      </button>
      <button
        type="button"
        className="relative z-10 shrink-0 rounded-md border border-[var(--app-border)] bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={!operations.length}
        title="Imprimer une fiche pour cette machine, avec le nombre de lignes de votre choix."
        onClick={() => setIsPrintDialogOpen(true)}
      >
        Imprimer
      </button>
    </div>
    {isPhotoOpen && machinePhoto ? <div role="dialog" aria-modal="true" aria-label={`Photo de la machine ${machine?.displayName}`} className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 p-4" onClick={() => setIsPhotoOpen(false)}>
      <button type="button" className="absolute right-4 top-4 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-slate-900" onClick={() => setIsPhotoOpen(false)}>Fermer</button>
      <div className="h-full max-h-[90vh] w-full max-w-6xl bg-contain bg-center bg-no-repeat" style={{ backgroundImage: `url(${machinePhoto})` }} />
    </div> : null}
    {isPrintDialogOpen ? <WorkshopMachinePrintDialog machineLabel={machine?.displayName ?? "Machine non définie"} totalOperationCount={operations.length} onConfirm={handlePrintConfirm} onClose={() => setIsPrintDialogOpen(false)} /> : null}
    {!isCollapsed ? (operations.length ? <div className="border-t border-[var(--app-border)] p-1">
      {/* `height` (fixe) et non `maxHeight` : sinon une machine avec moins d'opérations que le
          réglage « Lignes par machine » affiche un cadre plus court que ses voisines — but signalé
          par l'utilisateur (« tous les planning n'ont pas la même taille »). */}
      <div className="overflow-auto rounded-md border border-slate-200" style={{ height: frameMaxHeight }} onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}>
        <table className="w-full min-w-[560px] table-fixed text-left">
          <colgroup>
            {visibleColumnIds.map((columnId) => <col key={columnId} ref={(element) => { if (element) colRefs.current[columnId] = element; }} style={{ width: `${columnWidths[columnId] ?? DEFAULT_COLUMN_WIDTH_PX[columnId]}px` }} />)}
            <col style={{ width: `${ACTIONS_COLUMN_WIDTH_PX}px` }} />
          </colgroup>
          <thead className="sticky top-0 z-10 bg-slate-50 text-[9px] uppercase text-slate-500">
            <tr>
              {visibleColumnIds.map((columnId) => <th
                key={columnId}
                draggable
                onDragStart={(event) => event.dataTransfer.setData(COLUMN_DRAG_MIME_TYPE, columnId)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => { const source = event.dataTransfer.getData(COLUMN_DRAG_MIME_TYPE) as WorkshopColumnId; if (source) onMoveColumn(source, columnId); }}
                className="relative overflow-hidden p-1"
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
              <th className="p-1 text-right">Actions</th>
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
              onUpdateStatus={onUpdateStatus}
              onUpdateDuration={onUpdateDuration}
              onReorder={handleReorder}
            />)}
            {bottomSpacerPx > 0 ? <tr aria-hidden="true" style={{ height: bottomSpacerPx }}><td colSpan={visibleColumnIds.length + 1} /></tr> : null}
          </tbody>
        </table>
      </div>
      <p className="mt-1 text-[10px] text-slate-500">Glissez une ligne sur une autre pour la réordonner : la priorité s’ajuste automatiquement. Cliquez ⇅ sur l’en-tête Priorité ou Retard pour trier. Glissez le bord droit d’une colonne pour l’élargir.</p>
    </div> : <p className="px-2 py-3 text-[11px] text-slate-500">Aucune opération affectée à cette machine.</p>) : null}
  </section>;
}

function MachineStatusIcon({ machine }: { machine: NonNullable<WorkshopMachineGroup["machine"]> }) {
  if (!machine.active) return <StatusPill tone="neutral">Inactive</StatusPill>;
  if (!machine.visible) return <StatusPill tone="warning">Masquée</StatusPill>;
  return <StatusPill tone="success">Active</StatusPill>;
}
