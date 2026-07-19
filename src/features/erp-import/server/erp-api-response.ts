import "server-only";

export function erpJson(data: unknown, status = 200): Response {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

export function erpError(error: unknown, fallback = "L’opération ERP a échoué."): Response {
  const message = error instanceof Error ? error.message : fallback;
  const invalid = /doit|doivent|attendu|attendus|vide|limite|format|colonne|fichier|invalide|déjà été importés|Sélectionnez/i.test(message);
  return erpJson({ message, error: { code: invalid ? "ERP_INVALID_IMPORT" : "ERP_INTERNAL_ERROR", message } }, invalid ? 400 : 500);
}

export function isTrustedErpMutation(request: Request): boolean {
  const origin = request.headers.get("origin");
  return Boolean(origin && origin === new URL(request.url).origin);
}
