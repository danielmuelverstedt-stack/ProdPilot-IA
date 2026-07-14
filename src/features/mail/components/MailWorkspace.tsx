"use client";

import { useMemo, useState } from "react";
import { MailMessageCard } from "@/features/mail/components/MailMessageCard";
import { MailToolbar } from "@/features/mail/components/MailToolbar";
import { mailProviderLabels } from "@/features/mail/components/mail-account-presentation";
import { MAIL_WORKSPACE_VIEWS, type MailWorkspaceView } from "@/features/mail/config/mail-workspace-presentation";
import { getDefaultMailSearchCriteria, searchMailMessages } from "@/features/mail/services/mail-search";
import type { MailAccount, MailMessage, MailSearchCriteria } from "@/features/mail/types/mail";

interface MailWorkspaceProps { initialMessages: MailMessage[]; account: MailAccount }
type Notice = { tone: "success" | "error" | "information"; message: string };

export function MailWorkspace({ initialMessages, account }: MailWorkspaceProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [activeView, setActiveView] = useState<MailWorkspaceView>(getInitialView(account));
  const [criteria, setCriteria] = useState<MailSearchCriteria>({ ...getDefaultMailSearchCriteria(account.settings), category: undefined });
  const [openedMessageId, setOpenedMessageId] = useState<string | null>(null);
  const [replyMessageId, setReplyMessageId] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);

  const filteredMessages = useMemo(() => searchMailMessages(messages, {
    ...criteria,
    category: activeView === "all" ? criteria.category : activeView,
    provider: account.provider,
    accountId: account.id,
  }), [account.id, account.provider, activeView, criteria, messages]);

  function countForView(view: MailWorkspaceView) { return searchMailMessages(messages, { ...criteria, category: view === "all" ? undefined : view }).length; }
  function handleOpen(messageId: string) {
    setOpenedMessageId((current) => current === messageId ? null : messageId);
    setReplyMessageId(null);
    setNotice(null);
  }
  function handlePrepareReply(message: MailMessage) {
    setOpenedMessageId(message.id);
    setReplyMessageId(message.id);
    setNotice({ tone: "information", message: "L’éditeur est prêt. La génération ne commencera qu’après votre clic explicite." });
  }
  function handleIgnore(message: MailMessage) {
    setMessages((current) => current.filter((item) => item.id !== message.id));
    setOpenedMessageId(null);
    setReplyMessageId(null);
    const text = account.mode === "demo" ? `Le message « ${message.subject} » a été ignoré dans cette démonstration.` : `Le message « ${message.subject} » est masqué uniquement dans cette vue. Il n’a pas été modifié chez le fournisseur.`;
    setNotice({ tone: "information", message: text });
  }
  function resetFilters() {
    setCriteria({ ...getDefaultMailSearchCriteria(account.settings), category: undefined });
    setActiveView(getInitialView(account));
  }

  return <section aria-label="Espace de travail des mails" className="mt-8">
    <div className="mb-4 flex flex-col gap-2 rounded-2xl border border-[#d7e4de] bg-[#f7faf8] px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"><p><strong className="text-[#263b32]">Compte actif :</strong> {account.displayName} · {account.emailAddress}</p><span className="w-fit rounded-full bg-[#eef1ff] px-2.5 py-1 text-xs font-semibold text-[#575d9b]">{mailProviderLabels[account.provider]} · {account.mode === "demo" ? "Mode démonstration" : "Connecté"}</span></div>
    <nav aria-label="Catégories de messages" className="mb-4 flex gap-1 overflow-x-auto rounded-2xl border border-[#dce5e0] bg-white p-3 shadow-sm">{MAIL_WORKSPACE_VIEWS.map((view) => <button key={view.id} type="button" aria-pressed={activeView === view.id} onClick={() => setActiveView(view.id)} className={`min-h-10 shrink-0 rounded-xl px-3.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#195c45] ${activeView === view.id ? "bg-[#195c45] text-white" : "text-[#5d6e66] hover:bg-[#f1f5f3]"}`}>{view.label} <span className="ml-1 opacity-70">{countForView(view.id)}</span></button>)}</nav>
    <MailToolbar criteria={criteria} onChange={setCriteria} onReset={resetFilters} />
    <div aria-live="polite">{notice ? <p role={notice.tone === "error" ? "alert" : "status"} className={`mt-4 rounded-xl border px-4 py-3 text-sm ${noticeClass[notice.tone]}`}>{notice.message}</p> : null}</div>
    <div className="mt-5 grid gap-4">{filteredMessages.length ? filteredMessages.map((message) => <MailMessageCard key={message.id} account={account} message={message} isOpen={openedMessageId === message.id} replyRequested={replyMessageId === message.id} onOpen={() => handleOpen(message.id)} onPrepareReply={() => handlePrepareReply(message)} onCreateAction={() => setNotice({ tone: "information", message: `Action simulée préparée à partir de « ${message.subject} ».` })} onIgnore={() => handleIgnore(message)} onNotice={(tone, value) => setNotice({ tone, message: value })} />) : <div className="rounded-3xl border border-dashed border-[#cbd8d2] bg-white/70 px-6 py-14 text-center"><h2 className="text-lg font-semibold text-[#263b32]">Aucun message ne correspond</h2><p className="mt-2 text-sm text-[#64736c]">Modifiez les filtres ou réinitialisez la recherche.</p><button type="button" onClick={resetFilters} className="mt-4 min-h-10 rounded-xl border border-[#cbd7d1] bg-white px-4 text-sm font-semibold">Réinitialiser</button></div>}</div>
  </section>;
}

const noticeClass: Record<Notice["tone"], string> = { success: "border-[#b9dccc] bg-[#edf8f3] text-[#1d694b]", information: "border-blue-200 bg-blue-50 text-blue-800", error: "border-red-200 bg-red-50 text-red-800" };
function getInitialView(account: MailAccount): MailWorkspaceView { return account.settings.defaultFilter === "urgent" || account.settings.defaultFilter === "reply_required" ? account.settings.defaultFilter : "all"; }
