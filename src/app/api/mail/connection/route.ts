import { getActiveMailContext } from "@/features/mail/services/mail-account-context";
import { apiJson } from "@/features/mail/server/mail-api-response";

export const runtime = "nodejs";

export async function GET() {
  const { account } = await getActiveMailContext();
  return apiJson({ account });
}
