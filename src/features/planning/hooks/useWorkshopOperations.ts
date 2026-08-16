"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createErpPlanningDataBusSourceId, notifyErpPlanningDataChanged, subscribeErpPlanningDataChange } from "@/features/erp-import/services/erp-planning-data-bus";
import { reconcileOperationViewMachineCatalog } from "@/features/erp-import/services/erp-machine-mapping-status";
import { applyTaskCategoryVisibility } from "@/features/erp-import/services/task-category-visibility";
import { applyOperationPatchLocally } from "@/features/erp-import/services/operation-view-local-patch";
import { fetchErpPlanningRows, invalidateErpPlanningRowsCache } from "@/features/erp-import/services/erp-planning-rows-fetch-cache";
import type { OperationView } from "@/features/erp-import/types/erp-import";
import type { MachineSettings } from "@/features/settings/types/settings";

const REORDER_PRIORITY_BASE = 999;

/**
 * Charge une fois les OperationView du Planning (même source que le Cockpit ERP,
 * /api/erp/planning) et conserve le résultat tant que le composant reste monté : changer
 * d'onglet dans le Workspace Planning ne doit pas redéclencher cet appel réseau. La
 * réconciliation avec le référentiel machine reste, elle, recalculée localement si les
 * réglages machine changent, sans nouvel appel réseau.
 *
 * Le Cockpit ERP et l'Atelier lisent et modifient la même source ; ils se notifient
 * mutuellement via erp-planning-data-bus après toute mutation réussie afin de rester
 * cohérents. Chaque instance ignore ses propres notifications pour ne pas se recharger deux
 * fois après sa propre mutation.
 *
 * Les mutations unitaires (priorité, machine, placement) n'entraînent plus de rechargement
 * complet des ~23 000 opérations : le changement est appliqué localement à la seule ligne
 * concernée (`applyOperationPatchLocally`, réutilisée par le Cockpit ERP), le PATCH réel part
 * en arrière-plan, et seule une erreur restaure la valeur précédente. Cela évite de figer tout
 * l'écran (toutes les lignes étaient désactivées pendant le rechargement) pour un seul champ
 * modifié.
 *
 * `rows` (filtrées par catégories visibles) sert au contenu affiché ; `allRows` (réconciliées,
 * toutes catégories confondues) sert à tout calcul qui doit rester exact indépendamment de la
 * catégorie actuellement affichée — notamment les compteurs par onglet de département de
 * l'Atelier, qui sinon retombaient à 0 pour chaque département autre que celui sélectionné.
 */
