import { erpError, erpJson, isTrustedErpMutation } from "@/features/erp-import/server/erp-api-response";
import { erpImportRepository } from "@/features/erp-import/server/erp-import-repository";
import type { ErpManualOverride, ErpOperationStatus } from "@/features/erp-import/types/erp-import";

export const runtime = "nodejs";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!isTrustedErpMutation(request)) return erpJson({ message: "La modification Planning n’est pas autorisée." }, 403);
  try {
    const { id } = await context.params;
    const body: unknown = await request.json();
    if (!isRecord(body)) return erpJson({ message: "La modification Planning est invalide." }, 400);
    const projection = await erpImportRepository.readProjection();
    if (!projection.operations.some((operation) => operation.id === id)) return erpJson({ message: "L’opération ERP est introuvable." }, 404);
    const patch: Partial<Omit<ErpManualOverride, "operationId" | "updatedAt">> = {};
    if ("plannedDate" in body) patch.plannedDate = nullableDate(body.plannedDate);
    if ("machineId" in body) patch.machineId = nullableShortString(body.machineId, 100);
    if ("priority" in body) patch.priority = nullablePriority(body.priority);
    if ("status" in body) patch.status = nullableStatus(body.status);
    if ("comment" in body) patch.comment = nullableShortString(body.comment, 500);
    if (!Object.keys(patch).length) return erpJson({ message: "Aucun champ modifiable n’a été fourni." }, 400);
    return erpJson({ override: await erpImportRepository.setOverride(id, patch) });
  } catch (error) { return erpError(error); }
}

function nullableDate(value: unknown): string | null {
  if (value === null || value === "") return null;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(`${value}T00:00:00Z`))) throw new Error("La date planifiée est invalide.");
  return value;
}
function nullablePriority(value: unknown): number | null { if (value === null || value === "") return null; if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 999) throw new Error("La priorité doit être comprise entre 0 et 999."); return Math.round(value); }
function nullableStatus(value: unknown): ErpOperationStatus | null { if (value === null || value === "") return null; if (!["not-started", "in-progress", "completed", "blocked", "unknown"].includes(String(value))) throw new Error("Le statut Planning est invalide."); return value as ErpOperationStatus; }
function nullableShortString(value: unknown, max: number): string | null { if (value === null || value === "") return null; if (typeof value !== "string" || value.trim().length > max) throw new Error("La valeur Planning est invalide."); return value.trim(); }
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
