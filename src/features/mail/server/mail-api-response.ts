import "server-only";

export type MailApiErrorCode =
  | "MAIL_AUTHENTICATION_REQUIRED"
  | "MAIL_PERMISSION_DENIED"
  | "MAIL_PROVIDER_ERROR"
  | "MAIL_CONNECTION_ERROR"
  | "MAIL_INTERNAL_ERROR"
  | "MAIL_INVALID_REQUEST";

export function apiError(message: string, status: number, code: MailApiErrorCode = defaultErrorCode(status)) {
  return Response.json({ message, error: { code, message } }, { status, headers: { "Cache-Control": "no-store" } });
}

export function apiJson(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

export function isTrustedSameOriginRequest(request: Request): boolean {
  const origin = request.headers.get("origin");
  return Boolean(origin && origin === new URL(request.url).origin);
}

export function getSafeMailError(error: unknown): { message: string; status: number; code: MailApiErrorCode } {
  const message = error instanceof Error ? error.message : "Une erreur inattendue est survenue.";
  if (message.includes("n’est pas connecté") || message.includes("expiré") || message.includes("révoquée")) {
    return { message, status: 401, code: "MAIL_AUTHENTICATION_REQUIRED" };
  }
  if (message.includes("refuse l’accès") || message.includes("autorisations Gmail")) {
    return { message, status: 403, code: "MAIL_PERMISSION_DENIED" };
  }
  if (message.includes("Gmail") || message.includes("Google")) {
    return { message, status: 502, code: "MAIL_PROVIDER_ERROR" };
  }
  if (message.includes("invalide")) return { message, status: 400, code: "MAIL_INVALID_REQUEST" };
  if (message.includes("registre local")) return { message, status: 500, code: "MAIL_INTERNAL_ERROR" };
  return { message: "La connexion Gmail doit être vérifiée.", status: 502, code: "MAIL_CONNECTION_ERROR" };
}

function defaultErrorCode(status: number): MailApiErrorCode {
  if (status === 401) return "MAIL_AUTHENTICATION_REQUIRED";
  if (status === 403) return "MAIL_PERMISSION_DENIED";
  if (status === 400) return "MAIL_INVALID_REQUEST";
  if (status === 500) return "MAIL_INTERNAL_ERROR";
  return "MAIL_CONNECTION_ERROR";
}
