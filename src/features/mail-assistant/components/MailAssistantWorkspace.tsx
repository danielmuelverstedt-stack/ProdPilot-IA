"use client";

import { useCallback, useMemo, useState } from "react";
import { MailAssistantVoiceInput } from "@/features/mail-assistant/components/MailAssistantVoiceInput";
import { MAIL_ASSISTANT_GROUP_LABELS } from "@/features/mail-assistant/config/mail-assistant-defaults";
import type { MailAssistantSession } from "@/features/mail-assistant/types/mail-assistant";

export function MailAssistantWorkspace() {
  const [session, setSession] = useState<MailAssistantSession | null>(null);
  const [input, setInput] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const grouped = useMemo(() => session ? Object.entries(MAIL_ASSISTANT_GROUP_LABELS).map(([id, label]) => ({ id, label, messages: session.messages.filter((message) => (message.processed ? "processed" : message.classification.group) === id && !message.ignored) })).filter((group) => group.messages.length) : [], [session]);

  async function startSession() {
    setIsBusy(true); setError(null);
    try { const response = await fetch("/api/mail/assistant/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }); const payload = await readResponse(response); setSession(payload.session); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "La session n’a pas pu démarrer."); }
    finally { setIsBusy(false); }
  }
  async function sendCommand() {
    if (!session || !input.trim() || isBusy) return;
    setIsBusy(true); setError(null);
    try { const response = await fetch("/api/mail/assistant/command", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId: session.id, text: input.trim() }) }); const payload = await readResponse(response); setSession(payload.session); setInput(""); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "La commande n’a pas pu être exécutée."); }
    finally { setIsBusy(false); }
  }
  const handleTranscript = useCallback((value: string) => setInput(value), []);

  if (!session) return <section className="mt-8 rounded-3xl border border-[#d7e4de] bg-white p-6 shadow-sm sm:p-8" aria-labelledby="mail-session-start"><p className="text-sm font-semibold text-[#247052]">Assistant quotidien</p><h2 id="mail-session-start" className="mt-2 text-2xl font-semibold">Commencez par synchroniser et trier vos nouveaux messages</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">Aucune analyse n’est lancée au chargement. Le démarrage est explicite et utilise d’abord le cache et les règles locales.</p><button type="button" disabled={isBusy} onClick={startSession} className="mt-6 min-h-12 rounded-xl bg-[#195c45] px-5 font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#195c45] disabled:opacity-60">{isBusy ? "Démarrage…" : "Démarrer ma session mails"}</button>{error ? <p role="alert" className="mt-4 text-sm text-red-700">{error}</p> : null}</section>;

  return <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
    <main className="min-w-0 rounded-3xl border border-slate-200 bg-white shadow-sm" aria-label="Conversation avec l’assistant mails">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4"><div><p className="font-semibold">{session.account.displayName}</p><p className="text-xs text-slate-500">{session.account.emailAddress}</p></div><span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-800">{session.account.mode === "demo" ? "Mode démonstration" : "Compte connecté"}</span></header>
      <div className="max-h-[56vh] space-y-3 overflow-y-auto p-4" aria-live="polite">{session.conversation.map((entry) => <article key={entry.id} className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-6 ${entry.role === "user" ? "ml-auto bg-[#195c45] text-white" : "bg-slate-100 text-slate-800"}`}><p className="whitespace-pre-wrap">{entry.text}</p></article>)}</div>
      {session.status !== "finished" ? <div className="border-t border-slate-200 p-4"><label htmlFor="mail-assistant-command" className="text-sm font-semibold">Votre instruction</label><textarea id="mail-assistant-command" value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void sendCommand(); } }} rows={3} placeholder="Ex. Pour le deuxième, fais plus diplomatique." className="mt-2 w-full resize-y rounded-xl border border-slate-300 p-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#195c45]"/><div className="mt-3 flex flex-wrap items-center justify-between gap-3"><MailAssistantVoiceInput disabled={isBusy} onTranscript={handleTranscript}/><button type="button" disabled={isBusy || !input.trim()} onClick={sendCommand} className="min-h-11 rounded-xl bg-[#195c45] px-5 text-sm font-semibold text-white disabled:opacity-50">{isBusy ? "Traitement…" : "Envoyer l’instruction"}</button></div>{error ? <p role="alert" className="mt-3 text-sm text-red-700">{error}</p> : null}</div> : null}
    </main>
    <aside className="space-y-4" aria-label="Messages et propositions de la session">
      <section className="rounded-2xl border border-slate-200 bg-white p-4"><h2 className="font-semibold">Messages référencés</h2><div className="mt-3 space-y-4">{grouped.map((group) => <div key={group.id}><h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">{group.label}</h3><ul className="mt-2 space-y-2">{group.messages.map((message) => <li key={message.id} className="rounded-xl bg-slate-50 p-3 text-sm"><p className="font-semibold">{message.sessionNumber}. {message.from.name ?? message.from.email}</p><p className="mt-1 line-clamp-2 text-xs text-slate-600">{message.subject}</p><details className="mt-2 text-xs"><summary className="cursor-pointer font-semibold">Pourquoi ce classement ?</summary><p className="mt-1 text-slate-600">{message.classification.reason} Confiance : {Math.round(message.classification.confidence * 100)} %.</p></details></li>)}</ul></div>)}</div></section>
      <section className="rounded-2xl border border-slate-200 bg-white p-4"><h2 className="font-semibold">Propositions en attente</h2><div className="mt-3 space-y-3">{session.replies.map((reply) => { const message = session.messages.find((item) => item.id === reply.messageId); return <article key={reply.messageId} className="rounded-xl border border-slate-200 p-3 text-xs"><p className="font-semibold">{message?.sessionNumber}. {message?.subject}</p><p className="mt-2 whitespace-pre-wrap text-slate-700">{reply.versions[reply.currentVersion].bodyText}</p><p className="mt-2 font-semibold text-[#195c45]">{reply.status === "draft_created" ? "Brouillon créé" : "À valider"}</p></article>; })}</div></section>
    </aside>
  </div>;
}

async function readResponse(response: Response): Promise<{ session: MailAssistantSession }> { const payload = await response.json() as { session?: MailAssistantSession; message?: string }; if (!response.ok || !payload.session) throw new Error(payload.message ?? "Une erreur inattendue est survenue."); return { session: payload.session }; }
