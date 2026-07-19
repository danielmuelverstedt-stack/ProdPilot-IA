import { erpError, erpJson, isTrustedErpMutation } from "@/features/erp-import/server/erp-api-response";
import { importErpFiles } from "@/features/erp-import/server/erp-import-service";
import { getErpPlanningOverview } from "@/features/erp-import/server/erp-planning-service";

export const runtime = "nodejs";

export async function GET() {
  try { return erpJson(await getErpPlanningOverview()); }
  catch (error) { return erpError(error); }
}

export async function POST(request: Request) {
  if (!isTrustedErpMutation(request)) return erpJson({ message: "La requête d’import ERP n’est pas autorisée." }, 403);
  try {
    const formData = await request.formData();
    const files = formData.getAll("files").filter((entry): entry is File => entry instanceof File);
    return erpJson({ import: await importErpFiles(files) }, 201);
  } catch (error) { return erpError(error); }
}
