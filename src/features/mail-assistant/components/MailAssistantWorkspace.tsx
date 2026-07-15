"use client";

import { useState } from "react";
import { MailAssistantInput } from "@/features/mail-assistant/components/MailAssistantInput";
import { MailDecisionList } from "@/features/mail-assistant/components/MailDecisionList";
import { MailNoActionGroup } from "@/features/mail-assistant/components/MailNoActionGroup";
import { MailOriginalMessageDrawer } from "@/features/mail-assistant/components/MailOriginalMessageDrawer";
import { MailSessionBrief } from "@/features/mail-assistant/components/MailSessionBrief";
import { MailSessionCompletion } from "@/features/mail-assistant/components/MailSessionCompletion";
import { MailSessionLoading } from "@/features/mail-assistant/components/MailSessionLoading";
import { MailSessionShell } from "@/features/mail-assistant/components/MailSessionShell";
import { MailSessionStart } from "@/features/mail-assistant/components/MailSessionStart";
import { useSettings } from "@/features/settings/components/SettingsProvider";
import { persistMailAssistantSession } from "@/features/mail-memory/services/mail-memory-service";
import type { MailMemoryContext } from "@/features/mail-memory/types/mail-memory";
import type { MailProviderType } from "@/features/mail/types/mail";
import { createMailSourceLink, resolveSourceLink } from "@/features/mail-memory/services/source-link-resolver";
import { executeLocalMemoryCommand } from "@/features/mail-memory/services/mail-memory-command-service";
import { randomLocalId } from "@/features/mail-memory/services/random-local-id";
import type { SourceLink } from "@/features/mail-memory/types/mail-memory";
import type { MailAssistantSession } from "@/features/mail-assistant/types/mail-assistant";

interface InitialAccount { id: string; provider: MailProviderType; displayName: string; emailAddress: string; mode: "demo" | "oauth"; organizationId: string | null; lastSyncAt: string | null }
const LOADING_PHASES = ["Synchronisation de la boîte mail…", "Analyse des nouveaux messages…", "Identification des réponses nécessaires…", "Préparation des propositions…", "Session prête."];

