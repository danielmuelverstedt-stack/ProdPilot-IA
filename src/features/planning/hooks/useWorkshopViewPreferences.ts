"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { browserWorkshopViewRepository } from "@/features/planning/repositories/browser-workshop-view-repository";
import { clampColumnWidth, createDefaultWorkshopViewState, moveWorkshopColumn, nextSortState, resetWorkshopView } from "@/features/planning/services/workshop-view-preferences";
import type { WorkshopColumnId, WorkshopFilterState, WorkshopPreferenceContext, WorkshopRowsPerMachine, WorkshopSortColumn, WorkshopViewState } from "@/features/planning/types/workshop-view";

export function useWorkshopViewPreferences(context: WorkshopPreferenceContext) {
  const contextKey = `${context.companyId}:${context.siteId}:${context.userId}`;
  const storageContext = useMemo(() => ({ companyId: context.companyId, siteId: context.siteId, userId: context.userId }), [context.companyId, context.siteId, context.userId]);
  const [state, setState] = useState<WorkshopViewState>(createDefaultWorkshopViewState);
  const [loadedContextKey, setLoadedContextKey] = useState<string | null>(null);
  const [persistenceError, setPersistenceError] = useState<string | null>(null);
  const isReady = loadedContextKey === contextKey;

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      if (!active) return;
      setPersistenceError(null);
      void browserWorkshopViewRepository.load(storageContext).then((loaded) => {
        if (active) setState(loaded);
      }).catch((error: unknown) => {
        if (active) setPersistenceError(error instanceof Error ? error.message : "Les préférences de l’Atelier sont indisponibles.");
      }).finally(() => {
        if (active) setLoadedContextKey(contextKey);
      });
    }, 0);
    return () => { active = false; window.clearTimeout(timer); };
  }, [contextKey, storageContext]);

  useEffect(() => {
    if (!isReady) return;
    const timer = window.setTimeout(() => {
      void browserWorkshopViewRepository.save(storageContext, state).then(() => setPersistenceError(null)).catch((error: unknown) => {
        setPersistenceError(error instanceof Error ? error.message : "Les préférences de l’Atelier n’ont pas été enregistrées.");
      });
    }, 400);
    return () => window.clearTimeout(timer);
  }, [contextKey, isReady, state, storageContext]);

  const toggleColumn = useCallback((columnId: WorkshopColumnId) => {
    setState((current) => ({ ...current, columns: current.columns.map((column) => column.id === columnId ? { ...column, visible: !column.visible } : column) }));
  }, []);

  const toggleMachineCollapsed = useCallback((machineId: string) => {
    setState((current) => ({
      ...current,
      collapsedMachineIds: current.collapsedMachineIds.includes(machineId) ? current.collapsedMachineIds.filter((id) => id !== machineId) : [...current.collapsedMachineIds, machineId],
    }));
  }, []);

  const updateFilters = useCallback((update: (filters: WorkshopFilterState) => WorkshopFilterState) => {
    setState((current) => ({ ...current, filters: update(current.filters) }));
  }, []);

  const reorderColumns = useCallback((sourceId: WorkshopColumnId, targetId: WorkshopColumnId) => {
    setState((current) => ({ ...current, columns: moveWorkshopColumn(current.columns, sourceId, targetId) }));
  }, []);

  const resizeColumn = useCallback((columnId: WorkshopColumnId, width: number) => {
    setState((current) => ({ ...current, columnWidths: { ...current.columnWidths, [columnId]: clampColumnWidth(width) } }));
  }, []);

  const setRowsPerMachine = useCallback((rowsPerMachine: WorkshopRowsPerMachine) => {
    setState((current) => ({ ...current, rowsPerMachine }));
  }, []);

  const cycleSort = useCallback((column: WorkshopSortColumn) => {
    setState((current) => ({ ...current, sort: nextSortState(current.sort, column) }));
  }, []);

  const resetView = useCallback(() => setState(resetWorkshopView), []);

  const selectDepartment = useCallback((departmentId: string) => {
    setState((current) => ({ ...current, selectedDepartmentId: departmentId }));
  }, []);

  return { state, isReady, persistenceError, toggleColumn, toggleMachineCollapsed, updateFilters, reorderColumns, resizeColumn, setRowsPerMachine, cycleSort, resetView, selectDepartment };
}
