import { erpError, erpJson } from "@/features/erp-import/server/erp-api-response";
import { getErpPlanningRows } from "@/features/erp-import/server/erp-planning-service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const sort = params.get("sort");
    return erpJson(await getErpPlanningRows({
      search: params.get("search") ?? undefined,
      machine: params.get("machine") ?? undefined,
      status: params.get("status") ?? undefined,
      late: params.get("late") ?? undefined,
      page: numberParam(params.get("page")),
      pageSize: numberParam(params.get("pageSize")),
      sort: sort === "due-date" || sort === "work-order" || sort === "machine" || sort === "client" || sort === "article" || sort === "priority" ? sort : undefined,
      validMachineIds: params.get("validMachines")?.split(",").filter((value) => /^[a-zA-Z0-9_-]{1,100}$/.test(value)).slice(0, 200),
      articleMultiplicity: params.get("articleMultiplicity") === "multiple" || params.get("articleMultiplicity") === "unique" ? params.get("articleMultiplicity") as "multiple" | "unique" : undefined,
      includeWorkOrderDetails: params.get("include") === "work-order-details",
      includeInactive: params.get("scope") === "workbench",
    }));
  } catch (error) { return erpError(error); }
}

function numberParam(value: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}
