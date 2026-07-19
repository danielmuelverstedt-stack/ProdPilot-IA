"use client";

import { useMemo, useState } from "react";
import { MailMessageCard } from "@/features/mail/components/MailMessageCard";
import { MailToolbar } from "@/features/mail/components/MailToolbar";
import { mailProviderLabels } from "@/features/mail/components/mail-account-presentation";
import { getDefaultMailSearchCriteria, searchMailMessages } from "@/features/mail/services/mail-search";
import { MailActivityPanel } from "@/features/mail-management/components/MailActivityPanel";
import { MailManagementBar } from "@/features/mail-management/components/MailManagementBar";
import { MailMigrationPreview } from "@/features/mail-management/components/MailMigrationPreview";
import { isMailVisibleInWorkflowView } from "@/features/mail-management/services/mail-workflow";
import type { MailActivityEntry, MailManagementAction, MailManagementResult, MailProviderLabel, MailWorkflowView } from "@/features/mail-management/types/mail-management";
import type { MailAccount, MailMessage, MailSearchCriteria, MailSynchronizationSummary } from "@/features/mail/types/mail";

interface MailWorkspaceProps {
  initialMessages: MailMessage[];
  initialSynchronization: MailSynchronizationSummary | null;
  account: MailAccount;
  canModifyMail: boolean;
  initialLabels: MailProviderLabel[];
  initialActivity: MailActivityEntry[];
}

type Notice = { tone: "success" | "error" | "information"; message: string; activityId?: string };

