import "server-only";

export interface OpenAiServerConfig {
  apiKey: string;
  model: string;
  maximumOutputTokens: number;
  timeoutMs: number;
}

export type OpenAiConfigurationStatus =
  | { mode: "openai"; configured: true; model: string }
  | { mode: "deterministic"; configured: false; model: "deterministic-v1"; message: string };

const DEFAULT_MAXIMUM_OUTPUT_TOKENS = 2_000;
const DEFAULT_TIMEOUT_MS = 30_000;

export function getOpenAiConfigurationStatus(): OpenAiConfigurationStatus {
  const enabled = process.env.OPENAI_MAIL_AI_ENABLED?.trim().toLowerCase();
  if (enabled !== "true") {
    return {
      mode: "deterministic",
      configured: false,
      model: "deterministic-v1",
      message: enabled && enabled !== "false"
        ? "OPENAI_MAIL_AI_ENABLED doit valoir true ou false. Mode IA déterministe utilisé."
        : "OpenAI est désactivé. Mode IA déterministe utilisé.",
    };
  }
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return missing("OPENAI_API_KEY");
  const model = process.env.OPENAI_MODEL?.trim();
  if (!model) return missing("OPENAI_MODEL");
  if (/\s/.test(model)) {
    return invalid("OPENAI_MODEL contient une valeur invalide. Mode IA déterministe utilisé.");
  }
  for (const name of ["OPENAI_MAIL_ANALYSIS_MODEL", "OPENAI_MAIL_REPLY_MODEL", "OPENAI_MAIL_REWRITE_MODEL"] as const) {
    const operationModel = process.env[name]?.trim();
    if (operationModel && /\s/.test(operationModel)) return invalid(`${name} contient une valeur invalide. Mode IA déterministe utilisé.`);
  }
  if (!parseOptionalInteger(process.env.OPENAI_MAX_OUTPUT_TOKENS, 256, 16_000)) {
    return invalid("OPENAI_MAX_OUTPUT_TOKENS doit être un entier compris entre 256 et 16000. Mode IA déterministe utilisé.");
  }
  if (!parseOptionalInteger(process.env.OPENAI_TIMEOUT_MS, 1_000, 120_000)) {
    return invalid("OPENAI_TIMEOUT_MS doit être un entier compris entre 1000 et 120000. Mode IA déterministe utilisé.");
  }
  return { mode: "openai", configured: true, model };
}

export function getOpenAiServerConfig(): OpenAiServerConfig {
  const status = getOpenAiConfigurationStatus();
  if (!status.configured) throw new Error(status.message);
  return {
    apiKey: process.env.OPENAI_API_KEY!.trim(),
    model: status.model,
    maximumOutputTokens: Number(process.env.OPENAI_MAX_OUTPUT_TOKENS) || DEFAULT_MAXIMUM_OUTPUT_TOKENS,
    timeoutMs: Number(process.env.OPENAI_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS,
  };
}

function missing(name: "OPENAI_API_KEY" | "OPENAI_MODEL"): OpenAiConfigurationStatus {
  return invalid(`Variable ${name} manquante. Configurez votre fichier .env.local. Mode IA déterministe utilisé.`);
}

function invalid(message: string): OpenAiConfigurationStatus {
  return { mode: "deterministic", configured: false, model: "deterministic-v1", message };
}

function parseOptionalInteger(value: string | undefined, minimum: number, maximum: number): boolean {
  if (!value?.trim()) return true;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= minimum && parsed <= maximum;
}
