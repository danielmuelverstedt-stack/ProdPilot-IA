"use client";

import { useEffect, useState } from "react";
import { useSettings } from "@/features/settings/components/SettingsProvider";
import { SettingsPanel, inputClass } from "@/features/settings/components/SettingsUi";
import { MailVoiceSettingsPanel } from "@/features/settings/components/MailVoiceSettingsPanel";
import { MailAutomationRulesPanel } from "@/features/settings/components/MailAutomationRulesPanel";

const toggles = [
  ["enabled", "Activer la mémoire locale"], ["indexSynchronizedMails", "Indexer les mails synchronisés"],
  ["storeCleanedMessageText", "Conserver le texte nettoyé"], ["keepSourceLinks", "Conserver les liens sources"],
  ["storeAnalyses", "Conserver les analyses"], ["storeSessionHistory", "Conserver l’historique des sessions"],
  ["storeContactPreferences", "Conserver les préférences confirmées"], ["storeDecisions", "Conserver les décisions confirmées"],
  ["automaticCleanup", "Nettoyage automatique"], ["offlineAccess", "Autoriser l’accès hors ligne"],
  ["showSourceLinks", "Afficher les liens sources"], ["preferLocalResults", "Préférer les résultats locaux"],
  ["askBeforeExpensiveAiCall", "Demander avant un appel IA coûteux"],
] as const;

