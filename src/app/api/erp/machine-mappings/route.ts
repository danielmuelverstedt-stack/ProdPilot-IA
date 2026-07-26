import { erpError, erpJson, isTrustedErpMutation } from "@/features/erp-import/server/erp-api-response";
import { erpImportRepository } from "@/features/erp-import/server/erp-import-repository";
import { normalizeErpMachineCode } from "@/features/erp-import/services/erp-machine-code";

export const runtime = "nodejs";

export async function GET() {
  try { return erpJson({ mappings: Object.values(await erpImportRepository.readMappings()) }); }
  catch (error) { return erpError(error); }
}

export async function POST(request: Request) {
  if (!isTrustedErpMutation(request)) return erpJson({ message: "La correspondance machine n’est pas autorisée." }, 403);
  try {
    const body: unknown = await request.json();
    if (!isRecord(body) || typeof body.erpMachineCode !== "string" || typeof body.machineId !== "string") return erpJson({ message: "La correspondance machine est invalide." }, 400);
    const code = normalizeErpMachineCode(body.erpMachineCode);
    const machineId = body.machineId.trim();
    if (!code || code.length > 100 || !machineId || machineId.length > 100) return erpJson({ message: "La correspondance machine est invalide." }, 400);
    return erpJson({ mapping: await erpImportRepository.setMachineMapping(code, machineId) });
  } catch (error) { return erpError(error); }
}

export async function DELETE(request: Request) {
  if (!isTrustedErpMutation(request)) return erpJson({ message: "La suppression de la correspondance machine n’est pas autorisée." }, 403);
  try {
    const body: unknown = await request.json();
    if (!isRecord(body) || typeof body.erpMachineCode !== "string") return erpJson({ message: "La correspondance machine est invalide." }, 400);
    const code = normalizeErpMachineCode(body.erpMachineCode);
    if (!code || code.length > 100) return erpJson({ message: "La correspondance machine est invalide." }, 400);
    return erpJson({ removed: await erpImportRepository.deleteMachineMapping(code) });
  } catch (error) { return erpError(error); }
}

export async function PATCH(request: Request) {
  if (!isTrustedErpMutation(request)) return erpJson({ message: "La migration des correspondances machines n’est pas autorisée." }, 403);
  try {
    const body: unknown = await request.json();
    if (!isRecord(body) || body.completeLegacyMachineStateMigration !== true || !Array.isArray(body.machineIds) || !body.machineIds.every((id) => typeof id === "string" && id.length <= 100)) return erpJson({ message: "La migration demandée est invalide." }, 400);
    return erpJson({ migrated: await erpImportRepository.completeLegacyMachineStateMigration(body.machineIds as string[]) });
  } catch (error) { return erpError(error); }
}

function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
