import "client-only";

import { parseErpPlanningViewState } from "@/features/erp-import/services/erp-planning-view-preferences";
import type { ErpPlanningPreferenceContext, ErpPlanningViewState } from "@/features/erp-import/types/erp-planning-view";

export interface ErpPlanningViewRepository {
  load(context: ErpPlanningPreferenceContext): Promise<ErpPlanningViewState>;
  save(context: ErpPlanningPreferenceContext, state: ErpPlanningViewState): Promise<void>;
}

const STORAGE_PREFIX = "prodpilot.erp-planning-views.v1";

class BrowserErpPlanningViewRepository implements ErpPlanningViewRepository {
  async load(context: ErpPlanningPreferenceContext): Promise<ErpPlanningViewState> {
    try {
      const raw = window.localStorage.getItem(storageKey(context));
      return parseErpPlanningViewState(raw ? JSON.parse(raw) as unknown : null);
    } catch {
      throw new Error("Les vues personnelles du Planning n’ont pas pu être chargées.");
    }
  }

  async save(context: ErpPlanningPreferenceContext, state: ErpPlanningViewState): Promise<void> {
    try {
      window.localStorage.setItem(storageKey(context), JSON.stringify(state));
    } catch {
      throw new Error("Les vues personnelles du Planning n’ont pas pu être enregistrées.");
    }
  }
}

function storageKey(context: ErpPlanningPreferenceContext): string {
  return [STORAGE_PREFIX, context.companyId, context.siteId, context.userId].map(encodeURIComponent).join(":");
}

export const browserErpPlanningViewRepository: ErpPlanningViewRepository = new BrowserErpPlanningViewRepository();