export function MailMemorySettingsPanel() {
  const { settings, updateSettings } = useSettings();
  const memory = settings.mailMemory;
  const [storage, setStorage] = useState("Calcul en cours…");
  useEffect(() => { void navigator.storage?.estimate().then((estimate) => setStorage(`${formatMb(estimate.usage ?? 0)} utilisés sur ${formatMb(estimate.quota ?? 0)} disponibles`)).catch(() => setStorage("Estimation indisponible")); }, []);
  const update = <K extends keyof typeof memory>(key: K, value: (typeof memory)[K]) => updateSettings((draft) => { draft.mailMemory[key] = value; }, "Mémoire locale modifiée");
  const assistant = settings.mailAssistant;
  const updateAssistant = <K extends keyof typeof assistant>(key: K, value: (typeof assistant)[K]) => updateSettings((draft) => { draft.mailAssistant[key] = value; }, "Démarrage de session Mail modifié");
  return <><SettingsPanel title="Mails · Mémoire locale" description="IndexedDB conserve une mémoire de travail isolée. Gmail reste la source officielle et aucune pièce jointe n’est copiée.">
    <div className="grid gap-3 sm:grid-cols-2">{toggles.map(([key, label]) => <label key={key} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 text-sm"><input type="checkbox" checked={memory[key]} onChange={(event) => update(key, event.target.checked)}/><span>{label}</span></label>)}</div>
    <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <NumberField label="Index Mail (jours)" value={memory.mailRetentionDays} onChange={(value) => update("mailRetentionDays", value)}/><NumberField label="Analyses (jours)" value={memory.analysisRetentionDays} onChange={(value) => update("analysisRetentionDays", value)}/><NumberField label="Sessions (jours)" value={memory.sessionRetentionDays} onChange={(value) => update("sessionRetentionDays", value)}/><NumberField label="Audit (jours)" value={memory.auditRetentionDays} onChange={(value) => update("auditRetentionDays", value)}/><NumberField label="Taille maximale locale (Mo)" value={memory.maximumLocalSizeMb} onChange={(value) => update("maximumLocalSizeMb", value)}/>
      <label className="text-sm font-semibold text-slate-700">Escalade IA<select className={`${inputClass} mt-1`} value={memory.aiEscalationMode} onChange={(event) => update("aiEscalationMode", event.target.value as typeof memory.aiEscalationMode)}><option value="local_first">Toujours local d’abord</option><option value="balanced">Équilibrée</option></select></label>
    </div>
    <p className="mt-5 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">Stockage navigateur : {storage}. IndexedDB n’est pas un stockage multi-utilisateur de production.</p>
  </SettingsPanel><SettingsPanel title="Mails · Assistant · Démarrage de session" description="Brief local-first, restitution vocale native du navigateur et microphone toujours visible.">
    <div className="grid gap-3 sm:grid-cols-2">{[["speakOpeningBrief", "Lire le brief au démarrage"], ["askFollowUpQuestion", "Proposer le détail"], ["autoListenAfterBrief", "Écouter après le brief"], ["includePendingDrafts", "Inclure les brouillons"], ["includeMessagesWithoutStatus", "Inclure les mails sans statut"], ["includeOverdueFollowUps", "Inclure les relances en retard"], ["includeInformationalMessages", "Inclure les informations"], ["replayButtonVisible", "Afficher Réécouter"], ["voiceEnabled", "Activer la voix"]].map(([key, label]) => <label key={key} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 text-sm"><input type="checkbox" checked={Boolean(assistant[key as keyof typeof assistant])} onChange={(event) => updateAssistant(key as keyof typeof assistant, event.target.checked as never)}/>{label}</label>)}</div>
    <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><NumberField label="Éléments lus au maximum" value={assistant.maximumItemsSpoken} onChange={(value) => updateAssistant("maximumItemsSpoken", value)}/><NumberField label="Vitesse × 10" value={Math.round(assistant.speechRate * 10)} onChange={(value) => updateAssistant("speechRate", Math.min(2, value / 10))}/><NumberField label="Volume × 10" value={Math.round(assistant.speechVolume * 10)} onChange={(value) => updateAssistant("speechVolume", Math.min(1, value / 10))}/><label className="text-sm font-semibold text-slate-700">Format<select className={`${inputClass} mt-1`} value={assistant.briefDetail} onChange={(event) => updateAssistant("briefDetail", event.target.value as typeof assistant.briefDetail)}><option value="compact">Compact</option><option value="detailed">Détaillé</option></select></label><label className="text-sm font-semibold text-slate-700">Comportement du micro<select className={`${inputClass} mt-1`} value={assistant.listeningBehavior} onChange={(event) => updateAssistant("listeningBehavior", event.target.value as typeof assistant.listeningBehavior)}><option value="manual">Microphone manuel</option><option value="push_to_talk">Appuyer pour parler</option><option value="auto_after_speaking">Écouter après la lecture</option></select></label><label className="text-sm font-semibold text-slate-700">Langue<input className={`${inputClass} mt-1`} value={assistant.preferredLanguage} onChange={(event) => updateAssistant("preferredLanguage", event.target.value)}/></label><label className="text-sm font-semibold text-slate-700">Voix préférée<input className={`${inputClass} mt-1`} value={assistant.preferredVoiceName} placeholder="Voix système par défaut" onChange={(event) => updateAssistant("preferredVoiceName", event.target.value)}/></label></div>
    <div className="mt-5"><p className="text-sm font-semibold text-slate-700">Libellés des statuts Mail</p><div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{assistant.workflowStatuses.slice().sort((a, b) => a.order - b.order).map((status) => <label key={status.id} className="text-xs text-slate-500">{status.id}<input className={`${inputClass} mt-1`} value={status.label} onChange={(event) => updateAssistant("workflowStatuses", assistant.workflowStatuses.map((item) => item.id === status.id ? { ...item, label: event.target.value } : item))}/></label>)}</div></div>
  </SettingsPanel><MailAutomationRulesPanel/><MailVoiceSettingsPanel/></>;
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) { return <label className="text-sm font-semibold text-slate-700">{label}<input className={`${inputClass} mt-1`} type="number" min={1} value={value} onChange={(event) => onChange(Math.max(1, Number(event.target.value)))}/></label>; }
function formatMb(bytes: number): string { return `${new Intl.NumberFormat("fr-BE", { maximumFractionDigits: 1 }).format(bytes / 1_048_576)} Mo`; }
