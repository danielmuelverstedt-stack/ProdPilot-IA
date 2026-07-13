import {
  activateMailAccount,
  addMailAccount,
  disconnectMailAccount,
  getMailAccounts,
  renameMailAccount,
  testMailAccount,
} from "@/features/mail/services/mail-connections";
import {
  apiError,
  apiJson,
  isTrustedSameOriginRequest,
} from "@/features/mail/server/mail-api-response";
import { isMailProviderType } from "@/features/mail/types/mail";

export const runtime = "nodejs";

type AccountAction = "add" | "rename" | "activate" | "test" | "disconnect";

interface AccountRequestBody {
  action?: unknown;
  accountId?: unknown;
  provider?: unknown;
  emailAddress?: unknown;
  displayName?: unknown;
}

export async function GET() {
  const accounts = await getMailAccounts();
  return apiJson({ accounts, activeAccount: accounts.find((account) => account.isActive) });
}

export async function POST(request: Request) {
  if (!isTrustedSameOriginRequest(request)) {
    return apiError("La requête de gestion des comptes est refusée.", 403);
  }

  let body: AccountRequestBody;
  try {
    body = await request.json() as AccountRequestBody;
  } catch {
    return apiError("Le contenu de la requête est invalide.", 400);
  }
  if (!isAccountAction(body.action)) return apiError("L’action demandée est invalide.", 400);

  try {
    if (body.action === "add") {
      if (
        !isMailProviderType(body.provider) ||
        typeof body.emailAddress !== "string" ||
        typeof body.displayName !== "string"
      ) {
        return apiError("Les informations du compte sont incomplètes.", 400);
      }
      await addMailAccount({
        provider: body.provider,
        emailAddress: body.emailAddress,
        displayName: body.displayName,
      });
    } else {
      if (typeof body.accountId !== "string") {
        return apiError("L’identifiant du compte est invalide.", 400);
      }
      if (body.action === "rename") {
        if (typeof body.displayName !== "string") {
          return apiError("Le nouveau nom du compte est invalide.", 400);
        }
        await renameMailAccount(body.accountId, body.displayName);
      }
      if (body.action === "activate") await activateMailAccount(body.accountId);
      if (body.action === "test") await testMailAccount(body.accountId);
      if (body.action === "disconnect") await disconnectMailAccount(body.accountId);
    }

    const accounts = await getMailAccounts();
    return apiJson({ accounts, activeAccount: accounts.find((account) => account.isActive) });
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : "Le compte n’a pas pu être mis à jour.",
      400,
    );
  }
}

function isAccountAction(value: unknown): value is AccountAction {
  return ["add", "rename", "activate", "test", "disconnect"].includes(String(value));
}
