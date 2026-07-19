import { getActiveMailContext } from "@/features/mail/services/mail-account-context";
import { apiError, apiJson, getSafeMailError } from "@/features/mail/server/mail-api-response";

export const runtime = "nodejs";

export async function GET() {
  try {
    const { account, provider } = await getActiveMailContext();
    const [status, managementPermission] = await Promise.all([
      provider.getConnectionStatus(),
      provider.getManagementPermission(),
    ]);
    return apiJson({
      account: { ...account, status: status.state, connectedAt: status.connectedAt, lastSuccessfulSyncAt: status.lastSuccessfulSyncAt ?? account.lastSuccessfulSyncAt, error: status.error ?? null },
      managementPermission,
    });
  } catch (error) {
    const safe = getSafeMailError(error);
    return apiError(safe.message, safe.status);
  }
}
