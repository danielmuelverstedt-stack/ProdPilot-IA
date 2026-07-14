"use client";

import { useMemo, useState } from "react";
import { MailDialog } from "@/features/mail/components/MailDialog";
import type { MailAiConfiguration, MailAiReply, MailAiRewriteCommand } from "@/features/ai/types/mail-ai";
import type { MailAccount, MailMessage } from "@/features/mail/types/mail";

interface OperationResponse { result?: MailAiReply; mode?: "openai" | "deterministic"; configurationMessage?: string; message?: string }

export function MailAiReplyEditor({ account, message, configuration, onNotice }: {
  account: MailAccount;
  message: MailMessage;
  configuration: MailAiConfiguration;
  onNotice: (tone: "success" | "error" | "information", message: string) => void;
}) {
  const [reply, setReply] = useState<MailAiReply | null>(null);
  const [history, setHistory] = useState<MailAiReply[]>([]);
  const [instructions, setInstructions] = useState("");
  const [pending, setPending] = useState<"generate" | "rewrite" | "draft" | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [manuallyEdited, setManuallyEdited] = useState(false);
  const subject = useMemo(() => message.subject.toLocaleLowerCase("fr").startsWith("re:") ? message.subject : `Re: ${message.subject}`, [message.subject]);

  async function generate() {
    if (manuallyEdited && reply && !window.confirm("La génération remplacera vos modifications manuelles. Continuer ?")) return;
    setPending("generate");
    try {
      const value = await postAi("/api/ai/mail/reply", { messageId: message.id, configuration, instructions, intent: account.settings.replyBehavior, tone: configuration.defaultTone, length: configuration.defaultLength });
      if (reply) setHistory((current) => [...current, reply].slice(-10));
      setReply(value.result);
      setManuallyEdited(false);
      if (value.configurationMessage) onNotice("information", value.configurationMessage);
    } catch (error) { onNotice("error", getMessage(error)); }
    finally { setPending(null); }
  }

  async function rewrite(command: MailAiRewriteCommand) {
    if (!reply) return;
    setPending("rewrite");
    try {
      const value = await postAi("/api/ai/mail/rewrite", { messageId: message.id, configuration, currentReply: reply, command, instructions, tone: reply.tone, length: configuration.defaultLength });
      setHistory((current) => [...current, reply].slice(-10));
      setReply(value.result);
      setManuallyEdited(false);
      if (value.configurationMessage) onNotice("information", value.configurationMessage);
    } catch (error) { onNotice("error", getMessage(error)); }
    finally { setPending(null); }
  }

  function edit(field: "recipients" | "cc" | "bcc" | "subject" | "bodyText", value: string) {
    if (!reply) return;
    setManuallyEdited(true);
    setReply({ ...reply, [field]: field === "recipients" || field === "cc" || field === "bcc" ? splitEmails(value) : value });
  }

  async function createDraft() {
    if (!reply || !confirmed) return;
    setPending("draft");
    try {
      const response = await fetch("/api/mail/drafts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ confirmed: true, to: reply.recipients, cc: reply.cc, bcc: reply.bcc, subject: reply.subject, bodyText: reply.bodyText, replyToMessageId: message.id, replyToThreadId: message.threadId }) });
      const value = await response.json() as { draft?: { id: string }; message?: string };
      if (!response.ok || !value.draft) throw new Error(value.message ?? "Le brouillon n’a pas pu être créé.");
      setConfirmOpen(false);
      setConfirmed(false);
      onNotice("success", "Le brouillon Gmail a été créé. Aucun e-mail n’a été envoyé.");
    } catch (error) { onNotice("error", getMessage(error)); }
    finally { setPending(null); }
  }

  return <section className="mt-5 rounded-2xl border border-[#d7e4de] bg-[#f7faf8] p-4 sm:p-5">
    <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold text-[#263b32]">Réponse assistée</h3><span className="text-xs text-[#75847d]">Aucun appel pendant la saisie</span></div>
    {!reply ? <><p className="mt-2 text-sm text-[#5d6e66]">La réponse n’est générée qu’après votre clic.</p><button type="button" disabled={pending !== null} onClick={() => void generate()} className={primaryClass}>{pending === "generate" ? "Génération…" : "Générer la réponse"}</button></> : <div className="mt-4 space-y-3">
      <Field label="À"><input value={reply.recipients.join(", ")} onChange={(event) => edit("recipients", event.target.value)} className={inputClass} /></Field>
      <div className="grid gap-3 sm:grid-cols-2"><Field label="Cc"><input value={reply.cc.join(", ")} onChange={(event) => edit("cc", event.target.value)} className={inputClass} /></Field><Field label="Cci"><input value={reply.bcc.join(", ")} onChange={(event) => edit("bcc", event.target.value)} className={inputClass} /></Field></div>
      <Field label="Objet"><input value={reply.subject || subject} onChange={(event) => edit("subject", event.target.value)} className={inputClass} /></Field>
      <Field label="Contenu"><textarea value={reply.bodyText} onChange={(event) => edit("bodyText", event.target.value)} className={`${inputClass} min-h-48 resize-y leading-6`} /></Field>
      <div className="flex flex-wrap gap-2">{rewriteActions.map(([command, label]) => <button key={command} type="button" disabled={pending !== null} onClick={() => void rewrite(command)} className={secondaryClass}>{label}</button>)}</div>
      <Field label="Instruction personnalisée"><input maxLength={500} value={instructions} onChange={(event) => setInstructions(event.target.value)} placeholder="Ex. : préciser que la livraison est prévue jeudi" className={inputClass} /></Field>
      <div className="flex flex-wrap gap-2"><button type="button" disabled={!instructions.trim() || pending !== null} onClick={() => void rewrite("custom")} className={secondaryClass}>{pending === "rewrite" ? "Modification…" : "Appliquer la modification"}</button>{history.length ? <button type="button" onClick={() => { const previous = history.at(-1); if (previous) { setReply(previous); setHistory((current) => current.slice(0, -1)); } }} className={secondaryClass}>Annuler la dernière version</button> : null}</div>
      <p className="text-xs text-[#75847d]">Source : {reply.provider === "openai" ? "OpenAI" : "Règles déterministes"} · Modifications {manuallyEdited ? "manuelles" : "assistées"}</p>
      {configuration.allowDraftCreation && account.mode === "oauth" ? <button type="button" disabled={!configuration.privacyAcknowledged || pending !== null || !reply.bodyText.trim()} onClick={() => setConfirmOpen(true)} className={primaryClass}>Vérifier et créer le brouillon Gmail</button> : account.mode === "demo" ? <p className="rounded-lg bg-white p-3 text-xs text-[#75847d]">Mode démonstration : aucun brouillon externe ne sera créé.</p> : null}
    </div>}
    <MailDialog open={confirmOpen} title="Confirmer la création du brouillon" description="Cette action crée un brouillon Gmail, sans envoyer le message." onClose={() => { setConfirmOpen(false); setConfirmed(false); }}>
      {reply ? <div className="space-y-4 text-sm"><dl className="grid gap-2"><div><dt className="font-semibold">Compte actif</dt><dd>{account.emailAddress}</dd></div><div><dt className="font-semibold">Destinataires</dt><dd>{reply.recipients.join(", ")}</dd></div>{reply.cc.length ? <div><dt className="font-semibold">Cc</dt><dd>{reply.cc.join(", ")}</dd></div> : null}<div><dt className="font-semibold">Objet</dt><dd>{reply.subject}</dd></div><div><dt className="font-semibold">Fil Gmail</dt><dd>{message.threadId}</dd></div></dl><div className="max-h-64 overflow-y-auto whitespace-pre-wrap rounded-xl border bg-slate-50 p-3">{reply.bodyText}</div><label className="flex items-start gap-2"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} className="mt-1" /><span>J’ai vérifié le compte, les destinataires, l’objet et le contenu. Je confirme uniquement la création du brouillon. Aucun e-mail ne sera envoyé.</span></label><button type="button" disabled={!confirmed || pending !== null} onClick={() => void createDraft()} className={primaryClass}>{pending === "draft" ? "Création…" : "Créer le brouillon Gmail"}</button></div> : null}
    </MailDialog>
  </section>;
}

async function postAi(url: string, body: unknown): Promise<{ result: MailAiReply; mode: "openai" | "deterministic"; configurationMessage?: string }> {
  const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const value = await response.json() as OperationResponse;
  if (!response.ok || !value.result || !value.mode) throw new Error(value.message ?? "L’opération IA a échoué.");
  return { result: value.result, mode: value.mode, configurationMessage: value.configurationMessage };
}
function splitEmails(value: string) { return value.split(/[;,]/).map((item) => item.trim()).filter(Boolean); }
function getMessage(error: unknown) { return error instanceof Error ? error.message : "L’opération a échoué."; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block text-xs font-semibold text-[#5d6e66]">{label}<span className="mt-1 block">{children}</span></label>; }
const inputClass = "min-h-10 w-full rounded-xl border border-[#cad7d1] bg-white px-3 py-2 text-sm text-[#34483f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#195c45]";
const primaryClass = "mt-3 min-h-10 rounded-xl bg-[#195c45] px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45";
const secondaryClass = "min-h-9 rounded-xl border border-[#cbd7d1] bg-white px-3 text-xs font-semibold text-[#40554b] disabled:opacity-45";
const rewriteActions: Array<[MailAiRewriteCommand, string]> = [["shorter", "Plus court"], ["more_diplomatic", "Plus diplomatique"], ["more_direct", "Plus direct"], ["more_professional", "Plus professionnel"], ["simplify", "Simplifier"]];
