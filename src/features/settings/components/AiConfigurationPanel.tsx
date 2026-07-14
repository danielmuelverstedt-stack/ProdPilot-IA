"use client";

import { useState } from "react";
import type { AiUsageSummary } from "@/features/ai/types/ai-usage";
import { SettingsPanel } from "@/features/settings/components/SettingsUi";
import type { AppSettings } from "@/features/settings/types/settings";

export interface AiSafeStatusResponse {
  status: { mode: "openai" | "deterministic"; configured: boolean; model: string; message?: string };
  models: { analysis: string; reply: string; rewrite: string };
  cache: { operational: boolean; type: string };
  limits: { dailyServerLimit: number };
  mailAiEnvironmentEnabled: boolean;
  deterministicFallbackAvailable: boolean;
  tokenUsageAvailable: boolean;
  usageRepositoryOperational: boolean;
  promptCacheUsageAvailable: boolean;
  configurationChecks: { apiKeyPresent: boolean; baseModelConfigured: boolean; connectionTestedAt: string | null };
  automaticAnalysis: false;
  automaticDraftCreation: false;
  sendingEnabled: false;
}

type UpdateSettings = (updater: (current: AppSettings) => AppSettings | void, description?: string) => void;

export function AiConfigurationPanel({ settings, updateSettings, diagnostics, usage, error, onRefresh }: { settings: AppSettings; updateSettings: UpdateSettings; diagnostics: AiSafeStatusResponse | null; usage: AiUsageSummary | null; error: string | null; onRefresh: () => void }) {
  const [testPending, setTestPending] = useState(false);
  const [testMessage, setTestMessage] = useState<string | null>(null);
  const ai = settings.ai;

  async function testConnection() {
    setTestPending(true); setTestMessage(null);
    try {
      const response = await fetch("/api/ai/test-connection", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ budgetPolicy: ai.budgetPolicy, pricingRegistry: ai.pricingRegistry }) });
      const value = await response.json() as { state?: string; message?: string };
      setTestMessage(value.message ?? (response.ok ? "Connexion OpenAI réussie." : "Le test OpenAI a échoué."));
      onRefresh();
    } catch { setTestMessage("Le test OpenAI est temporairement indisponible."); }
    finally { setTestPending(false); }
  }

  return <>
    <SettingsPanel title="Configuration" description="État serveur sûr : aucune clé, aucun fragment de secret et aucune erreur brute ne sont affichés.">
      {error ? <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p> : diagnostics ? <>
        <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <Value label="Fournisseur" value="OpenAI" />
          <Value label="Configuration" value={diagnostics.status.configured ? "OpenAI configuré" : "OpenAI non configuré"} />
          <Value label="Assistant IA Mails" value={ai.enabled && diagnostics.mailAiEnvironmentEnabled ? "Activé" : "Désactivé"} />
          <Value label="Modèle d’analyse" value={diagnostics.models.analysis} /><Value label="Modèle de réponse" value={diagnostics.models.reply} /><Value label="Modèle de réécriture" value={diagnostics.models.rewrite} />
          <Value label="Dernier appel réussi" value={usage?.lastSuccessfulCallAt ? formatDate(usage.lastSuccessfulCallAt) : "Aucun"} />
          <Value label="Dernière erreur sûre" value={safeErrorLabel(usage?.lastSafeErrorCategory)} />
          <Value label="Mode déterministe" value={diagnostics.deterministicFallbackAvailable ? "Disponible" : "Indisponible"} />
          <Value label="Cache" value={diagnostics.cache.operational ? "Actif en développement local" : "Stockage de production requis"} />
          <Value label="Dépôt d’utilisation" value={diagnostics.usageRepositoryOperational ? "Opérationnel" : "Stockage sécurisé requis"} />
          <Value label="Limite quotidienne" value={`${Math.min(diagnostics.limits.dailyServerLimit, ai.budgetPolicy.dailyRequestLimit)} requêtes`} />
          <Value label="Limite mensuelle interne" value={money(ai.budgetPolicy.monthlyHardStopAmount, ai.budgetPolicy.currencyDisplay)} />
          <Value label="Statut du budget interne" value={usage ? budgetLabel[usage.budget.status] : "Indisponible"} />
        </dl>
        {!diagnostics.status.configured && diagnostics.status.message ? <p className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">{diagnostics.status.message}</p> : null}
        <div className="mt-4 flex flex-wrap items-center gap-3"><button type="button" disabled={testPending} onClick={() => void testConnection()} className="min-h-10 rounded-xl bg-[var(--app-primary)] px-4 text-sm font-semibold text-white disabled:opacity-45">{testPending ? "Test en cours…" : "Tester la connexion OpenAI"}</button>{testMessage ? <p role="status" className="text-sm text-slate-700">{testMessage}</p> : null}</div>
      </> : <p className="text-sm text-slate-500">Chargement de la configuration…</p>}
    </SettingsPanel>
    <SettingsPanel title="Checklist de première activation" description="La clé API reste exclusivement dans .env.local ; elle ne doit jamais être saisie dans cette page.">
      <div className="grid gap-2 sm:grid-cols-2">
        <ManualCheck label="Compte OpenAI Platform créé" checked={ai.firstUseChecklist.platformAccountCreated} onChange={(value) => updateSettings((current) => { current.ai.firstUseChecklist.platformAccountCreated = value; }, "Checklist OpenAI modifiée")} />
        <ManualCheck label="Moyen de paiement ou crédits configurés" checked={ai.firstUseChecklist.billingConfigured} onChange={(value) => updateSettings((current) => { current.ai.firstUseChecklist.billingConfigured = value; }, "Checklist OpenAI modifiée")} />
        <DerivedCheck label="Clé API créée" checked={Boolean(diagnostics?.configurationChecks.apiKeyPresent)} />
        <DerivedCheck label="Clé enregistrée dans .env.local" checked={Boolean(diagnostics?.configurationChecks.apiKeyPresent)} />
        <ManualCheck label="Application redémarrée" checked={ai.firstUseChecklist.applicationRestarted} onChange={(value) => updateSettings((current) => { current.ai.firstUseChecklist.applicationRestarted = value; }, "Checklist OpenAI modifiée")} />
        <DerivedCheck label="Modèle configuré" checked={Boolean(diagnostics?.configurationChecks.baseModelConfigured)} />
        <DerivedCheck label="Connexion testée" checked={Boolean(diagnostics?.configurationChecks.connectionTestedAt)} />
        <DerivedCheck label="Consentement confidentialité accepté" checked={Boolean(ai.privacyAcknowledgedAt)} />
        <DerivedCheck label="Budget interne configuré" checked={ai.budgetPolicy.monthlyHardStopAmount > 0} />
        <DerivedCheck label="Analyse automatique désactivée" checked={!ai.automaticAnalysis} />
        <DerivedCheck label="Envoi automatique désactivé" checked={!ai.allowSending} />
      </div>
      <p className="mt-4 text-xs leading-5 text-slate-600">Les coordonnées bancaires restent uniquement sur OpenAI Platform et ne sont jamais stockées dans ProdPilot IA.</p>
    </SettingsPanel>
  </>;
}

