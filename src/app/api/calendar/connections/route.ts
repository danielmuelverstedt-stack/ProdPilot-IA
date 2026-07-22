import {
  activateCalendarAccount,
  addCalendarAccount,
  disconnectCalendarAccount,
  getCalendarAccounts,
  testCalendarAccount,
} from "@/features/calendar/services/calendar-connections";
import { apiError, apiJson, isTrustedSameOriginRequest } from "@/features/mail/server/mail-api-response";
import { isCalendarProviderType } from "@/features/calendar/types/calendar";

export const runtime = "nodejs";

type AccountAction = "add" | "activate" | "test" | "disconnect";

interface AccountRequestBody {
  action?: unknown;
  accountId?: unknown;
  provider?: unknown;
  emailAddress?: unknown;
  displayName?: unknown;
}

export async function GET() {
  try {
    const accounts = await getCalendarAccounts();
    return apiJson({ accounts, activeAccount: accounts.find((account) => account.isActive) });
  } catch {
    return apiError("Les comptes Calendrier ne peuvent pas être chargés.", 500);
  }
}

export async function POST(request: Request) {
  if (!isTrustedSameOriginRequest(request)) return apiError("La requête de gestion des comptes est refusée.", 403);

  let body: AccountRequestBody;
  try { body = await request.json() as AccountRequestBody; } catch { return apiError("Le contenu de la requête est invalide.", 400); }
  if (!isAccountAction(body.action)) return apiError("L’action demandée est invalide.", 400);

  try {
    if (body.action === "add") {
      if (!isCalendarProviderType(body.provider) || typeof body.emailAddress !== "string" || typeof body.displayName !== "string") {
        return apiError("Les informations du compte sont incomplètes.", 400);
      }
      await addCalendarAccount({ provider: body.provider, emailAddress: body.emailAddress, displayName: body.displayName });
    } else {
      if (typeof body.accountId !== "string") return apiError("L’identifiant du compte est invalide.", 400);
      if (body.action === "activate") await activateCalendarAccount(body.accountId);
      if (body.action === "test") await testCalendarAccount(body.accountId);
      if (body.action === "disconnect") await disconnectCalendarAccount(body.accountId);
    }
    const accounts = await getCalendarAccounts();
    return apiJson({ accounts, activeAccount: accounts.find((account) => account.isActive) });
  } catch (error) {
    return apiError(error instanceof Error ? error.message : "Le compte n’a pas pu être mis à jour.", 400);
  }
}

function isAccountAction(value: unknown): value is AccountAction {
  return ["add", "activate", "test", "disconnect"].includes(String(value));
}
