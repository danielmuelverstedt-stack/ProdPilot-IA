import { getActiveMailContext } from "@/features/mail/services/mail-account-context";
import { apiJson } from "@/features/mail/server/mail-api-response";

export const runtime = "nodejs";

export async function GET() {
  const { account, provider } = await getActiveMailContext();
  const status = await provider.getConnectionStatus();
  return apiJson({
    account: {
      ...account,
      status: status.state,
      connectedAt: status.connectedAt,
      lastSuccessfulSyncAt: status.lastSuccessfulSyncAt ?? account.lastSuccessfulSyncAt,
      error: status.error ?? null,
    },
  });
}