function Value({ label, value }: { label: string; value: string }) { return <div className="rounded-xl bg-slate-50 p-3"><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt><dd className="mt-1 font-semibold">{value}</dd></div>; }
function ManualCheck({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) { return <label className="flex items-center gap-2 rounded-xl border border-[var(--app-border)] p-3 text-sm"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />{label}</label>; }
function DerivedCheck({ label, checked }: { label: string; checked: boolean }) { return <div className="flex items-center gap-2 rounded-xl border border-[var(--app-border)] p-3 text-sm"><span aria-hidden="true" className={`grid size-5 place-items-center rounded-full text-xs text-white ${checked ? "bg-emerald-600" : "bg-slate-300"}`}>{checked ? "✓" : "–"}</span>{label}</div>; }
function safeErrorLabel(value: string | null | undefined) { const labels: Record<string, string> = { authentication: "Clé API invalide", quota: "Facturation ou quota indisponible", model_unavailable: "Modèle non disponible", timeout: "Délai dépassé", provider_unavailable: "Service temporairement indisponible", rate_limit: "Limite quotidienne atteinte", budget_blocked: "Budget interne bloqué" }; return value ? labels[value] ?? "Erreur sûre enregistrée" : "Aucune"; }
function formatDate(value: string) { return new Intl.DateTimeFormat("fr-BE", { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Brussels" }).format(new Date(value)); }
function money(value: number, currency: string) { return new Intl.NumberFormat("fr-BE", { style: "currency", currency }).format(value); }
const budgetLabel = { normal: "Normal", attention: "Attention", almost_reached: "Budget presque atteint", blocked: "Appels IA bloqués", pricing_unavailable: "Estimation financière non configurée" } as const;
