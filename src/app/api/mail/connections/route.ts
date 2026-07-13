import {
  connectMailProvider,
  disconnectMailProvider,
  getMailConnectionSummaries,
} from "@/features/mail/services/mail-connections";
import {
  isMailProviderType,
  type MailProviderType,
} from "@/features/mail/types/mail";

interface ProviderRequestBody {
  provider?: unknown;
}

async function readProvider(request: Request): Promise<MailProviderType | null> {
  try {
    const body: ProviderRequestBody = await request.json();
    return isMailProviderType(body.provider) ? body.provider : null;
  } catch {
    return null;
  }
}

function errorResponse(message: string, status: number) {
  return Response.json({ message }, { status });
}

export async function GET() {
  return Response.json({ connections: await getMailConnectionSummaries() });
}

export async function POST(request: Request) {
  const provider = await readProvider(request);

  if (!provider) {
    return errorResponse("Le fournisseur de messagerie est invalide.", 400);
  }

  try {
    const connection = await connectMailProvider(provider);
    return Response.json({ connection });
  } catch {
    if (provider === "microsoft") {
      return errorResponse(
        "La connexion Microsoft 365 n’est pas encore disponible.",
        409,
      );
    }

    return errorResponse("La connexion n’a pas pu être établie.", 500);
  }
}

export async function DELETE(request: Request) {
  const provider = await readProvider(request);

  if (!provider) {
    return errorResponse("Le fournisseur de messagerie est invalide.", 400);
  }

  try {
    const connection = await disconnectMailProvider(provider);
    return Response.json({ connection });
  } catch {
    return errorResponse("La déconnexion n’a pas pu être effectuée.", 500);
  }
}