export function MailAssistantWorkspace({ initialAccount }: { initialAccount: InitialAccount }) {
  const { settings } = useSettings();
  const user = settings.users.find((item) => item.active) ?? settings.users[0];
  const [session, setSession] = useState<MailAssistantSession | null>(null);
  const [screen, setScreen] = useState<"start" | "loading" | "session">("start");
  const [loadingStatus, setLoadingStatus] = useState(LOADING_PHASES[0]);
  const [view, setView] = useState<"summary" | "focused">("focused");
  const [activeIndex, setActiveIndex] = useState(0);
  const [input, setInput] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [originalId, setOriginalId] = useState<string | null>(null);
  const [memoryNotice, setMemoryNotice] = useState<string | null>(null);
  const [memorySources, setMemorySources] = useState<SourceLink[]>([]);
  const memoryContext: MailMemoryContext = { accountId: initialAccount.id, provider: initialAccount.provider, userId: user?.id ?? "local-user", companyId: initialAccount.organizationId ?? "local-company", mode: initialAccount.mode };

  async function remember(nextSession: MailAssistantSession) {
    try { await persistMailAssistantSession(nextSession, memoryContext, settings.mailMemory, initialAccount.emailAddress); setMemoryNotice(null); }
    catch { setMemoryNotice("La session continue, mais la mémoire locale n’a pas pu être mise à jour."); }
  }

  async function startSession() {
    setScreen("loading"); setIsBusy(true); setError(null); setLoadingStatus(LOADING_PHASES[0]);
    try {
      const response = await fetch("/api/mail/assistant/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      const payload = await readResponse(response);
      for (const phase of LOADING_PHASES.slice(1)) { setLoadingStatus(phase); await pause(240); }
      setSession(payload.session); await remember(payload.session); setScreen("session");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "La session n’a pas pu démarrer."); setScreen("start"); }
    finally { setIsBusy(false); }
  }
  async function executeCommand(text = input) {
    if (!session || !text.trim() || isBusy) return;
    setIsBusy(true); setError(null);
    try {
      const local = settings.mailMemory.enabled && settings.mailMemory.preferLocalResults ? await executeLocalMemoryCommand(text.trim(), session, memoryContext) : { handled: false };
      if (local.handled) {
        const now = new Date().toISOString(); const next = { ...session, conversation: [...session.conversation, { id: randomLocalId("user"), role: "user" as const, text: text.trim(), createdAt: now }, { id: randomLocalId("assistant"), role: "assistant" as const, text: local.text ?? "", createdAt: now }] };
        setSession(next); setMemorySources(local.sourceLinks ?? []); await remember(next); setInput(""); return;
      }
      const response = await fetch("/api/mail/assistant/command", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId: session.id, text: text.trim() }) }); const payload = await readResponse(response); setSession(payload.session); setMemorySources([]); await remember(payload.session); setInput("");
    }
    catch (caught) { setError(caught instanceof Error ? caught.message : "La commande n’a pas pu être exécutée."); }
    finally { setIsBusy(false); }
  }
  const firstName = user?.firstName ?? "Daniel";
  if (screen === "start") return <MailSessionShell accountLabel={initialAccount.emailAddress}><MailSessionStart firstName={firstName} account={`${initialAccount.displayName} · ${initialAccount.emailAddress}`} isDemo={initialAccount.mode === "demo"} isBusy={isBusy} error={error} onStart={startSession}/></MailSessionShell>;
  if (screen === "loading") return <MailSessionShell accountLabel={initialAccount.emailAddress} progress="Analyse en cours"><MailSessionLoading status={loadingStatus}/></MailSessionShell>;
  if (!session) return null;
  if (session.status === "finished") return <MailSessionShell accountLabel={session.account.emailAddress} progress="Session terminée"><MailSessionCompletion session={session} onResume={() => setSession({ ...session, status: "ready", endedAt: null })}/></MailSessionShell>;

  const decisions = session.messages.filter((message) => (message.classification.requiresReply || message.classification.suggestsAction || message.classification.group === "review") && !message.ignored);
  const originalMessage = session.messages.find((message) => message.id === originalId) ?? null;
  const originalSource = originalMessage ? resolveSourceLink(createMailSourceLink(memoryContext, { externalId: originalMessage.id, parentExternalId: originalMessage.threadId, displayName: originalMessage.subject, sourceType: "mail", accountEmail: initialAccount.emailAddress })) : null;
  return <MailSessionShell accountLabel={session.account.emailAddress} progress={`${Math.min(activeIndex + 1, Math.max(decisions.length, 1))} sur ${Math.max(decisions.length, 1)}`}>
    <div className="mx-auto max-w-3xl px-4 pb-6 sm:px-6">
      <MailSessionBrief firstName={firstName} session={session}/>
      <div className="mt-10 flex justify-center rounded-xl bg-black/[0.035] p-1 text-sm"><button type="button" aria-pressed={view === "summary"} onClick={() => setView("summary")} className={`min-h-10 rounded-lg px-4 font-semibold ${view === "summary" ? "bg-white shadow-sm" : "text-slate-500"}`}>Vue synthèse</button><button type="button" aria-pressed={view === "focused"} onClick={() => setView("focused")} className={`min-h-10 rounded-lg px-4 font-semibold ${view === "focused" ? "bg-white shadow-sm" : "text-slate-500"}`}>Un par un</button></div>
      <MailDecisionList session={session} view={view} activeIndex={activeIndex} onActiveIndex={setActiveIndex} onCommand={(text) => void executeCommand(text)} onOpenOriginal={setOriginalId}/>
      <MailNoActionGroup session={session} onCommand={(text) => void executeCommand(text)}/>
      {memoryNotice ? <p role="status" className="mt-5 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">{memoryNotice}</p> : null}
      <div className="mt-8 space-y-2" aria-live="polite">{session.conversation.slice(1).map((entry) => <div key={entry.id} className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-6 ${entry.role === "user" ? "ml-auto bg-[#1f5f49] text-white" : "bg-[#edf3ef] text-[#30443a]"}`}>{entry.text}</div>)}</div>
      {memorySources.length ? <div className="mt-3 rounded-2xl border border-black/[0.06] bg-white p-4 text-sm"><p className="font-semibold text-slate-700">Réponse basée sur {memorySources.length} source{memorySources.length > 1 ? "s" : ""} locale{memorySources.length > 1 ? "s" : ""}</p><div className="mt-2 flex flex-wrap gap-2">{memorySources.map((source) => { const resolved = resolveSourceLink(source); return resolved.href ? <a key={source.id} href={resolved.href} target="_blank" rel="noreferrer" className="rounded-lg border border-black/10 px-3 py-2 font-semibold text-[#1f5f49]">{resolved.label}</a> : null; })}</div></div> : null}
      <button type="button" onClick={() => void executeCommand("Termine la session")} className="mt-8 text-sm font-semibold text-slate-500">Terminer la session</button>
      <MailAssistantInput value={input} isBusy={isBusy} error={error} onChange={setInput} onSend={() => void executeCommand()}/>
    </div>
    <MailOriginalMessageDrawer message={originalMessage} source={originalSource} onClose={() => setOriginalId(null)}/>
  </MailSessionShell>;
}

async function readResponse(response: Response): Promise<{ session: MailAssistantSession }> { const payload = await response.json() as { session?: MailAssistantSession; message?: string }; if (!response.ok || !payload.session) throw new Error(payload.message ?? "Une erreur inattendue est survenue."); return { session: payload.session }; }
function pause(milliseconds: number) { return new Promise((resolve) => setTimeout(resolve, milliseconds)); }
