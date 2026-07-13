import "server-only";

export function apiError(message: string, status: number) {
  return Response.json({ message }, { status, headers: { "Cache-Control": "no-store" } });
}

export function apiJson(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

export function isTrustedSameOriginRequest(request: Request): boolean {
  const origin = request.headers.get("origin");
  return Boolean(origin && origin === new URL(request.url).origin);
}

export function getSafeMailError(error: unknown): { message: string; status: number } {
  const message = error instanceof Error ? error.message : "Une erreur inattendue est survenue.";
  if (message.includes("n’est pas connecté")) return { message, status: 401 };
  if (message.includes("invalide")) return { message, status: 400 };
  return { message, status: 502 };
}