export function useWorkshopOperations(machines: MachineSettings[], visibleTaskCategoryCodes: string[]) {
  const [rawRows, setRawRows] = useState<OperationView[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);
  const sourceId = useRef(createErpPlanningDataBusSourceId());
  // Séparé de `rows` : la réconciliation avec le référentiel machine ne dépend que des données chargées et des réglages
  // machine (rare), pas de la catégorie actuellement affichée (change à chaque clic d'onglet dans l'Atelier) — la
  // recalculer à chaque changement de catégorie faisait tourner un `.map` sur ~23 000 lignes pour rien à chaque clic.
  const allRows = useMemo(() => reconcileOperationViewMachineCatalog(rawRows, machines), [rawRows, machines]);
  const rows = useMemo(() => applyTaskCategoryVisibility(allRows, visibleTaskCategoryCodes), [allRows, visibleTaskCategoryCodes]);

  const load = useCallback(async () => {
    const currentRequestId = ++requestId.current;
    setIsLoading(true);
    setError(null);
    try {
      const nextRows = await fetchErpPlanningRows();
      if (currentRequestId === requestId.current) setRawRows(nextRows);
    } catch (nextError) {
      if (currentRequestId === requestId.current) setError(nextError instanceof Error ? nextError.message : "Le Planning Atelier est indisponible.");
    } finally {
      if (currentRequestId === requestId.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => { if (active) void load(); }, 0);
    return () => { active = false; window.clearTimeout(timer); };
  }, [load]);

  useEffect(() => subscribeErpPlanningDataChange((changedSourceId) => { if (changedSourceId !== sourceId.current) void load(); }), [load]);

  const patchOperationRemote = useCallback(async (operationId: string, patch: Record<string, unknown>, errorMessage: string): Promise<void> => {
    const response = await fetch(`/api/erp/operations/${encodeURIComponent(operationId)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
    const payload: unknown = await response.json();
    if (!response.ok) throw new Error(apiMessage(payload) || errorMessage);
  }, []);

  /** Patch optimiste d'une seule ligne : ne bloque que cette ligne, jamais tout l'écran. */
  const patchOneOptimistically = useCallback(async (operationId: string, patch: Parameters<typeof applyOperationPatchLocally>[1], errorMessage: string) => {
    let previous: OperationView | undefined;
    setRawRows((current) => current.map((row) => {
      if (row.id !== operationId) return row;
      previous = row;
      return applyOperationPatchLocally(row, patch);
    }));
    setError(null);
    try {
      await patchOperationRemote(operationId, patch as Record<string, unknown>, errorMessage);
      invalidateErpPlanningRowsCache();
      notifyErpPlanningDataChanged(sourceId.current);
    } catch (nextError) {
      if (previous) { const restored = previous; setRawRows((current) => current.map((row) => row.id === operationId ? restored : row)); }
      setError(nextError instanceof Error ? nextError.message : errorMessage);
    }
  }, [patchOperationRemote]);

  const updatePriority = useCallback(async (operationId: string, priority: number) => {
    await patchOneOptimistically(operationId, { priority }, "La priorité n’a pas pu être modifiée.");
  }, [patchOneOptimistically]);

  const updateMachine = useCallback(async (operationId: string, machineId: string | null) => {
    await patchOneOptimistically(operationId, { machineId }, "La machine n’a pas pu être modifiée.");
  }, [patchOneOptimistically]);

  const updateStatus = useCallback(async (operationId: string, status: OperationView["status"]) => {
    await patchOneOptimistically(operationId, { status }, "Le statut n’a pas pu être modifié.");
  }, [patchOneOptimistically]);

  const updateDuration = useCallback(async (operationId: string, plannedDurationHours: number) => {
    await patchOneOptimistically(operationId, { plannedDurationHours }, "Le temps prévu n’a pas pu être modifié.");
  }, [patchOneOptimistically]);

  /** Déplacement jour + machine en une seule écriture (Planning capacité : glisser un OF ERP vers une autre case). */
  const updatePlacement = useCallback(async (operationId: string, placement: { machineId: string; plannedDate: string }) => {
    await patchOneOptimistically(operationId, placement, "Le déplacement n’a pas pu être enregistré.");
  }, [patchOneOptimistically]);

  /**
   * Patch optimiste groupé : applique toutes les priorités concernées en une seule fois
   * (`rows.map`, pas une boucle qui réécrit l'état à chaque itération), envoie les PATCH en
   * parallèle (les lignes sont indépendantes, pas besoin de les sérialiser), et ne restaure que
   * les lignes dont l'écriture a réellement échoué.
   */
  const patchManyOptimistically = useCallback(async (entries: Array<{ id: string; priority: number }>, errorMessage: string) => {
    if (!entries.length) return;
    const entryById = new Map(entries.map((entry) => [entry.id, entry]));
    const previousById = new Map<string, OperationView>();
    setRawRows((current) => current.map((row) => {
      const entry = entryById.get(row.id);
      if (!entry) return row;
      previousById.set(row.id, row);
      return applyOperationPatchLocally(row, { priority: entry.priority });
    }));
    setIsMutating(true);
    setError(null);
    const results = await Promise.allSettled(entries.map((entry) => patchOperationRemote(entry.id, { priority: entry.priority }, errorMessage)));
    const failedIds = entries.filter((_, index) => results[index].status === "rejected").map((entry) => entry.id);
    if (failedIds.length) {
      setRawRows((current) => current.map((row) => failedIds.includes(row.id) ? (previousById.get(row.id) ?? row) : row));
      setError(errorMessage);
    } else {
      invalidateErpPlanningRowsCache();
      notifyErpPlanningDataChanged(sourceId.current);
    }
    setIsMutating(false);
  }, [patchOperationRemote]);

  /**
   * Traduit un nouvel ordre visuel (glisser-déposer, du plus prioritaire au moins prioritaire)
   * en priorités numériques strictement décroissantes, puis n'écrit que celles qui changent
   * réellement — la priorité reste le seul champ de classement lu ailleurs (Cockpit ERP,
   * tri par défaut), aucun champ parallèle n'est introduit.
   */
  const reorderOperations = useCallback(async (orderedOperationIds: string[]) => {
    const currentPriority = new Map(rows.map((row) => [row.id, row.effectivePriority]));
    const changed = orderedOperationIds
      .map((id, index) => ({ id, priority: Math.max(0, REORDER_PRIORITY_BASE - index) }))
      .filter((entry) => currentPriority.get(entry.id) !== entry.priority);
    await patchManyOptimistically(changed, "L’ordre n’a pas pu être enregistré.");
  }, [rows, patchManyOptimistically]);

  /**
   * Renuméro une machine « à plat » : réattribue 1, 2, 3… jusqu'à la dernière opération selon
   * l'ordre actuellement affiché (recherche, tri et filtres compris) — contrairement au
   * glisser-déposer (`reorderOperations`), qui garde des priorités décroissantes depuis 999
   * pour ne bouger que l'opération déplacée, le bouton Renuméroter doit produire une suite
   * lisible qui commence à 1, comme demandé explicitement.
   */
  const renumberOperations = useCallback(async (orderedOperationIds: string[]) => {
    const currentPriority = new Map(rows.map((row) => [row.id, row.effectivePriority]));
    const changed = orderedOperationIds
      .map((id, index) => ({ id, priority: index + 1 }))
      .filter((entry) => currentPriority.get(entry.id) !== entry.priority);
    await patchManyOptimistically(changed, "La renumérotation n’a pas pu être enregistrée.");
  }, [rows, patchManyOptimistically]);

  return { rows, allRows, isLoading, isMutating, error, refresh: load, updatePriority, updateMachine, updateStatus, updateDuration, updatePlacement, reorderOperations, renumberOperations };
}

function apiMessage(payload: unknown): string {
  return isRecord(payload) && typeof payload.message === "string" ? payload.message : "Le serveur a retourné une réponse inattendue.";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
