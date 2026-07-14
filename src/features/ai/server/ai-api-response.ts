import "server-only";

import { AiServiceError } from "@/features/ai/types/ai";

export function getSafeAiError(error: unknown) {
  if (error instanceof AiServiceError) return error.detail;
  if (error instanceof Error && (error.message.includes("aucun texte") || error.message.includes("trop volumineux"))) {
    return { code: "invalid_input" as const, message: error.message, recoverable: false, status: 400 };
  }
  return { code: "provider_unavailable" as const, message: "Le service IA est temporairement indisponible.", recoverable: true, status: 502 };
}
