import type { ErpPlanningQueryResult, OperationView } from "../types/erp-import.ts";

let cachedRows: OperationView[] | null = null;
let pendingFetch: Promise<OperationView[]> | null = null;

/**
 * Partage le fetch de `/api/erp/planning?scope=workbench&pageSize=50000` (≈17 Mo) entre
 * l'Atelier/Capacité/OF (`useWorkshopOperations`) et le Cockpit ERP (`ErpPlanningWorkspace`),
 * qui le redemandaient jusqu'ici chacun de leur côté dès que les deux vues étaient visitées
 * dans la même session (le Workspace Planning garde ses trois onglets montés une fois visités).
 * Chaque appelant garde ensuite sa propre copie en état React pour ses mutations optimistes
 * propres ; seul le réseau/parsing JSON est partagé, pas l'état affiché.
 */
export async function fetchErpPlanningRows(options: { force?: boolean } = {}): Promise<OperationView[]> {
  if (cachedRows && !options.force) return cachedRows;
  if (pendingFetch && !options.force) return pendingFetch;
  pendingFetch = (async () => {
    const response = await fetch("/api/erp/planning?scope=workbench&pageSize=50000", { cache: "no-store" });
    const payload: unknown = await response.json();
    if (!response.ok) throw new Error(apiMessage(payload));
    const rows = (payload as ErpPlanningQueryResult).rows;
    cachedRows = rows;
    return rows;
  })();
  try {
    return await pendingFetch;
  } finally {
    pendingFetch = null;
  }
}

/** À appeler après toute mutation réussie (édition, import, correspondance machine) : le prochain fetch partagé ira au réseau plutôt que de servir une copie périmée. */
export function invalidateErpPlanningRowsCache(): void {
  cachedRows = null;
}

function apiMessage(payload: unknown): string {
  return isRecord(payload) && typeof payload.message === "string" ? payload.message : "Le serveur a retourné une réponse inattendue.";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
