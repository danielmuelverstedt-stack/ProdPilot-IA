"use client";

import { useEffect, useState } from "react";
import type { AiUsageQuery, AiUsageSummary } from "@/features/ai/types/ai-usage";
import { AiBudgetSettingsPanel } from "@/features/settings/components/AiBudgetSettingsPanel";
import { AiConfigurationPanel, type AiSafeStatusResponse } from "@/features/settings/components/AiConfigurationPanel";
import { AiUsageDashboard } from "@/features/settings/components/AiUsageDashboard";
import { useSettings } from "@/features/settings/components/SettingsProvider";
import { Field, inputClass, SettingsPanel } from "@/features/settings/components/SettingsUi";

export function AiSettingsPanel() {
  const { settings, updateSettings } = useSettings();
  const [diagnostics, setDiagnostics] = useState<AiSafeStatusResponse | null>(null);
  const [usage, setUsage] = useState<AiUsageSummary | null>(null);
  const [configurationError, setConfigurationError] = useState<string | null>(null);
  const [usageError, setUsageError] = useState<string | null>(null);
  const [usagePending, setUsagePending] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [query, setQuery] = useState<AiUsageQuery>({ period: "current_month", operation: "all" });
  const ai = settings.ai;

  useEffect(() => {
    let active = true;
    fetch("/api/ai/mail/status", { cache: "no-store" }).then(async (response) => { if (!response.ok) throw new Error(); return response.json() as Promise<AiSafeStatusResponse>; }).then((result) => { if (active) { setDiagnostics(result); setConfigurationError(null); } }).catch(() => { if (active) setConfigurationError("Les diagnostics IA sont indisponibles."); });
    return () => { active = false; };
  }, [refreshKey]);

  useEffect(() => {
    if (query.period === "custom" && (!query.dateFrom || !query.dateTo)) return;
    let active = true;
    fetch("/api/ai/usage", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query, budgetPolicy: ai.budgetPolicy, pricingRegistry: ai.pricingRegistry }) }).then(async (response) => { if (!response.ok) throw new Error(); return response.json() as Promise<AiUsageSummary>; }).then((result) => { if (active) { setUsage(result); setUsageError(null); } }).catch(() => { if (active) setUsageError("Les métriques d’utilisation IA sont indisponibles."); }).finally(() => { if (active) setUsagePending(false); });
    return () => { active = false; };
  }, [ai.budgetPolicy, ai.pricingRegistry, query, refreshKey]);

  const updateNumber = (key: "maximumThreadMessages" | "maximumInputContextTokens" | "maximumAnalysisOutputTokens" | "maximumReplyOutputTokens" | "maximumRewriteOutputTokens" | "analysisExpirationMinutes" | "longThreadWarningThreshold", value: string, minimum: number, maximum: number) => updateSettings((draft) => { draft.ai[key] = Math.min(maximum, Math.max(minimum, Number(value) || minimum)); }, "Coûts et performances IA modifiés");

  return <div className="space-y-5">
    <AiConfigurationPanel settings={settings} updateSettings={updateSettings} diagnostics={diagnostics} usage={usage} error={configurationError} onRefresh={() => { setUsagePending(true); setRefreshKey((value) => value + 1); }} />
    <SettingsPanel title="Préférences de l’assistance" description="Les clés et modèles restent côté serveur. Chaque opération IA nécessite une action explicite.">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Check label="Activer l’assistance IA" checked={ai.enabled} onChange={(value) => updateSettings((draft) => { draft.ai.enabled = value; }, "Assistance IA modifiée")} />
        <Check label="Inclure la signature" checked={ai.includeSignature} onChange={(value) => updateSettings((draft) => { draft.ai.includeSignature = value; }, "Signature IA modifiée")} />
        <Check label="Inclure les métadonnées de pièces jointes" checked={ai.includeAttachmentMetadata} onChange={(value) => updateSettings((draft) => { draft.ai.includeAttachmentMetadata = value; }, "Métadonnées IA modifiées")} />
        <Check label="Afficher la confiance" checked={ai.displayConfidence} onChange={(value) => updateSettings((draft) => { draft.ai.displayConfidence = value; }, "Confiance IA modifiée")} />
        <Check label="Afficher la justification" checked={ai.displayJustification} onChange={(value) => updateSettings((draft) => { draft.ai.displayJustification = value; }, "Justification IA modifiée")} />
        <Check label="Autoriser la création manuelle de brouillons" checked={ai.allowDraftCreation} onChange={(value) => updateSettings((draft) => { draft.ai.allowDraftCreation = value; }, "Brouillons IA modifiés")} />
        <Check label="Réutiliser les analyses en cache" checked={ai.retainLocalAnalysisCache} onChange={(value) => updateSettings((draft) => { draft.ai.retainLocalAnalysisCache = value; }, "Cache IA modifié")} />
        <Check label="Afficher le badge de cache" checked={ai.showCachedResultBadge} onChange={(value) => updateSettings((draft) => { draft.ai.showCachedResultBadge = value; }, "Badge de cache modifié")} />
        <Check label="Afficher l’usage des jetons" checked={ai.showTokenUsage} onChange={(value) => updateSettings((draft) => { draft.ai.showTokenUsage = value; }, "Usage des jetons modifié")} />
        <StateCard title="Analyse automatique" value="Désactivée de force" /><StateCard title="Brouillon automatique" value="Désactivé de force" /><StateCard title="Envoi automatique" value="Désactivé de force" />
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Langue"><select className={inputClass} value={ai.preferredResponseLanguage} onChange={(event) => updateSettings((draft) => { draft.ai.preferredResponseLanguage = event.target.value as typeof ai.preferredResponseLanguage; }, "Langue IA modifiée")}><option value="fr">Français</option><option value="nl">Néerlandais</option><option value="en">Anglais</option><option value="de">Allemand</option></select></Field>
        <Field label="Ton par défaut"><select className={inputClass} value={ai.defaultTone} onChange={(event) => updateSettings((draft) => { draft.ai.defaultTone = event.target.value as typeof ai.defaultTone; }, "Ton IA modifié")}><option value="professional">Professionnel</option><option value="concise">Court</option><option value="diplomatic">Diplomatique</option><option value="direct">Direct</option><option value="technical">Technique</option><option value="internal">Interne</option><option value="customer">Client</option><option value="supplier">Fournisseur</option></select></Field>
        <Field label="Longueur"><select className={inputClass} value={ai.defaultLength} onChange={(event) => updateSettings((draft) => { draft.ai.defaultLength = event.target.value as typeof ai.defaultLength; }, "Longueur IA modifiée")}><option value="short">Courte</option><option value="medium">Moyenne</option><option value="long">Longue</option></select></Field>
      </div>
    </SettingsPanel>
    <SettingsPanel title="Jetons et performances" description="Ces préférences ne peuvent jamais dépasser les plafonds serveur centralisés.">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <NumberField label="Messages récents du fil" value={ai.maximumThreadMessages} min={1} max={20} onChange={(value) => updateNumber("maximumThreadMessages", value, 1, 20)} />
        <NumberField label="Contexte d’entrée maximal" value={ai.maximumInputContextTokens} min={500} max={100000} onChange={(value) => updateNumber("maximumInputContextTokens", value, 500, 100000)} />
        <NumberField label="Sortie analyse maximale" value={ai.maximumAnalysisOutputTokens} min={100} max={100000} onChange={(value) => updateNumber("maximumAnalysisOutputTokens", value, 100, 100000)} />
        <NumberField label="Sortie réponse maximale" value={ai.maximumReplyOutputTokens} min={100} max={100000} onChange={(value) => updateNumber("maximumReplyOutputTokens", value, 100, 100000)} />
        <NumberField label="Sortie réécriture maximale" value={ai.maximumRewriteOutputTokens} min={100} max={100000} onChange={(value) => updateNumber("maximumRewriteOutputTokens", value, 100, 100000)} />
        <NumberField label="Expiration du cache (minutes)" value={ai.analysisExpirationMinutes} min={5} max={43200} onChange={(value) => updateNumber("analysisExpirationMinutes", value, 5, 43200)} />
        <NumberField label="Alerte fil long" value={ai.longThreadWarningThreshold} min={500} max={100000} onChange={(value) => updateNumber("longThreadWarningThreshold", value, 500, 100000)} />
      </div>
    </SettingsPanel>
    <AiBudgetSettingsPanel settings={settings} updateSettings={updateSettings} />
    <AiUsageDashboard summary={usage} query={query} pending={usagePending} error={usageError} onQueryChange={(nextQuery) => { setUsagePending(true); setQuery(nextQuery); }} />
    <SettingsPanel title="Catégories Mails" description="Ces catégories sont centralisées et modifiables.">
      <div className="grid gap-2 sm:grid-cols-2">{[...ai.categories].sort((a, b) => a.order - b.order).map((category) => <label key={category.id} className="flex items-center gap-3 rounded-xl border border-[var(--app-border)] p-3"><input type="checkbox" checked={category.active} onChange={(event) => updateSettings((draft) => { const target = draft.ai.categories.find((item) => item.id === category.id); if (target) target.active = event.target.checked; }, "Catégorie IA modifiée")} /><input className={inputClass} value={category.label} onChange={(event) => updateSettings((draft) => { const target = draft.ai.categories.find((item) => item.id === category.id); if (target) target.label = event.target.value; }, "Libellé de catégorie IA modifié")} /></label>)}</div>
    </SettingsPanel>
  </div>;
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) { return <label className="flex items-center gap-2 rounded-xl border border-[var(--app-border)] p-3 text-sm"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />{label}</label>; }
function StateCard({ title, value }: { title: string; value: string }) { return <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"><strong>{title}</strong><p className="mt-1 text-xs">{value}</p></div>; }
function NumberField({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (value: string) => void }) { return <Field label={label}><input className={inputClass} type="number" min={min} max={max} value={value} onChange={(event) => onChange(event.target.value)} /></Field>; }
