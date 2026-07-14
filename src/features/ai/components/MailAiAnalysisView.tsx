import type { MailAiAnalysis } from "@/features/ai/types/mail-ai";

export function MailAiAnalysisView({ analysis, showConfidence, showReasoning, showUsage }: {
  analysis: MailAiAnalysis;
  showConfidence: boolean;
  showReasoning: boolean;
  showUsage: boolean;
}) {
  return <div className="mt-4 space-y-4 rounded-2xl border border-[#d8e5df] bg-white p-4">
    <div className="flex flex-wrap items-center gap-2">
      <strong className="text-[#263b32]">Analyse IA</strong>
      {analysis.cached ? <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">Résultat en cache</span> : null}
      <span className="rounded-full bg-[#edf8f3] px-2 py-1 text-xs font-semibold text-[#1d694b]">{analysis.category.label}</span>
      <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-800">{analysis.priority.label}</span>
    </div>
    <p className="text-sm leading-6 text-[#40554b]">{analysis.summary.text}</p>
    {showReasoning ? <p className="text-sm text-[#5d6e66]"><strong>Justification :</strong> {analysis.reasoning}</p> : null}
    <p className="text-sm text-[#5d6e66]"><strong>Réponse attendue :</strong> {analysis.requiresReply ? "Oui" : "Non"}</p>
    {analysis.suggestedActions.length ? <div><p className="text-xs font-semibold uppercase tracking-wide text-[#75847d]">Actions suggérées</p><ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[#40554b]">{analysis.suggestedActions.map((action) => <li key={action.id}>{action.label} — {action.description}</li>)}</ul></div> : null}
    {analysis.detectedEntities.length ? <div><p className="text-xs font-semibold uppercase tracking-wide text-[#75847d]">Éléments détectés</p><ul className="mt-2 flex flex-wrap gap-2">{analysis.detectedEntities.map((entity, index) => <li key={`${entity.type}-${index}`} className="rounded-lg bg-slate-50 px-2.5 py-1 text-xs text-slate-700">{entity.label} : {entity.value}</li>)}</ul></div> : null}
    {analysis.missingInformation.length ? <p className="text-xs text-amber-800">Contexte à vérifier : {analysis.missingInformation.join(" · ")}</p> : null}
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#75847d]">
      <span>Générée le {formatDate(analysis.generatedAt)}</span>
      {showConfidence ? <span>Confiance : {confidenceLabel[analysis.confidence]}</span> : null}
      {showUsage && analysis.usage ? <span>Jetons : {analysis.usage.inputTokens ?? "—"} entrée · {analysis.usage.outputTokens ?? "—"} sortie</span> : null}
    </div>
  </div>;
}

const confidenceLabel = { low: "faible", medium: "moyenne", high: "élevée" } as const;
function formatDate(value: string) { return new Intl.DateTimeFormat("fr-BE", { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Brussels" }).format(new Date(value)); }
