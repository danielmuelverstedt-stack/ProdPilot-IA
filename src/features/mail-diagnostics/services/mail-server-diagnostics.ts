import "server-only";

import { getOpenAiConfigurationStatus } from "@/features/ai/config/openai-config";
import { aiUsageRepository } from "@/features/ai/server/repositories/local-ai-usage-repository";
import type { MailDiagnosticItem, MailServerDiagnostics } from "@/features/mail-diagnostics/types/mail-diagnostics";
import { mailActivityRepository } from "@/features/mail-management/server/mail-activity-repository";
import { getGoogleTokenKey } from "@/features/mail/server/google/google-account-key";
import { getGooglePermissionStatus } from "@/features/mail/server/google/google-auth";
import { googleTokenRepository } from "@/features/mail/server/google/local-google-token-repository";
import { mailAccountRepository } from "@/features/mail/server/accounts/local-mail-account-repository";
import { getActiveMailContext } from "@/features/mail/services/mail-account-context";
import { getLastMailSynchronization } from "@/features/mail/services/mail-message-cache";

export async function getMailServerDiagnostics(): Promise<MailServerDiagnostics> {
  const generatedAt = new Date().toISOString();
  const accounts = await mailAccountRepository.list();
  const { account, provider } = await getActiveMailContext();
  const items: MailDiagnosticItem[] = [];
  let statistics: Awaited<ReturnType<typeof provider.getMailboxStatistics>> | null = null;
  let connectionError: string | null = null;
  const connectionStartedAt = Date.now();
  try {
    await provider.testConnection();
    statistics = await provider.getMailboxStatistics();
  } catch (error) {
    connectionError = error instanceof Error ? error.message : "La connexion au fournisseur Mail a échoué.";
  }
  items.push(item("gmail", "Connexion Gmail", connectionError ? "error" : "ok", connectionError ? "Erreur" : "OK", connectionError ?? `Connexion vérifiée en ${Date.now() - connectionStartedAt} ms.`));

  const oauthAccounts = accounts.filter((entry) => entry.mode === "oauth");
  items.push(item("accounts", "Nombre de comptes", oauthAccounts.length ? "ok" : "warning", `${accounts.length} compte${accounts.length > 1 ? "s" : ""}`, `${oauthAccounts.length} compte OAuth et ${accounts.length - oauthAccounts.length} compte de démonstration.`));

  if (account.provider === "google" && account.mode === "oauth") {
    const key = getGoogleTokenKey(account.id);
    const record = await googleTokenRepository.get(key);
    const permission = await getGooglePermissionStatus(key);
    const expiry = record?.tokens.expiryDate ?? null;
    const tokenValid = Boolean(record?.tokens.refreshToken) && (!expiry || expiry > Date.now());
    items.push(item("oauth", "Statut OAuth", tokenValid ? "ok" : "error", tokenValid ? "OK" : "Erreur", tokenValid ? "Jeton de renouvellement présent et jeton d’accès non expiré. Aucune valeur sensible n’est affichée." : "Jeton absent ou expiré : reconnectez le compte Google."));
    const required = ["https://www.googleapis.com/auth/gmail.readonly", "https://www.googleapis.com/auth/gmail.compose", "https://www.googleapis.com/auth/gmail.modify"];
    const missing = required.filter((scope) => !permission.grantedScopes.includes(scope));
    items.push(item("scopes", "Autorisations Gmail", missing.length ? "error" : "ok", missing.length ? `${missing.length} manquante${missing.length > 1 ? "s" : ""}` : "OK", missing.length ? "Une reconnexion avec consentement est nécessaire." : "Lecture, brouillons et classement sont autorisés. gmail.send reste volontairement absent."));
  } else {
    items.push(item("oauth", "Statut OAuth", "warning", "Non utilisé", "Le compte actif est un compte de démonstration."));
  }

  const synchronization = getLastMailSynchronization(account.id);
  const detected = statistics?.inboxMessages ?? null;
  items.push(item("synchronized", "Messages synchronisés", synchronization?.isComplete ? "ok" : "warning", String(synchronization?.synchronizedMessages ?? 0), synchronization ? `${synchronization.synchronizedMessages} message(s) chargés lors de la dernière synchronisation mesurée.` : "Aucune synchronisation complète mesurée dans ce processus."));
  items.push(item("detected", "Nombre réel détecté", statistics ? "ok" : "error", detected === null ? "Indisponible" : String(detected), statistics ? `${statistics.inboxThreads} conversations, dont ${statistics.unreadInboxMessages} message(s) non lu(s), détectées dans INBOX.` : connectionError ?? "Compteur Gmail indisponible."));
  items.push(item("last-sync", "Dernière synchronisation", account.lastSuccessfulSyncAt ? "ok" : "warning", account.lastSuccessfulSyncAt ? formatDate(account.lastSuccessfulSyncAt) : "Jamais", synchronization ? `${synchronization.pageCount} page(s) Gmail parcourue(s).` : "Aucune durée disponible."));
  items.push(item("sync-time", "Temps de synchronisation", synchronization ? "ok" : "warning", synchronization ? `${synchronization.durationMs} ms` : "Non mesuré", synchronization ? `Résultat ${synchronization.cache === "hit" ? "issu du cache" : "récupéré auprès de Gmail"}.` : "Lancez une synchronisation complète pour mesurer ce temps."));

  const activity = await mailActivityRepository.list(account.id);
  const failedActivities = activity.filter((entry) => entry.gmailResult === "failed").length;
  const mailErrors = failedActivities + (account.error ? 1 : 0) + (connectionError ? 1 : 0);
  items.push(item("errors", "Nombre d’erreurs", mailErrors ? "error" : "ok", String(mailErrors), `${failedActivities} mutation(s) Gmail en échec dans le journal local.`));

  const aiStatus = getOpenAiConfigurationStatus();
  const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
  const usage = await aiUsageRepository.listSince(startOfDay.toISOString());
  const attempted = usage.filter((entry) => entry.provider === "openai" && entry.providerRequestAttempted).length;
  const aiErrors = usage.filter((entry) => !entry.success).length;
  const dailyLimit = parseDailyLimit(process.env.OPENAI_DAILY_REQUEST_LIMIT);
  items.push(item("openai", "État OpenAI", aiStatus.configured ? (aiErrors ? "warning" : "ok") : "warning", aiStatus.configured ? "OK" : "Mode déterministe", aiStatus.configured ? `Modèle ${aiStatus.model}. ${aiErrors} erreur(s) IA aujourd’hui.` : aiStatus.message));
  items.push(item("ai-quota", "Quota IA", attempted >= dailyLimit ? "error" : attempted >= dailyLimit * 0.8 ? "warning" : "ok", `${attempted} / ${dailyLimit}`, "Limite quotidienne interne ProdPilot ; la facturation OpenAI Platform reste la source de vérité."));

  return { generatedAt, items };
}

function item(id: string, label: string, status: MailDiagnosticItem["status"], value: string, explanation: string): MailDiagnosticItem { return { id, label, status, value, explanation }; }
function formatDate(value: string) { return new Intl.DateTimeFormat("fr-BE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(new Date(value)); }
function parseDailyLimit(value: string | undefined) { const parsed = Number(value); return Number.isInteger(parsed) && parsed > 0 ? parsed : 50; }
