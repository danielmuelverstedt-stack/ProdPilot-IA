import { getMailProvider } from "@/features/mail/providers/provider-factory";
import { apiJson } from "@/features/mail/server/mail-api-response";

export const runtime = "nodejs";

export async function GET() {
  const connection = await getMailProvider("google").getConnectionStatus();
  return apiJson({ connection });
}
