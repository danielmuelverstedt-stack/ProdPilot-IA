"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { browserErpPlanningViewRepository } from "@/features/erp-import/repositories/browser-erp-planning-view-repository";
import { createDefaultErpPlanningViewState, resetErpPlanningView } from "@/features/erp-import/services/erp-planning-view-preferences";
import { ERP_PLANNING_VIEW_VERSION, type ErpPlanningPreferenceContext, type ErpPlanningSavedView, type ErpPlanningViewState } from "@/features/erp-import/types/erp-planning-view";

export function useErpPlanningViews(context: ErpPlanningPreferenceContext) {
  const contextKey = `${context.companyId}:${context.siteId}:${context.userId}`;
  const storageContext = useMemo(() => ({ companyId: context.companyId, siteId: context.siteId, userId: context.userId }), [context.companyId, context.siteId, context.userId]);
  const [state, setState] = useState<ErpPlanningViewState>(createDefaultErpPlanningViewState);
  const [loadedContextKey, setLoadedContextKey] = useState<string | null>(null);
  const [persistenceError, setPersistenceError] = useState<string | null>(null);
  const isReady = loadedContextKey === contextKey;

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      if (!active) return;
      setPersistenceError(null);
      void browserErpPlanningViewRepository.load(storageContext).then((loaded) => {
        if (active) setState(loaded);
      }).catch((error: unknown) => {
        if (active) setPersistenceError(error instanceof Error ? error.message : "Les vues personnelles sont indisponibles.");
      }).finally(() => {
        if (active) setLoadedContextKey(contextKey);
      });
    }, 0);
    return () => { active = false; window.clearTimeout(timer); };
  }, [contextKey, storageContext]);

  useEffect(() => {
    if (!isReady) return;
    const timer = window.setTimeout(() => {
      void browserErpPlanningViewRepository.save(storageContext, state).then(() => setPersistenceError(null)).catch((error: unknown) => {
        setPersistenceError(error instanceof Error ? error.message : "La vue personnelle n’a pas été enregistrée.");
      });
    }, 400);
    return () => window.clearTimeout(timer);
  }, [contextKey, isReady, state, storageContext]);

  const activeView = useMemo(() => state.views.find((view) => view.id === state.activeViewId) ?? state.views[0], [state]);

  const updateActiveView = useCallback((update: (view: ErpPlanningSavedView) => ErpPlanningSavedView) => {
    setState((current) => ({
      ...current,
      views: current.views.map((view) => view.id === current.activeViewId ? { ...update(view), updatedAt: new Date().toISOString() } : view),
    }));
  }, []);

  const selectView = useCallback((viewId: string) => {
    setState((current) => current.views.some((view) => view.id === viewId) ? { ...current, activeViewId: viewId } : current);
  }, []);

  const saveAs = useCallback((name: string) => {
    const trimmed = name.trim().slice(0, 80);
    if (!trimmed) return;
    setState((current) => {
      const source = current.views.find((view) => view.id === current.activeViewId) ?? current.views[0];
      const id = createViewId();
      const next = { ...structuredClone(source), id, name: trimmed, updatedAt: new Date().toISOString() };
      return { version: ERP_PLANNING_VIEW_VERSION, activeViewId: id, views: [...current.views, next] };
    });
  }, []);

  const renameActive = useCallback((name: string) => {
    const trimmed = name.trim().slice(0, 80);
    if (trimmed) updateActiveView((view) => ({ ...view, name: trimmed }));
  }, [updateActiveView]);

  const deleteActive = useCallback(() => {
    setState((current) => {
      if (current.views.length <= 1) return current;
      const views = current.views.filter((view) => view.id !== current.activeViewId);
      return { ...current, activeViewId: views[0].id, views };
    });
  }, []);

  const resetActive = useCallback(() => updateActiveView(resetErpPlanningView), [updateActiveView]);

  return { state, activeView, isReady, persistenceError, updateActiveView, selectView, saveAs, renameActive, deleteActive, resetActive };
}

function createViewId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `view-${Date.now()}`;
}
