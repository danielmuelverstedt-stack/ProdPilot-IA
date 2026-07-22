"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MailAssistantInput } from "@/features/mail-assistant/components/MailAssistantInput";
import { MailDecisionList } from "@/features/mail-assistant/components/MailDecisionList";
import { MailNoActionGroup } from "@/features/mail-assistant/components/MailNoActionGroup";
import { MailOriginalMessageDrawer } from "@/features/mail-assistant/components/MailOriginalMessageDrawer";
import { MailSessionCompletion } from "@/features/mail-assistant/components/MailSessionCompletion";
import { MailSessionLoading } from "@/features/mail-assistant/components/MailSessionLoading";
import { MailCommandCenterStandby } from "@/features/mail-assistant/components/MailCommandCenterStandby";
import { MailExecutionTimeline } from "@/features/mail-assistant/components/MailExecutionTimeline";
import { MailAssistantSpeechOutput } from "@/features/mail-assistant/components/MailAssistantSpeechOutput";
import { useSettings } from "@/features/settings/components/SettingsProvider";
import { createMailAiConfiguration } from "@/features/ai/components/mail-ai-client-config";
import { getBrowserMailMemoryRepository, persistMailAssistantSession } from "@/features/mail-memory/services/mail-memory-service";
import { createMailSessionBrief } from "@/features/mail-assistant/services/mail-session-brief-service";
import { createLocalMailReasoningReport } from "@/features/mail-reasoning/services/local-mail-reasoning-service";
import type { MailReasoningReport } from "@/features/mail-reasoning/types/mail-reasoning";
import type { MailMemoryContext } from "@/features/mail-memory/types/mail-memory";
import type { MailAccount } from "@/features/mail/types/mail";
import { createMailSourceLink, resolveSourceLink } from "@/features/mail-memory/services/source-link-resolver";
import { executeLocalMemoryCommand } from "@/features/mail-memory/services/mail-memory-command-service";
import { randomLocalId } from "@/features/mail-memory/services/random-local-id";
import { browserTtsProvider } from "@/features/mail-assistant/services/browser-tts-provider";
import { useDemoData } from "@/features/demo/services/demo-repository";
import { createAction } from "@/features/actions/services/action-service";
import { resolveProductionContext } from "@/features/mail-assistant/services/production-context-resolver";
import { MailDraftReviewCard, type ReviewableDraft } from "@/features/mail-assistant/components/MailDraftReviewCard";
import type { SourceLink } from "@/features/mail-memory/types/mail-memory";
import type { MailAssistantSession, MailOpeningBrief } from "@/features/mail-assistant/types/mail-assistant";
import type { MailTemplateSettings } from "@/features/settings/types/settings";

const LOADING_PHASES = ["Synchronisation de la boîte mail…", "Analyse des nouveaux messages…", "Identification des réponses nécessaires…", "Préparation des propositions…", "Session prête."];

