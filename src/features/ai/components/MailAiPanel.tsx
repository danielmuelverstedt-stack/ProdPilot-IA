"use client";

import { useMemo, useState } from "react";
import { MailAiAnalysisView } from "@/features/ai/components/MailAiAnalysisView";
import { MailAiBudgetNotice } from "@/features/ai/components/MailAiBudgetNotice";
import { MailAiReplyEditor } from "@/features/ai/components/MailAiReplyEditor";
import { createMailAiConfiguration } from "@/features/ai/components/mail-ai-client-config";
import type { MailAiAnalysis } from "@/features/ai/types/mail-ai";
import { useSettings } from "@/features/settings/components/SettingsProvider";
import type { MailAccount, MailMessage } from "@/features/mail/types/mail";

interface AnalysisResponse {
  result?: MailAiAnalysis;
  mode?: "openai" | "deterministic";
  configurationMessage?: string;
  context?: { wasTruncated: boolean; estimatedInputTokens: number; fieldsTransferred: string[]; attachmentMetadataCount: number; notes: string[] };
  message?: string;
}

export function MailAiPanel({ account, message, replyRequested, onNotice }: {
  account: MailAccount;
  message: MailMessage;
  replyRequested: boolean;
  onNotice: (tone: "success" | "error" | "information", message: string) => void;
}) {
  const { settings, updateSettings } = useSettings();
  const [analysis, setAnalysis] = useState<MailAiAnalysis | null>(null);
  const [context, setContext] = useState<AnalysisResponse["context"]>(undefined);
  const [pending, setPending] = useState(false);
  const [privacyChecked, setPrivacyChecked] = useState(Boolean(settings.ai.privacyAcknowledgedAt));
  const configuration = useMemo(() => createMailAiConfiguration(settings, account), [account, settings]);

  async function analyze(forceRefresh: boolean) {
    if (pending || !settings.ai.enabled) return;
    if (!configuration.privacyAcknowledged) {
      if (!privacyChecked) { onNotice("error", "Confirmez d’abord l’information de confidentialité IA."); return; }
      updateSettings((draft) => { draft.ai.privacyAcknowledgedAt = new Date().toISOString(); }, "Information de confidentialité IA acceptée");
    }
    setPending(true);
    try {
      const payload = { messageId: message.id, configuration: { ...configuration, privacyAcknowledged: configuration.privacyAcknowledged || privacyChecked }, forceRefresh };
      let response = await requestAnalysis(payload, false);
      if (response.httpStatus === 428) {
        const confirmed = window.confirm(`${response.value.message ?? "Ce fil est volumineux."}\n\nContinuer avec le contexte réduit ?`);
        if (!confirmed) return;
        response = await requestAnalysis(payload, true);
      }
      const value = response.value;
      if (response.httpStatus >= 400 || !value.result) throw new Error(value.message ?? "L’analyse IA a échoué.");
      setAnalysis(value.result);
      setContext(value.context);
      if (value.configurationMessage) onNotice("information", value.configurationMessage);
    } catch (error) { onNotice("error", error instanceof Error ? error.message : "L’analyse IA a échoué."); }
    finally { setPending(false); }
  }

  if (!settings.ai.enabled) return <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">L’assistance IA est désactivée dans Réglages → IA.</p>;
  return <section aria-label="Assistance IA pour le message" className="mt-5 border-t border-[#e8eeeb] pt-5">
    <MailAiBudgetNotice />
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" disabled={pending} onClick={() => void analyze(false)} className="min-h-10 rounded-xl bg-[#195c45] px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45">{pending ? "Analyse…" : analysis ? "Afficher l’analyse en cache" : "Analyser avec l’IA"}</button>
      {analysis ? <button type="button" disabled={pending} onClick={() => void analyze(true)} className="min-h-10 rounded-xl border border-[#cbd7d1] bg-white px-3 text-sm font-semibold text-[#40554b] disabled:opacity-45">Actualiser explicitement</button> : null}
    </div>
    {!configuration.privacyAcknowledged ? <label className="mt-3 flex max-w-3xl items-start gap-2 rounded-xl bg-blue-50 p-3 text-xs leading-5 text-blue-900"><input type="checkbox" checked={privacyChecked} onChange={(event) => setPrivacyChecked(event.target.checked)} className="mt-1" /><span>J’ai compris que seuls le message sélectionné, un contexte récent réduit, les destinataires utiles et les métadonnées de pièces jointes autorisées peuvent être transmis au fournisseur IA. Aucun jeton OAuth ni pièce jointe binaire n’est transmis.</span></label> : null}
    {analysis ? <MailAiAnalysisView analysis={analysis} showConfidence={settings.ai.displayConfidence} showReasoning={settings.ai.displayJustification} showUsage={settings.ai.showTokenUsage} /> : <p className="mt-3 text-xs text-[#75847d]">Aucune analyse automatique : ce bouton déclenche au maximum une requête coordonnée, puis le cache est réutilisé.</p>}
    {context ? <details className="mt-3 text-xs text-[#66776e]"><summary className="cursor-pointer font-semibold">Aperçu sûr des données transférées</summary><p className="mt-2">Catégories : {context.fieldsTransferred.join(", ")} · pièces jointes (métadonnées uniquement) : {context.attachmentMetadataCount} · estimation : {context.estimatedInputTokens} jetons{context.wasTruncated ? " · contexte réduit" : ""}.</p></details> : null}
    {replyRequested ? <MailAiReplyEditor account={account} message={message} configuration={{ ...configuration, privacyAcknowledged: configuration.privacyAcknowledged || privacyChecked }} onNotice={onNotice} /> : null}
  </section>;
}

async function requestAnalysis(payload: object, longContextConfirmed: boolean) {
  const response = await fetch("/api/ai/mail/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payload, longContextConfirmed }) });
  return { httpStatus: response.status, value: await response.json() as AnalysisResponse };
}
