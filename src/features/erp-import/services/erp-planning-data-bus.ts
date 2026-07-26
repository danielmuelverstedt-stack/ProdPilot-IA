import "client-only";

/**
 * Signal partagé, en mémoire navigateur, qu'une mutation a modifié la projection Planning ERP
 * (OperationView). Le Cockpit ERP et le Planning Atelier lisent la même source
 * (/api/erp/planning) mais la fetchent chacun séparément ; ce bus évite qu'une modification
 * faite dans une vue reste invisible dans l'autre tant qu'elle est montée.
 *
 * Chaque abonné identifie ses propres notifications par un identifiant source et les ignore,
 * pour ne recharger que lorsque la modification vient réellement d'une autre vue.
 */
type Listener = (sourceId: string) => void;

const listeners = new Set<Listener>();

export function subscribeErpPlanningDataChange(listener: Listener): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function notifyErpPlanningDataChanged(sourceId: string): void {
  listeners.forEach((listener) => listener(sourceId));
}

export function createErpPlanningDataBusSourceId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `source-${Date.now()}-${Math.random()}`;
}