export function MailAssistantWorkspace({ initialAccount }: { initialAccount: MailAccount }) {
  const { settings } = useSettings();
  const user = settings.users.find((item) => item.active) ?? settings.users[0];
  const [session, setSession] = useState<MailAssistantSession | null>(null);
  const [screen, setScreen] = useState<"standby" | "loading" | "session">("standby");
  const [brief, setBrief] = useState<MailOpeningBrief | null>(null);
  const [reasoning, setReasoning] = useState<MailReasoningReport | null>(null);
  const [autoListenToken, setAutoListenToken] = useState(0);
  const [loadingStatus, setLoadingStatus] = useState(LOADING_PHASES[0]);
  const [view, setView] = useState<"summary" | "focused">("focused");
  const [activeIndex, setActiveIndex] = useState(0);
  const [input, setInput] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [originalId, setOriginalId] = useState<string | null>(null);
  const [memoryNotice, setMemoryNotice] = useState<string | null>(null);
  const [memorySources, setMemorySources] = useState<SourceLink[]>([]);
  const activeRequest = useRef<AbortController | null>(null);
  const appliedActionDraftIds = useRef<Set<string>>(new Set());
  const handoffRef = useRef<string | null>(null);
  const handoffCheckedRef = useRef(false);
  const demoData = useDemoData();
  const firstName = user?.firstName ?? "Daniel";
  const memoryContext = useMemo<MailMemoryContext>(() => ({ accountId: initialAccount.id, provider: initialAccount.provider, userId: user?.id ?? "local-user", companyId: initialAccount.organizationId ?? "local-company", mode: initialAccount.mode }), [initialAccount.id, initialAccount.mode, initialAccount.organizationId, initialAccount.provider, user?.id]);
  useEffect(() => { const timer = window.setTimeout(() => { const repository = getBrowserMailMemoryRepository(); void Promise.all([createMailSessionBrief({ repository, context: memoryContext, session: null, firstName, isDemo: initialAccount.mode === "demo", lastSyncAt: initialAccount.lastSuccessfulSyncAt, synchronizationAvailable: true, settings: settings.mailAssistant }), createLocalMailReasoningReport({ repository, context: memoryContext })]).then(([nextBrief, nextReasoning]) => { setBrief(nextBrief); setReasoning(nextReasoning); }).catch(() => undefined); }, 0); return () => window.clearTimeout(timer); }, [firstName, initialAccount.lastSuccessfulSyncAt, initialAccount.mode, memoryContext, settings.mailAssistant]);

  useEffect(() => {
    if (!handoffCheckedRef.current) {
      handoffCheckedRef.current = true;
      const stored = window.sessionStorage.getItem("prodpilot.mail-assistant.handoff");
      if (stored) { handoffRef.current = stored; window.sessionStorage.removeItem("prodpilot.mail-assistant.handoff"); }
    }
    if (handoffRef.current && screen === "standby") void startSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- startSession is redefined every render; the ref guards above make re-invocation harmless.
  }, [screen]);

  useEffect(() => {
    if (!handoffRef.current || !session || screen !== "session" || isBusy) return;
    const text = handoffRef.current;
    handoffRef.current = null;
    void executeCommand(text);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- executeCommand is redefined every render; the ref guard above prevents double-sending.
  }, [session, screen, isBusy]);

  useEffect(() => {
    if (!session) return;
    for (const draft of session.pendingActionDrafts ?? []) {
      if (appliedActionDraftIds.current.has(draft.id)) continue;
      appliedActionDraftIds.current.add(draft.id);
      const alreadyExists = demoData.actions.some((action) => action.contextLink?.module === "mail" && action.contextLink.id === draft.messageId && action.description === draft.description);
      if (alreadyExists) continue;
      createAction({ description: draft.description, responsable: draft.responsable, echeance: draft.echeance, origine: "Mail", introduitPar: `${firstName} ${user?.lastName ?? ""}`.trim(), contextLink: { module: "mail", id: draft.messageId, label: draft.messageId, href: "/mails" } });
    }
  }, [session, demoData.actions, firstName, user?.lastName]);

  async function remember(nextSession: MailAssistantSession) {
    try { const repository = getBrowserMailMemoryRepository(); await persistMailAssistantSession(nextSession, memoryContext, settings.mailMemory, initialAccount.emailAddress); setReasoning(await createLocalMailReasoningReport({ repository, context: memoryContext })); setMemoryNotice(null); }
    catch { setMemoryNotice("La session continue, mais la mémoire locale n’a pas pu être mise à jour."); }
  }

  async function startSession() {
    setScreen("loading"); setIsBusy(true); setError(null); setLoadingStatus(LOADING_PHASES[0]);
    try {
      const response = await fetch("/api/mail/assistant/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      const payload = await readResponse(response);
      setLoadingStatus(LOADING_PHASES.at(-1) ?? "Session prête.");
      setSession(payload.session); await remember(payload.session); setBrief(await createMailSessionBrief({ repository: getBrowserMailMemoryRepository(), context: memoryContext, session: payload.session, firstName, isDemo: initialAccount.mode === "demo", lastSyncAt: initialAccount.lastSuccessfulSyncAt, synchronizationAvailable: true, settings: settings.mailAssistant })); setScreen("session");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "La synchronisation n’a pas abouti."); setBrief(await createMailSessionBrief({ repository: getBrowserMailMemoryRepository(), context: memoryContext, session: null, firstName, isDemo: initialAccount.mode === "demo", lastSyncAt: initialAccount.lastSuccessfulSyncAt, synchronizationAvailable: false, settings: settings.mailAssistant })); setScreen("standby"); }
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
      const controller = new AbortController(); activeRequest.current = controller;
      const productionContext = resolveProductionContext(text, demoData.workOrders);
      const template = matchMailTemplate(text, settings.mailTemplates);
      const response = await fetch("/api/mail/assistant/command", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId: session.id, text: text.trim(), configuration: createMailAiConfiguration(settings, initialAccount), productionContext, template }), signal: controller.signal }); const payload = await readResponse(response); setSession(payload.session); setMemorySources([]); await remember(payload.session); setInput("");
    }
    catch (caught) { if (!(caught instanceof DOMException && caught.name === "AbortError")) setError(caught instanceof Error ? caught.message : "La commande n’a pas pu être exécutée."); }
    finally { activeRequest.current = null; setIsBusy(false); }
  }
  function stopResponse() { activeRequest.current?.abort(); browserTtsProvider.stop(); setIsBusy(false); }
  if (screen === "standby") return <MailCommandCenterStandby firstName={firstName} account={`${initialAccount.displayName} · ${initialAccount.emailAddress}`} brief={brief} reasoning={reasoning} isLoading={isBusy} error={error} settings={settings.mailAssistant} onStart={startSession}/>;
  if (screen === "loading") return <MailSessionLoading status={loadingStatus}/>;
  if (!session) return null;
  if (session.status === "finished") return <MailSessionCompletion session={session} onResume={() => setSession({ ...session, status: "ready", endedAt: null })} onReturn={() => { setSession(null); setScreen("standby"); }}/>;

  const decisions = session.messages.filter((message) => (message.classification.requiresReply || message.classification.suggestsAction || message.classification.group === "review") && !message.ignored);
  const readyDrafts: ReviewableDraft[] = [
    ...(session.composeDrafts ?? []).filter((item) => item.status === "draft_created").map((item) => ({ key: `compose:${item.id}`, draftId: item.draftId, recipient: item.recipientEmail, subject: item.subject, bodyText: item.bodyText })),
    ...session.replies.filter((item) => item.status === "draft_created").map((item) => ({ key: `reply:${item.messageId}`, draftId: item.draftId ?? null, recipient: item.recipients.map((address) => address.name ? `${address.name} <${address.email}>` : address.email).join(", "), subject: item.subject, bodyText: item.versions[item.currentVersion].bodyText })),
  ];
  const originalMessage = session.messages.find((message) => message.id === originalId) ?? null;
  const originalSource = originalMessage ? resolveSourceLink(createMailSourceLink(memoryContext, { externalId: originalMessage.id, parentExternalId: originalMessage.threadId, displayName: originalMessage.subject, sourceType: "mail", accountEmail: initialAccount.emailAddress })) : null;
  return <>
    <div className="mx-auto max-w-6xl"><div className="flex flex-wrap items-end justify-between gap-6"><div><p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--app-primary)]">Travail actif</p><h1 className="mt-3 text-4xl font-semibold tracking-[-0.045em] text-[var(--app-text)] sm:text-6xl">Je m’occupe de vos mails.</h1><p className="mt-3 text-sm text-slate-500">{decisions.length} validations · {session.draftsCreated.length} brouillons · {(session.pendingActionDrafts ?? []).length} actions</p></div>{brief ? <MailAssistantSpeechOutput text={brief.text} settings={settings.mailAssistant} autoPlay onFinished={() => { if (settings.mailAssistant.continuousConversation) setAutoListenToken(Date.now()); }}/>: null}</div>
      <div className="mt-10 flex w-fit rounded-xl bg-slate-100 p-1 text-sm"><button type="button" aria-pressed={view === "summary"} onClick={() => setView("summary")} className={`min-h-10 rounded-lg px-4 font-semibold transition ${view === "summary" ? "bg-white text-[var(--app-text)] shadow-[var(--app-shadow-sm)]" : "text-slate-500"}`}>Vue synthèse</button><button type="button" aria-pressed={view === "focused"} onClick={() => setView("focused")} className={`min-h-10 rounded-lg px-4 font-semibold transition ${view === "focused" ? "bg-white text-[var(--app-text)] shadow-[var(--app-shadow-sm)]" : "text-slate-500"}`}>Un par un</button></div><div className="mt-8 grid gap-14 lg:grid-cols-[minmax(0,1fr)_18rem]"><div>
      <MailDecisionList session={session} view={view} activeIndex={activeIndex} onActiveIndex={setActiveIndex} onCommand={(text) => void executeCommand(text)} onOpenOriginal={setOriginalId}/>
      <MailNoActionGroup session={session} onCommand={(text) => void executeCommand(text)}/>
      </div><aside className="lg:sticky lg:top-24 lg:self-start"><MailExecutionTimeline session={session} isBusy={isBusy}/></aside></div>
      {readyDrafts.map((draft) => <MailDraftReviewCard key={draft.key} draft={draft} sendingEnabled={initialAccount.settings.sendingEnabled} onSent={() => undefined} />)}
      {memoryNotice ? <p role="status" className="mt-5 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">{memoryNotice}</p> : null}
      {settings.mailAssistant.writtenResponseEnabled && session.conversation.at(-1)?.role === "assistant" ? <div aria-live="polite" className="mt-6 max-w-3xl whitespace-pre-wrap rounded-2xl border border-[var(--app-border)] bg-white p-4 text-sm leading-6 text-slate-800 shadow-[var(--app-shadow-sm)]">{session.conversation.at(-1)?.text}</div> : null}
      <details className="mt-10 rounded-2xl border border-[var(--app-border)] bg-slate-50 p-4"><summary className="cursor-pointer text-sm font-semibold text-slate-500">Conversation · secondaire</summary><div className="mt-4 space-y-2" aria-live="polite">{session.conversation.slice(1).map((entry) => <div key={entry.id} className={`max-w-[80%] rounded-xl px-3 py-2 text-xs leading-5 ${entry.role === "user" ? "ml-auto bg-[var(--app-primary)] text-white" : "border border-[var(--app-border)] bg-white text-slate-600"}`}>{entry.text}</div>)}</div></details>
      {session.conversation.length > 1 && session.conversation.at(-1)?.role === "assistant" && settings.mailAssistant.voiceOutputEnabled ? <div className="mt-3"><MailAssistantSpeechOutput text={session.conversation.at(-1)?.text ?? ""} settings={settings.mailAssistant} autoPlay onFinished={() => { if (settings.mailAssistant.continuousConversation && settings.mailAssistant.autoListenAfterBrief) setAutoListenToken(Date.now()); }}/></div> : null}
      {memorySources.length ? <div className="mt-3 rounded-2xl border border-[var(--app-border)] bg-white p-4 text-sm"><p className="font-semibold text-slate-700">Réponse basée sur {memorySources.length} source{memorySources.length > 1 ? "s" : ""} locale{memorySources.length > 1 ? "s" : ""}</p><div className="mt-2 flex flex-wrap gap-2">{memorySources.map((source) => { const resolved = resolveSourceLink(source); return resolved.href ? <a key={source.id} href={resolved.href} target="_blank" rel="noreferrer" className="rounded-lg border border-[var(--app-border)] px-3 py-2 font-semibold text-[var(--app-primary)]">{resolved.label}</a> : null; })}</div></div> : null}
      <button type="button" onClick={() => void executeCommand("Termine la session")} className="mt-8 text-sm font-semibold text-slate-500">Terminer la session</button>
      <MailAssistantInput value={input} isBusy={isBusy} error={error} settings={settings.mailAssistant} autoStartToken={autoListenToken} onChange={setInput} onSend={() => void executeCommand()} onStop={stopResponse} onVoiceSubmit={(text) => void executeCommand(text)}/>
    </div>
    <MailOriginalMessageDrawer message={originalMessage} source={originalSource} onClose={() => setOriginalId(null)}/>
  </>;
}

async function readResponse(response: Response): Promise<{ session: MailAssistantSession }> { const payload = await response.json() as { session?: MailAssistantSession; message?: string }; if (!response.ok || !payload.session) throw new Error(payload.message ?? "Une erreur inattendue est survenue."); return { session: payload.session }; }

function matchMailTemplate(text: string, templates: MailTemplateSettings[]) {
  const normalized = text.toLocaleLowerCase("fr");
  const match = templates.find((item) => item.active && normalized.includes(item.name.toLocaleLowerCase("fr")));
  return match ? { name: match.name, subject: match.subject, body: match.body } : null;
}
