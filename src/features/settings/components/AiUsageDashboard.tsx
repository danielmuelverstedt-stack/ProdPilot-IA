"use client";

import type { AiOperationType } from "@/features/ai/types/ai";
import type { AiUsageQuery, AiUsageSummary } from "@/features/ai/types/ai-usage";
import { Field, inputClass, SettingsPanel } from "@/features/settings/components/SettingsUi";

export function AiUsageDashboard({ summary, query, pending, error, onQueryChange }: { summary: AiUsageSummary | null; query: AiUsageQuery; pending: boolean; error: string | null; onQueryChange: (query: AiUsageQuery) => void }) {
  return <SettingsPanel title="Utilisation et budget" description="Métriques internes sans corps d’e-mail, prompt complet, destinataire, secret ni jeton OAuth.">
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <Field label="Période"><select className={inputClass} value={query.period} onChange={(event) => onQueryChange({ ...query, period: event.target.value as AiUsageQuery["period"] })}><option value="today">Aujourd’hui</option><option value="last_7_days">7 derniers jours</option><option value="current_month">Mois en cours</option><option value="custom">Période personnalisée</option></select></Field>
      {query.period === "custom" ? <><Field label="Du"><input className={inputClass} type="date" value={query.dateFrom ?? ""} onChange={(event) => onQueryChange({ ...query, dateFrom: event.target.value })} /></Field><Field label="Au"><input className={inputClass} type="date" value={query.dateTo ?? ""} onChange={(event) => onQueryChange({ ...query, dateTo: event.target.value })} /></Field></> : null}
      <Field label="Opération"><select className={inputClass} value={query.operation ?? "all"} onChange={(event) => onQueryChange({ ...query, operation: event.target.value as AiOperationType | "all" })}><option value="all">Toutes</option><option value="mail_analysis">Analyses</option><option value="mail_reply">Réponses</option><option value="mail_rewrite">Réécritures</option><option value="connection_test">Tests de connexion</option></select></Field>
      <Filter label="Modèle" value={query.model} values={summary?.availableFilters.models ?? []} onChange={(model) => onQueryChange({ ...query, model })} />
      <Filter label="Compte" value={query.accountId} values={summary?.availableFilters.accounts ?? []} onChange={(accountId) => onQueryChange({ ...query, accountId })} />
      <Filter label="Utilisateur" value={query.userId} values={summary?.availableFilters.users ?? []} onChange={(userId) => onQueryChange({ ...query, userId })} />
    </div>
    {pending ? <p className="mt-5 text-sm text-slate-500">Actualisation de l’utilisation…</p> : error ? <p role="alert" className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p> : summary ? <Dashboard summary={summary} /> : null}
  </SettingsPanel>;
}