export function MailWorkspace({ initialMessages, initialSynchronization, account, canModifyMail, initialLabels, initialActivity }: MailWorkspaceProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [synchronization, setSynchronization] = useState(initialSynchronization);
  const [labels, setLabels] = useState(initialLabels);
  const [activity, setActivity] = useState(initialActivity);
  const [activeView, setActiveView] = useState<MailWorkflowView>("to_process");
  const [criteria, setCriteria] = useState<MailSearchCriteria>({ ...getDefaultMailSearchCriteria(account.settings), category: undefined });
  const [openedMessageId, setOpenedMessageId] = useState<string | null>(null);
  const [replyMessageId, setReplyMessageId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [notice, setNotice] = useState<Notice | null>(null);
  const [pending, setPending] = useState(false);

  const searchedMessages = useMemo(() => searchMailMessages(messages, { ...criteria, category: undefined, provider: account.provider, accountId: account.id }), [account.id, account.provider, criteria, messages]);
  const filteredMessages = useMemo(() => searchedMessages.filter((message) => isMailVisibleInWorkflowView(message, activeView, labels)), [activeView, labels, searchedMessages]);
  const counts = useMemo(() => buildCounts(searchedMessages, labels), [labels, searchedMessages]);

  async function bootstrapLabels() {
    setPending(true);
    try {
      const response = await fetch("/api/mail/management", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ operation: "bootstrap" }) });
      const result = await response.json() as { labels?: MailProviderLabel[]; message?: string };
      if (!response.ok || !result.labels) throw new Error(result.message ?? "Les libellés ProdPilot n’ont pas pu être créés.");
      setLabels(result.labels);
      setNotice({ tone: "success", message: "Les quatre libellés ProdPilot sont disponibles dans Gmail." });
    } catch (error) { showError(error); } finally { setPending(false); }
  }

  async function execute(action: MailManagementAction, ids: string[], target: "message" | "thread" = "message", source: "user" | "ai" = "user", ai?: { reason: string; confidence: number }) {
    if (!ids.length || !canModifyMail) return;
    if (needsDialog(action, ids.length) && !window.confirm(confirmMessage(action, ids.length))) return;
    setPending(true);
    try {
      const response = await fetch("/api/mail/management", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ operation: "execute", action, messageIds: ids, target, confirmed: true, source, reason: ai?.reason, aiConfidence: ai?.confidence }) });
      const payload = await response.json() as { result?: MailManagementResult; message?: string };
      if (!response.ok || !payload.result) throw new Error(payload.message ?? "Gmail n’a pas confirmé l’action.");
      mergeMessages(payload.result.messages);
      setSelectedIds(new Set());
      setNotice({ tone: "success", message: payload.result.notice, activityId: payload.result.activityId });
      await refreshActivity();
    } catch (error) { showError(error); await refreshActivity().catch(() => undefined); } finally { setPending(false); }
  }

  async function undo(activityId: string) {
    setPending(true);
    try {
      const response = await fetch("/api/mail/management", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ operation: "undo", activityId }) });
      const payload = await response.json() as { result?: MailManagementResult; message?: string };
      if (!response.ok || !payload.result) throw new Error(payload.message ?? "L’action n’a pas pu être annulée.");
      mergeMessages(payload.result.messages);
      setNotice({ tone: "success", message: payload.result.notice });
      await refreshActivity();
    } catch (error) { showError(error); } finally { setPending(false); }
  }

  async function refreshActivity() {
    const response = await fetch("/api/mail/management", { cache: "no-store" });
    const result = await response.json() as { activity?: MailActivityEntry[]; labels?: MailProviderLabel[] };
    if (result.activity) setActivity(result.activity);
    if (result.labels) setLabels(result.labels);
  }

  async function refreshMessages() {
    setPending(true);
    try {
      const response = await fetch("/api/mail/messages?all=true&refresh=true", { cache: "no-store" });
      const result = await response.json() as { messages?: MailMessage[]; synchronization?: MailSynchronizationSummary; message?: string };
      if (!response.ok || !result.messages) throw new Error(result.message ?? "La synchronisation Gmail n’a pas abouti.");
      setMessages(result.messages);
      setSynchronization(result.synchronization ?? null);
      setSelectedIds(new Set());
      setNotice({ tone: "success", message: `${result.messages.length} messages de la boîte de réception ont été synchronisés.` });
    } catch (error) { showError(error); } finally { setPending(false); }
  }

  function mergeMessages(updated: MailMessage[]) {
    setMessages((current) => {
      const byId = new Map(current.map((message) => [message.id, message]));
      updated.forEach((message) => byId.set(message.id, message));
      return [...byId.values()].sort((first, second) => Date.parse(second.receivedAt) - Date.parse(first.receivedAt));
    });
  }

  function toggleSelection(messageId: string) {
    setSelectedIds((current) => { const next = new Set(current); if (next.has(messageId)) next.delete(messageId); else next.add(messageId); return next; });
  }

  function resetFilters() { setCriteria({ ...getDefaultMailSearchCriteria(account.settings), category: undefined }); setActiveView("to_process"); }
  function showError(error: unknown) { setNotice({ tone: "error", message: error instanceof Error ? error.message : "Une erreur inattendue est survenue." }); }

  return <section aria-label="Espace de travail des mails" className="mt-8 space-y-4">
    <div className="flex flex-col gap-3 rounded-2xl border border-[#d7e4de] bg-[#f7faf8] px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"><div><p><strong className="text-[#263b32]">Compte actif :</strong> {account.displayName} · {account.emailAddress}</p><p className="mt-1 text-xs text-[#64736c]">{synchronization ? `${synchronization.synchronizedMessages} sur ${synchronization.detectedMessages ?? "?"} messages · ${synchronization.isComplete ? "synchronisation complète" : "synchronisation incomplète"} · ${synchronization.durationMs} ms${synchronization.cache === "hit" ? " · cache" : ""}` : "Synchronisation non mesurée"}</p></div><div className="flex flex-wrap items-center gap-2"><span className="w-fit rounded-full bg-[#eef1ff] px-2.5 py-1 text-xs font-semibold text-[#575d9b]">{mailProviderLabels[account.provider]} · {account.mode === "demo" ? "Mode démonstration" : "Connecté"}</span><button type="button" disabled={pending} onClick={() => void refreshMessages()} className="min-h-9 rounded-lg border border-[#cbd7d1] bg-white px-3 text-xs font-semibold disabled:opacity-40">Actualiser</button></div></div>
    {!canModifyMail ? <div role="alert" className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900"><p className="font-semibold">Une nouvelle autorisation Google est nécessaire pour classer et archiver les mails.</p><a href={`/api/auth/google?accountId=${encodeURIComponent(account.id)}`} className="mt-3 inline-flex min-h-10 items-center rounded-xl bg-amber-900 px-4 font-semibold text-white">Reconnecter Google</a></div> : labels.length < 4 ? <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900"><p>Initialisez les libellés ProdPilot avant le premier classement.</p><button type="button" disabled={pending} onClick={() => void bootstrapLabels()} className="mt-3 min-h-10 rounded-xl bg-blue-800 px-4 font-semibold text-white disabled:opacity-40">Créer les libellés dans Gmail</button></div> : null}
    <MailManagementBar activeView={activeView} counts={counts} selectedCount={selectedIds.size} pending={pending || !canModifyMail} onView={(view) => { setActiveView(view); setSelectedIds(new Set()); }} onSelectAll={() => setSelectedIds(new Set(filteredMessages.map((message) => message.id)))} onAction={(action) => void execute(action, [...selectedIds])} />
    <MailToolbar criteria={criteria} onChange={setCriteria} onReset={resetFilters} />
    <div aria-live="polite">{notice ? <p role={notice.tone === "error" ? "alert" : "status"} className={`rounded-xl border px-4 py-3 text-sm ${noticeClass[notice.tone]}`}>{notice.message}{notice.activityId ? <button type="button" disabled={pending} onClick={() => void undo(notice.activityId!)} className="ml-3 font-bold underline">Annuler</button> : null}</p> : null}</div>
    <div className="grid gap-4">{filteredMessages.length ? filteredMessages.map((message) => <MailMessageCard key={message.id} account={account} message={message} selected={selectedIds.has(message.id)} canManage={canModifyMail} pending={pending} undoActivityId={activity.find((entry) => entry.canUndo && entry.messageIds.includes(message.id))?.id} isOpen={openedMessageId === message.id} replyRequested={replyMessageId === message.id} onSelect={() => toggleSelection(message.id)} onManage={(action) => void execute(action, [message.id], ["to_process", "waiting", "processed", "archive", "restore"].includes(action) ? "thread" : "message")} onUndo={(id) => void undo(id)} onOpen={() => { setOpenedMessageId((current) => current === message.id ? null : message.id); setReplyMessageId(null); }} onPrepareReply={() => { setOpenedMessageId(message.id); setReplyMessageId(message.id); setNotice({ tone: "information", message: "L’éditeur est prêt. La génération ne commencera qu’après votre clic explicite." }); }} onCreateAction={() => setNotice({ tone: "information", message: `Action simulée préparée à partir de « ${message.subject} ».` })} onIgnore={() => { setMessages((current) => current.filter((item) => item.id !== message.id)); setNotice({ tone: "information", message: `Le message « ${message.subject} » est masqué uniquement dans cette vue.` }); }} onNotice={(tone, message) => setNotice({ tone, message })} />) : <div className="rounded-3xl border border-dashed border-[#cbd8d2] bg-white/70 px-6 py-14 text-center"><h2 className="text-lg font-semibold text-[#263b32]">Aucun mail dans cette vue</h2><p className="mt-2 text-sm text-[#64736c]">Modifiez les filtres ou choisissez un autre état.</p></div>}</div>
    <MailMigrationPreview messages={searchedMessages} pending={pending || !canModifyMail} onApply={(action, ids, source, ai) => void execute(action, ids, "message", source, ai)} />
    <MailActivityPanel entries={activity} pending={pending} onUndo={(id) => void undo(id)} />
  </section>;
}

