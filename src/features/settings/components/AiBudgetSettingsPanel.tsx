"use client";

import { useState } from "react";
import type { AiCurrency, AiPricingEntry } from "@/features/ai/types/ai";
import { Field, inputClass, SettingsPanel } from "@/features/settings/components/SettingsUi";
import type { AppSettings } from "@/features/settings/types/settings";

type UpdateSettings = (updater: (current: AppSettings) => AppSettings | void, description?: string) => void;

export function AiBudgetSettingsPanel({ settings, updateSettings }: { settings: AppSettings; updateSettings: UpdateSettings }) {
  const ai = settings.ai;
  const policy = ai.budgetPolicy;
  const [draft, setDraft] = useState({ model: "", input: "", cached: "", output: "", date: new Date().toISOString().slice(0, 10), source: "", currency: policy.currencyDisplay as AiCurrency });
  const setPolicyNumber = (key: keyof Pick<typeof policy, "monthlyBudgetAmount" | "monthlyWarningAmount" | "monthlyHardStopAmount" | "dailyRequestLimit" | "perUserDailyRequestLimit" | "perMessageAnalysisLimit" | "perDraftRewriteLimit">, value: string) => updateSettings((current) => {
    const integerLimit = key === "dailyRequestLimit" || key === "perUserDailyRequestLimit" || key === "perMessageAnalysisLimit" || key === "perDraftRewriteLimit";
    current.ai.budgetPolicy[key] = integerLimit ? Math.max(1, Math.round(Number(value) || 1)) : Math.max(0.01, Number(value) || 0.01);
  }, "Budget IA modifié");
  const canAdd = draft.model.trim() && draft.source.trim() && [draft.input, draft.cached, draft.output].every((value) => value !== "" && Number(value) >= 0);

  function addPricing() {
    if (!canAdd) return;
    const entry: AiPricingEntry = { id: crypto.randomUUID(), provider: "openai", model: draft.model.trim(), inputPricePerMillionTokens: Number(draft.input), cachedInputPricePerMillionTokens: Number(draft.cached), outputPricePerMillionTokens: Number(draft.output), currency: draft.currency, effectiveDate: draft.date, sourceNote: draft.source.trim(), enabled: true };
    updateSettings((current) => { current.ai.pricingRegistry.push(entry); }, "Tarif IA ajouté");
    setDraft({ model: "", input: "", cached: "", output: "", date: new Date().toISOString().slice(0, 10), source: "", currency: policy.currencyDisplay });
  }

  return <>
    <SettingsPanel title="Budget interne" description="Ce garde-fou ProdPilot est une estimation interne. Il ne modifie ni la facturation ni les limites configurées sur OpenAI Platform.">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <NumberField label="Budget mensuel indicatif" value={policy.monthlyBudgetAmount} step="0.01" onChange={(value) => setPolicyNumber("monthlyBudgetAmount", value)} />
        <NumberField label="Seuil d’avertissement" value={policy.monthlyWarningAmount} step="0.01" onChange={(value) => setPolicyNumber("monthlyWarningAmount", value)} />
        <NumberField label="Plafond interne bloquant" value={policy.monthlyHardStopAmount} step="0.01" onChange={(value) => setPolicyNumber("monthlyHardStopAmount", value)} />
        <NumberField label="Requêtes/jour — entreprise" value={policy.dailyRequestLimit} step="1" onChange={(value) => setPolicyNumber("dailyRequestLimit", value)} />
        <NumberField label="Requêtes/jour — utilisateur" value={policy.perUserDailyRequestLimit} step="1" onChange={(value) => setPolicyNumber("perUserDailyRequestLimit", value)} />
        <NumberField label="Analyses par message" value={policy.perMessageAnalysisLimit} step="1" onChange={(value) => setPolicyNumber("perMessageAnalysisLimit", value)} />
        <NumberField label="Réécritures par brouillon" value={policy.perDraftRewriteLimit} step="1" onChange={(value) => setPolicyNumber("perDraftRewriteLimit", value)} />
        <Field label="Devise d’affichage"><select className={inputClass} value={policy.currencyDisplay} onChange={(event) => updateSettings((current) => { current.ai.budgetPolicy.currencyDisplay = event.target.value as AiCurrency; current.ai.budgetPolicy.administratorOverrideActive = false; }, "Devise du budget IA modifiée")}><option value="EUR">EUR</option><option value="USD">USD</option></select></Field>
        <Check label="Autoriser un dépassement administrateur" checked={policy.allowAdministratorOverride} onChange={(value) => updateSettings((current) => { current.ai.budgetPolicy.allowAdministratorOverride = value; if (!value) current.ai.budgetPolicy.administratorOverrideActive = false; }, "Autorisation de dépassement IA modifiée")} />
        <Check label="Activer temporairement le dépassement" checked={policy.administratorOverrideActive} disabled={!policy.allowAdministratorOverride} onChange={(value) => updateSettings((current) => { current.ai.budgetPolicy.administratorOverrideActive = current.ai.budgetPolicy.allowAdministratorOverride && value; }, "Dépassement administrateur IA modifié")} />
      </div>
      <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">Aucun dépassement n’est automatique. Le plafond interne dépend des tarifs validés ci-dessous et ne garantit pas l’arrêt exact de la facturation OpenAI.</p>
    </SettingsPanel>
    <SettingsPanel title="Registre de prix" description="Ajoutez uniquement des tarifs vérifiés auprès d’une source officielle. Aucun tarif n’est fourni ou actualisé automatiquement.">
      {ai.pricingRegistry.length ? <div className="space-y-2">{ai.pricingRegistry.map((entry) => <div key={entry.id} className="grid gap-2 rounded-xl border border-[var(--app-border)] p-3 text-sm sm:grid-cols-[1fr_auto]"><div><strong>{entry.model}</strong><p className="text-xs text-slate-500">Entrée {entry.inputPricePerMillionTokens} · cache {entry.cachedInputPricePerMillionTokens} · sortie {entry.outputPricePerMillionTokens} {entry.currency}/million · effet au {formatDate(entry.effectiveDate)}</p><p className="mt-1 text-xs text-slate-500">Source : {entry.sourceNote}</p></div><div className="flex gap-2"><button type="button" onClick={() => updateSettings((current) => { const target = current.ai.pricingRegistry.find((item) => item.id === entry.id); if (target) target.enabled = !target.enabled; }, "Tarif IA activé ou désactivé")} className={buttonClass}>{entry.enabled ? "Désactiver" : "Activer"}</button><button type="button" onClick={() => updateSettings((current) => { current.ai.pricingRegistry = current.ai.pricingRegistry.filter((item) => item.id !== entry.id); }, "Tarif IA supprimé")} className={buttonClass}>Supprimer</button></div></div>)}</div> : <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">Estimation financière non configurée</p>}
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Modèle"><input className={inputClass} value={draft.model} onChange={(event) => setDraft({ ...draft, model: event.target.value })} /></Field>
        <Field label="Entrée / million"><input className={inputClass} type="number" min="0" step="0.000001" value={draft.input} onChange={(event) => setDraft({ ...draft, input: event.target.value })} /></Field>
        <Field label="Entrée en cache / million"><input className={inputClass} type="number" min="0" step="0.000001" value={draft.cached} onChange={(event) => setDraft({ ...draft, cached: event.target.value })} /></Field>
        <Field label="Sortie / million"><input className={inputClass} type="number" min="0" step="0.000001" value={draft.output} onChange={(event) => setDraft({ ...draft, output: event.target.value })} /></Field>
        <Field label="Devise"><select className={inputClass} value={draft.currency} onChange={(event) => setDraft({ ...draft, currency: event.target.value as AiCurrency })}><option value="EUR">EUR</option><option value="USD">USD</option></select></Field>
        <Field label="Date d’effet"><input className={inputClass} type="date" value={draft.date} onChange={(event) => setDraft({ ...draft, date: event.target.value })} /></Field>
        <div className="sm:col-span-2"><Field label="Source officielle / note"><input className={inputClass} maxLength={500} value={draft.source} onChange={(event) => setDraft({ ...draft, source: event.target.value })} placeholder="Ex. : page officielle consultée le JJ/MM/AAAA" /></Field></div>
      </div>
      <button type="button" disabled={!canAdd} onClick={addPricing} className="mt-3 min-h-10 rounded-xl bg-[var(--app-primary)] px-4 text-sm font-semibold text-white disabled:opacity-40">Ajouter ce tarif validé</button>
    </SettingsPanel>
  </>;
}

function NumberField({ label, value, step, onChange }: { label: string; value: number; step: string; onChange: (value: string) => void }) { return <Field label={label}><input className={inputClass} type="number" min="0.01" step={step} value={value} onChange={(event) => onChange(event.target.value)} /></Field>; }
function Check({ label, checked, disabled = false, onChange }: { label: string; checked: boolean; disabled?: boolean; onChange: (value: boolean) => void }) { return <label className="flex items-center gap-2 rounded-xl border border-[var(--app-border)] p-3 text-sm"><input type="checkbox" disabled={disabled} checked={checked} onChange={(event) => onChange(event.target.checked)} />{label}</label>; }
function formatDate(value: string) { return new Intl.DateTimeFormat("fr-BE", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(`${value}T00:00:00`)); }
const buttonClass = "min-h-9 rounded-lg border border-[var(--app-border)] px-3 text-xs font-semibold";