function Dashboard({ summary }: { summary: AiUsageSummary }) {
  const financial = summary.financial;
  const budget = summary.budget;
  return <div className="mt-5 space-y-5">
    {summary.alerts.length ? <div className="space-y-2">{summary.alerts.map((alert) => <p key={alert.id} className={`rounded-xl border p-3 text-sm ${alert.level === "critical" ? "border-red-200 bg-red-50 text-red-800" : alert.level === "warning" ? "border-amber-200 bg-amber-50 text-amber-900" : "border-blue-200 bg-blue-50 text-blue-800"}`}>{alert.message}</p>)}</div> : <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">Utilisation normale.</p>}
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Metric label="Requêtes aujourd’hui" value={summary.requestsToday} /><Metric label="Requêtes ce mois" value={summary.requestsThisMonth} />
      <Metric label="Analyses" value={summary.operations.mail_analysis} /><Metric label="Réponses" value={summary.operations.mail_reply} /><Metric label="Réécritures" value={summary.operations.mail_rewrite} /><Metric label="Requêtes bloquées" value={summary.blockedRequests} />
      <Metric label="Résultats en cache" value={summary.cacheHits} /><Metric label="Taux de cache" value={`${summary.cacheHitPercentage} %`} />
      <Metric label="Jetons d’entrée" value={formatNumber(summary.inputTokens)} /><Metric label="Entrée en cache" value={formatNumber(summary.cachedInputTokens)} /><Metric label="Jetons de sortie" value={formatNumber(summary.outputTokens)} /><Metric label="Total de jetons" value={formatNumber(summary.totalTokens)} />
    </div>
    <div className={`rounded-2xl border p-4 ${budget.status === "blocked" ? "border-red-200 bg-red-50" : budget.status === "almost_reached" || budget.status === "attention" ? "border-amber-200 bg-amber-50" : "border-[var(--app-border)] bg-slate-50"}`}>
      <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold">Budget interne mensuel</h3><span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold">{budgetLabel[budget.status]}</span></div>
      <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4"><Value label="Budget indicatif" value={money(budget.policy.monthlyBudgetAmount, budget.policy.currencyDisplay)} /><Value label="Avertissement" value={money(budget.policy.monthlyWarningAmount, budget.policy.currencyDisplay)} /><Value label="Plafond bloquant" value={money(budget.policy.monthlyHardStopAmount, budget.policy.currencyDisplay)} /><Value label="Marge interne restante" value={budget.estimatedRemaining === null ? "Non calculable" : money(budget.estimatedRemaining, budget.policy.currencyDisplay)} /></dl>
      <p className="mt-3 text-xs leading-5 text-slate-600">Garde-fou interne ProdPilot uniquement. OpenAI Platform reste la source de vérité pour l’usage, les crédits et la facturation.</p>
    </div>
    {financial.configured ? <div><h3 className="font-semibold">Estimations financières</h3><div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Metric label="Période sélectionnée" value={money(financial.estimatedPeriodCost ?? 0, financial.currency)} /><Metric label="Aujourd’hui" value={money(financial.estimatedTodayCost ?? 0, financial.currency)} /><Metric label="Mois en cours" value={money(financial.estimatedMonthCost ?? 0, financial.currency)} /><Metric label="Économie estimée du cache" value={money(financial.estimatedCacheSavings ?? 0, financial.currency)} /><Metric label="Moyenne / analyse" value={nullableMoney(financial.averageAnalysisCost, financial.currency)} /><Metric label="Moyenne / réponse" value={nullableMoney(financial.averageReplyCost, financial.currency)} /><Metric label="Moyenne / réécriture" value={nullableMoney(financial.averageRewriteCost, financial.currency)} /></div><p className="mt-2 text-xs text-slate-500">Tous les montants sont des estimations, jamais des factures.</p></div> : <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700">Estimation financière non configurée</p>}
  </div>;
}

function Filter({ label, value, values, onChange }: { label: string; value?: string; values: string[]; onChange: (value: string | undefined) => void }) { return <Field label={label}><select className={inputClass} value={value ?? ""} onChange={(event) => onChange(event.target.value || undefined)}><option value="">Tous</option>{values.map((item) => <option key={item} value={item}>{item}</option>)}</select></Field>; }
function Metric({ label, value }: { label: string; value: string | number }) { return <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-1 font-semibold">{value}</p></div>; }
function Value({ label, value }: { label: string; value: string }) { return <div><dt className="text-xs font-semibold text-slate-500">{label}</dt><dd className="mt-1 font-semibold">{value}</dd></div>; }
function formatNumber(value: number) { return new Intl.NumberFormat("fr-BE").format(value); }
function money(value: number, currency: string) { return new Intl.NumberFormat("fr-BE", { style: "currency", currency, minimumFractionDigits: 2, maximumFractionDigits: 6 }).format(value); }
function nullableMoney(value: number | null, currency: string) { return value === null ? "Non disponible" : money(value, currency); }
const budgetLabel = { normal: "Normal", attention: "Attention", almost_reached: "Budget presque atteint", blocked: "Appels IA bloqués", pricing_unavailable: "Estimation non configurée" } as const;