function buildCounts(messages: MailMessage[], labels: MailProviderLabel[]): Record<MailWorkflowView, { total: number; unread: number }> {
  const views: MailWorkflowView[] = ["all", "new", "to_process", "waiting", "processed", "ai_archived"];
  return Object.fromEntries(views.map((view) => { const matching = messages.filter((message) => isMailVisibleInWorkflowView(message, view, labels)); return [view, { total: matching.length, unread: matching.filter((message) => !message.isRead).length }]; })) as Record<MailWorkflowView, { total: number; unread: number }>;
}

function needsDialog(action: MailManagementAction, count: number): boolean { return count > 1 || ["waiting", "processed", "archive", "restore"].includes(action); }
function confirmMessage(action: MailManagementAction, count: number): string { const labels: Record<MailManagementAction, string> = { to_process: "classer dans À traiter", waiting: "mettre en attente et retirer de la boîte principale", processed: "marquer comme traité et archiver", archive: "archiver", restore: "restaurer", mark_read: "marquer comme lu", mark_unread: "marquer comme non lu" }; return `Confirmer : ${labels[action]} ${count === 1 ? "ce mail" : `${count} mails`} ?`; }
const noticeClass: Record<Notice["tone"], string> = { success: "border-[#b9dccc] bg-[#edf8f3] text-[#1d694b]", information: "border-blue-200 bg-blue-50 text-blue-800", error: "border-red-200 bg-red-50 text-red-800" };
