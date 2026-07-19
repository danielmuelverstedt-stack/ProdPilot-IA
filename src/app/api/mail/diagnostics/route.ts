import { getMailServerDiagnostics } from "@/features/mail-diagnostics/services/mail-server-diagnostics";
import { apiError, apiJson, getSafeMailError } from "@/features/mail/server/mail-api-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try { return apiJson(await getMailServerDiagnostics()); }
  catch (error) { const safe = getSafeMailError(error); return apiError(safe.message, safe.status, safe.code); }
}
