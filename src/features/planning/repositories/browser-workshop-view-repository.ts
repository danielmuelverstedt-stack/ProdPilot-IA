import "client-only";

import { parseWorkshopViewState } from "@/features/planning/services/workshop-view-preferences";
import type { WorkshopPreferenceContext, WorkshopViewState } from "@/features/planning/types/workshop-view";

export interface WorkshopViewRepository {
  load(context: WorkshopPreferenceContext): Promise<WorkshopViewState>;
  save(context: WorkshopPreferenceContext, state: WorkshopViewState): Promise<void>;
}

const STORAGE_PREFIX = "prodpilot.planning-workshop-view.v1";

class BrowserWorkshopViewRepository implements WorkshopViewRepository {
  async load(context: WorkshopPreferenceContext): Promise<WorkshopViewState> {
    try {
      const raw = window.localStorage.getItem(storageKey(context));
      return parseWorkshopViewState(raw ? JSON.parse(raw) as unknown : null);
    } catch {
      throw new Error("Les préférences du Planning Atelier n’ont pas pu être chargées.");
    }
  }

  async save(context: WorkshopPreferenceContext, state: WorkshopViewState): Promise<void> {
    try {
      window.localStorage.setItem(storageKey(context), JSON.stringify(state));
    } catch {
      throw new Error("Les préférences du Planning Atelier n’ont pas pu être enregistrées.");
    }
  }
}

function storageKey(context: WorkshopPreferenceContext): string {
  return [STORAGE_PREFIX, context.companyId, context.siteId, context.userId].map(encodeURIComponent).join(":");
}

export const browserWorkshopViewRepository: WorkshopViewRepository = new BrowserWorkshopViewRepository();
