"use client";

import { useEffect, useState } from "react";
import { buttonClass, inputClass, SettingsPanel } from "@/features/settings/components/SettingsUi";
import type { MailAutomationRule } from "@/features/mail-management/types/mail-management";

export function MailAutomationRulesPanel() {
  const [rules, setRules] = useState<MailAutomationRule[]>([]);
  const [notice, setNotice] = useState("Chargement des règles…");
  const [name, setName] = useState("");
  const [value, setValue] = useState("");
  const [kind, setKind] = useState<MailAutomationRule["condition"]["kind"]>("sender_domain");
  const [action, setAction] = useState<MailAutomationRule["action"]>("keep_to_process");

  useEffect(() => { void requestRules().then((result) => { setRules(result); setNotice(""); }).catch((error: unknown) => setNotice(error instanceof Error ? error.message : "Les règles n’ont pas pu être chargées.")); }, []);

  async function addRule() {
    if (!window.confirm("Ajouter et activer cette règle permanente de classement pour le compte actif ?")) return;
    const response = await fetch("/api/mail/management/rules", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ operation: "add", name, condition: { kind, value }, action, priority: 50, isActive: true }) });
    const result = await response.json() as { rule?: MailAutomationRule; message?: string };
    if (!response.ok || !result.rule) { setNotice(result.message ?? "La règle n’a pas pu être ajoutée."); return; }
    setRules((current) => [...current, result.rule!]); setName(""); setValue(""); setNotice("La règle a été ajoutée après votre confirmation.");
  }

  async function toggle(rule: MailAutomationRule) {
    const response = await fetch("/api/mail/management/rules", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ operation: "toggle", id: rule.id, isActive: !rule.isActive }) });
    const result = await response.json() as { rule?: MailAutomationRule; message?: string };
    if (!response.ok || !result.rule) { setNotice(result.message ?? "La règle n’a pas pu être modifiée."); return; }
    setRules((current) => current.map((item) => item.id === result.rule!.id ? result.rule! : item));
  }

  return <SettingsPanel title="Mails · Règles de classement" description="Ces règles sont visibles et isolées par compte. Une proposition IA n’est jamais activée automatiquement.">
    {notice ? <p role="status" className="mb-4 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">{notice}</p> : null}
    <div className="space-y-3">{rules.map((rule) => <div key={rule.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-[var(--app-border)] p-3"><input aria-label={`${rule.isActive ? "Désactiver" : "Activer"} la règle ${rule.name}`} type="checkbox" checked={rule.isActive} onChange={() => void toggle(rule)} /><div className="min-w-0 flex-1"><p className="font-semibold">{rule.name}</p><p className="text-xs text-slate-500">{conditionLabels[rule.condition.kind]} : {rule.condition.value} · {actionLabels[rule.action]} · priorité {rule.priority}</p>{rule.lastUsedAt ? <p className="text-xs text-slate-500">Dernière utilisation : {formatDate(rule.lastUsedAt)}</p> : null}</div><span className="text-xs">{rule.origin === "user" ? "Utilisateur" : "Proposition IA"}</span></div>)}</div>
    <div className="mt-5 grid gap-3 md:grid-cols-2"><Field label="Nom" value={name} onChange={setName}/><label className="text-sm font-medium">Condition<select className={`${inputClass} mt-1`} value={kind} onChange={(event) => setKind(event.target.value as typeof kind)}><option value="sender_domain">Domaine expéditeur</option><option value="sender">Expéditeur exact</option><option value="subject_contains">Objet contient</option><option value="newsletter">Newsletter</option></select></label><Field label="Valeur" value={value} onChange={setValue}/><label className="text-sm font-medium">Action<select className={`${inputClass} mt-1`} value={action} onChange={(event) => setAction(event.target.value as typeof action)}><option value="keep_to_process">Toujours à traiter</option><option value="archive">Autoriser l’archivage automatique</option><option value="mark_waiting">Mettre en attente</option></select></label></div>
    <button type="button" disabled={!name.trim() || !value.trim()} onClick={() => void addRule()} className={`${buttonClass} mt-4 disabled:opacity-40`}>Ajouter et activer la règle</button>
  </SettingsPanel>;
}

async function requestRules(): Promise<MailAutomationRule[]> { const response = await fetch("/api/mail/management/rules", { cache: "no-store" }); const result = await response.json() as { rules?: MailAutomationRule[]; message?: string }; if (!response.ok || !result.rules) throw new Error(result.message ?? "Les règles n’ont pas pu être chargées."); return result.rules; }
function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="text-sm font-medium">{label}<input className={`${inputClass} mt-1`} value={value} onChange={(event) => onChange(event.target.value)} /></label>; }
const conditionLabels: Record<MailAutomationRule["condition"]["kind"], string> = { sender_domain: "Domaine expéditeur", sender: "Expéditeur", subject_contains: "Objet contient", newsletter: "Newsletter" };
const actionLabels: Record<MailAutomationRule["action"], string> = { keep_to_process: "Toujours à traiter", archive: "Autoriser l’archivage proposé", mark_waiting: "Proposer En attente" };
function formatDate(value: string): string { return new Intl.DateTimeFormat("fr-BE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(value)); }
