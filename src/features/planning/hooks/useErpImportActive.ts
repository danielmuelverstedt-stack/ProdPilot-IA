"use client";

import { useEffect, useState } from "react";
import type { ErpPlanningOverview } from "@/features/erp-import/types/erp-import";

/**
 * Indique si un import ERP réel est actif, pour savoir si Planning capacité doit afficher les
 * OF de démonstration (aucun import) ou les opérations ERP réelles (import actif) — jamais les
 * deux mélangés. Lit /api/erp/imports en lecture seule, comme ErpPlanningWorkspace, sans le modifier.
 */
export function useErpImportActive() {
  const [hasActiveImport, setHasActiveImport] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      if (!active) return;
      void fetch("/api/erp/imports", { cache: "no-store" })
        .then((response) => response.json() as Promise<ErpPlanningOverview>)
        .then((overview) => { if (active) setHasActiveImport(Boolean(overview.activeImport)); })
        .catch(() => { if (active) setHasActiveImport(false); })
        .finally(() => { if (active) setIsLoading(false); });
    }, 0);
    return () => { active = false; window.clearTimeout(timer); };
  }, []);

  return { hasActiveImport, isLoading };
}
