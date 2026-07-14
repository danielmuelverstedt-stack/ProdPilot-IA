"use client";

import { useEffect, useState } from "react";
import { useSettings } from "@/features/settings/components/SettingsProvider";
import { Field, inputClass, SettingsPanel } from "@/features/settings/components/SettingsUi";

interface AiStatusResponse {
  status: { mode: "openai" | "deterministic"; configured: boolean; model: string; message?: string };
  models: { analysis: string; reply: string; rewrite: string };
  usage: { requestsToday: number; inputTokens: number; cachedInputTokens: number; outputTokens: number; totalTokens: number; localCacheHits: number; cacheHitPercentage: number; errors: number; lastSuccessfulCallAt: string | null; lastSafeErrorCategory: string | null };
  cache: { operational: boolean; type: string };
}

export function AiSettingsPanel() {
  const { settings, updateSettings } = useSettings();
  const [diagnostics, setDiagnostics] = useState<AiStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    fetch("/api/ai/mail/status", { cache: "no-store" }).then(async (response) => {
      if (!response.ok) throw new Error();
      return response.json() as Promise<AiStatusResponse>;
    }).then((result) => { if (active) setDiagnostics(result); }).catch(() => { if (active) setError("Les diagnostics IA sont indisponibles."); });
    return () => { active = false; };
  }, []);
  const ai = settings.ai;
  const updateNumber = (key: "maximumThreadMessages" | "maximumInputContextTokens" | "maximumAnalysisOutputTokens" | "maximumReplyOutputTokens" | "maximumRewriteOutputTokens" | "analysisExpirationMinutes" | "dailyRequestWarning" | "dailyHardLimit" | "longThreadWarningThreshold", value: string, minimum: number, maximum: number) => updateSettings((draft) => { draft.ai[key] = Math.min(maximum, Math.max(minimum, Number(value) || minimum)); }, "Coûts et performances IA modifiés");

  return <div className="space-y-5">
    <SettingsPanel title="Intelligence artificielle" description="Les clés et modèles restent dans la configuration serveur. Un appel IA exige toujours une action explicite.">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Check label="Activer l’assistance IA" checked={ai.enabled} onChange={(value) => updateSettings((draft) => { draft.ai.enabled = value; }, "Assistance IA modifiée")} />
        <Check label="Inclure la signature" checked={ai.includeSignature} onChange={(value) => updateSettings((draft) => { draft.ai.includeSignature = value; }, "Signature IA modifiée")} />
        <Check label="Inclure les métadonnées de pièces jointes" checked={ai.includeAttachmentMetadata} onChange={(value) => updateSettings((draft) => { draft.ai.includeAttachmentMetadata = value; }, "Métadonnées IA modifiées")} />
        <Check label="Afficher la confiance" checked={ai.displayConfidence} onChange={(value) => updateSettings((draft) => { draft.ai.displayConfidence = value; }, "Confiance IA modifiée")} />
        <Check label="Afficher la justification" checked={ai.displayJustification} onChange={(value) => updateSettings((draft) => { draft.ai.displayJustification = value; }, "Justification IA modifiée")} />
        <Check label="Autoriser la création de brouillons" checked={ai.allowDraftCreation} onChange={(value) => updateSettings((draft) => { draft.ai.allowDraftCreation = value; }, "Brouillons IA modifiés")} />
        <Check label="Réutiliser les analyses en cache" checked={ai.retainLocalAnalysisCache} onChange={(value) => updateSettings((draft) => { draft.ai.retainLocalAnalysisCache = value; }, "Cache IA modifié")} />
        <Check label="Afficher le badge de cache" checked={ai.showCachedResultBadge} onChange={(value) => updateSettings((draft) => { draft.ai.showCachedResultBadge = value; }, "Badge de cache modifié")} />
        <Check label="Afficher l’usage des jetons" checked={ai.showTokenUsage} onChange={(value) => updateSettings((draft) => { draft.ai.showTokenUsage = value; }, "Usage des jetons modifié")} />
        <StateCard title="Analyse automatique" value="Désactivée de force" />
        <StateCard title="Envoi automatique" value="Désactivé de force" />
        <StateCard title="Escalade vers un modèle fort" value={ai.allowStrongerModelEscalation ? "Autorisée mais non automatique" : "Désactivée"} />
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Langue"><select className={inputClass} value={ai.preferredResponseLanguage} onChange={(event) => updateSettings((draft) => { draft.ai.preferredResponseLanguage = event.target.value as typeof ai.preferredResponseLanguage; }, "Langue IA modifiée")}><option value="fr">Français</option><option value="nl">Néerlandais</option><option value="en">Anglais</option><option value="de">Allemand</option></select></Field>
        <Field label="Ton par défaut"><select className={inputClass} value={ai.defaultTone} onChange={(event) => updateSettings((draft) => { draft.ai.defaultTone = event.target.value as typeof ai.defaultTone; }, "Ton IA modifié")}><option value="professional">Professionnel</option><option value="concise">Court</option><option value="diplomatic">Diplomatique</option><option value="direct">Direct</option><option value="technical">Technique</option><option value="internal">Interne</option><option value="customer">Client</option><option value="supplier">Fournisseur</option></select></Field>
        <Field label="Longueur"><select className={inputClass} value={ai.defaultLength} onChange={(event) => updateSettings((draft) => { draft.ai.defaultLength = event.target.value as typeof ai.defaultLength; }, "Longueur IA modifiée")}><option value="short">Courte</option><option value="medium">Moyenne</option><option value="long">Longue</option></select></Field>
      </div>
    </SettingsPanel>
    <SettingsPanel title="Coûts et performances" description="Ces limites utilisateur ne peuvent jamais dépasser les plafonds serveur centralisés.">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <NumberField label="Messages récents du fil" value={ai.maximumThreadMessages} min={1} max={20} onChange={(value) => updateNumber("maximumThreadMessages", value, 1, 20)} />
        <NumberField label="Contexte d’entrée maximal (jetons approx.)" value={ai.maximumInputContextTokens} min={500} max={100000} onChange={(value) => updateNumber("maximumInputContextTokens", value, 500, 100000)} />
        <NumberField label="Sortie analyse maximale" value={ai.maximumAnalysisOutputTokens} min={100} max={100000} onChange={(value) => updateNumber("maximumAnalysisOutputTokens", value, 100, 100000)} />
        <NumberField label="Sortie réponse maximale" value={ai.maximumReplyOutputTokens} min={100} max={100000} onChange={(value) => updateNumber("maximumReplyOutputTokens", value, 100, 100000)} />
        <NumberField label="Sortie réécriture maximale" value={ai.maximumRewriteOutputTokens} min={100} max={100000} onChange={(value) => updateNumber("maximumRewriteOutputTokens", value, 100, 100000)} />
        <NumberField label="Expiration du cache (minutes)" value={ai.analysisExpirationMinutes} min={5} max={43200} onChange={(value) => updateNumber("analysisExpirationMinutes", value, 5, 43200)} />
        <NumberField label="Avertissement quotidien" value={ai.dailyRequestWarning} min={1} max={100000} onChange={(value) => updateNumber("dailyRequestWarning", value, 1, 100000)} />
        <NumberField label="Limite quotidienne stricte" value={ai.dailyHardLimit} min={1} max={100000} onChange={(value) => updateNumber("dailyHardLimit", value, 1, 100000)} />
        <NumberField label="Alerte fil long (jetons approx.)" value={ai.longThreadWarningThreshold} min={500} max={100000} onChange={(value) => updateNumber("longThreadWarningThreshold", value, 500, 100000)} />
      </div>
      <p className="mt-4 text-xs text-slate-500">Les modèles d’analyse, réponse et réécriture sont configurés côté serveur par variables d’environnement. Aucune clé API n’est exposée ici.</p>
    </SettingsPanel>
    <SettingsPanel title="Catégories Mails" description="Ces catégories sont centralisées et modifiables.">
      <div className="grid gap-2 sm:grid-cols-2">{[...ai.categories].sort((a, b) => a.order - b.order).map((category) => <label key={category.id} className="flex items-center gap-3 rounded-xl border border-[var(--app-border)] p-3"><input type="checkbox" checked={category.active} onChange={(event) => updateSettings((draft) => { const target = draft.ai.categories.find((item) => item.id === category.id); if (target) target.active = event.target.checked; }, "Catégorie IA modifiée")} /><input className={inputClass} value={category.label} onChange={(event) => updateSettings((draft) => { const target = draft.ai.categories.find((item) => item.id === category.id); if (target) target.label = event.target.value; }, "Libellé de catégorie IA modifié")} /></label>)}</div>
    </SettingsPanel>
    <SettingsPanel title="Utilisation et diagnostics" description="Aucun corps d’e-mail, prompt, secret ou jeton OAuth n’est enregistré dans ces métriques.">
      {error ? <p className="text-sm text-red-700">{error}</p> : diagnostics ? <><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Metric label="Fournisseur" value={diagnostics.status.mode === "openai" ? "OpenAI configuré" : "Mode déterministe"} /><Metric label="Requêtes aujourd’hui" value={String(diagnostics.usage.requestsToday)} /><Metric label="Jetons d’entrée" value={String(diagnostics.usage.inputTokens)} /><Metric label="Jetons mis en cache" value={String(diagnostics.usage.cachedInputTokens)} /><Metric label="Jetons de sortie" value={String(diagnostics.usage.outputTokens)} /><Metric label="Analyses locales réutilisées" value={String(diagnostics.usage.localCacheHits)} /><Metric label="Taux de cache local" value={`${diagnostics.usage.cacheHitPercentage} %`} /><Metric label="Erreurs" value={String(diagnostics.usage.errors)} /></div><dl className="mt-5 grid gap-2 text-sm"><div><dt className="font-semibold">Modèles configurés</dt><dd>{diagnostics.models.analysis} · {diagnostics.models.reply} · {diagnostics.models.rewrite}</dd></div><div><dt className="font-semibold">Cache</dt><dd>{diagnostics.cache.operational ? "Opérationnel pour le développement local" : "Stockage durable requis en production"}</dd></div><div><dt className="font-semibold">Dernier succès</dt><dd>{diagnostics.usage.lastSuccessfulCallAt ? formatDate(diagnostics.usage.lastSuccessfulCallAt) : "Aucun"}</dd></div><div><dt className="font-semibold">Dernière erreur sûre</dt><dd>{diagnostics.usage.lastSafeErrorCategory ?? "Aucune"}</dd></div><div><dt className="font-semibold">Estimation financière</dt><dd>Estimation financière non configurée</dd></div></dl></> : <p className="text-sm text-slate-500">Chargement des diagnostics…</p>}
    </SettingsPanel>
  </div>;
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) { return <label className="flex items-center gap-2 rounded-xl border border-[var(--app-border)] p-3 text-sm"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />{label}</label>; }
function StateCard({ title, value }: { title: string; value: string }) { return <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"><strong>{title}</strong><p className="mt-1 text-xs">{value}</p></div>; }
function NumberField({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (value: string) => void }) { return <Field label={label}><input className={inputClass} type="number" min={min} max={max} value={value} onChange={(event) => onChange(event.target.value)} /></Field>; }
function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-1 font-semibold">{value}</p></div>; }
function formatDate(value: string) { return new Intl.DateTimeFormat("fr-BE", { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Brussels" }).format(new Date(value)); }
