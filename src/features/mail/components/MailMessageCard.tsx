"use client";

import { MailAiPanel } from "@/features/ai/components/MailAiPanel";
import { MailAttachments } from "@/features/mail/components/MailAttachments";
import { mailProviderLabels } from "@/features/mail/components/mail-account-presentation";
import { MAIL_CATEGORY_PRESENTATION, MAIL_PRIORITY_PRESENTATION } from "@/features/mail/config/mail-workspace-presentation";
import type { MailAccount, MailMessage } from "@/features/mail/types/mail";
import type { MailManagementAction } from "@/features/mail-management/types/mail-management";

export function MailMessageCard({ account, message, isOpen, replyRequested, selected, canManage, pending, undoActivityId, onSelect, onManage, onUndo, onOpen, onPrepareReply, onCreateAction, onIgnore, onNotice }: {
  account: MailAccount;
  message: MailMessage;
  isOpen: boolean;
  replyRequested: boolean;
  selected: boolean;
  canManage: boolean;
  pending: boolean;
  undoActivityId?: string;
  onSelect: () => void;
  onManage: (action: MailManagementAction) => void;
  onUndo: (activityId: string) => void;
  onOpen: () => void;
  onPrepareReply: () => void;
  onCreateAction: () => void;
  onIgnore: () => void;
  onNotice: (tone: "success" | "error" | "information", message: string) => void;
}) {
  const category = MAIL_CATEGORY_PRESENTATION[message.category];
  const priority = MAIL_PRIORITY_PRESENTATION[message.priority];
  const isCompact = account.settings.displayDensity === "compact";
  const hasRightPane = isOpen && account.settings.readingPanePosition === "right";
  return <article className={`rounded-3xl border border-[#dce5e0] bg-white shadow-[0_12px_35px_rgba(29,64,50,0.055)] ${isCompact ? "p-4" : "p-5 sm:p-6"} ${hasRightPane ? "xl:grid xl:grid-cols-[minmax(0,1fr)_minmax(22rem,0.8fr)] xl:gap-6" : ""}`}>
    <div className="flex flex-col gap-5 xl:grid xl:grid-cols-[minmax(0,1fr)_auto] xl:items-start">
      <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><label className="inline-flex items-center gap-2 text-xs font-semibold text-[#40554b]"><input type="checkbox" checked={selected} onChange={onSelect} className="size-4 accent-[#195c45]" /><span className="sr-only">Sélectionner {message.subject}</span></label><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${category.className}`}>{category.label}</span><span className="text-xs font-medium text-[#7a8982]">{mailProviderLabels[account.provider]} · {account.displayName}</span>{!message.isRead ? <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#1d694b]"><span aria-hidden="true" className="size-2 rounded-full bg-[#278a63]" />Nouveau</span> : null}{message.isFlagged ? <span className="text-xs font-semibold text-amber-700">Avec indicateur</span> : null}</div>
        <div className="mt-4 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4"><p className="truncate text-sm font-semibold text-[#33473e]">{message.from.name ?? message.from.email}</p><time dateTime={message.receivedAt} className="shrink-0 text-xs text-[#7b8982]">{formatMessageDate(message.receivedAt, account)}</time></div>
        <h2 className="mt-2 text-lg font-semibold tracking-[-0.02em] text-[#17211d]">{message.subject}</h2>
        {account.settings.previewPaneEnabled ? <p className="mt-3 text-sm leading-6 text-[#5f7068]">{message.summary}</p> : null}
        <p className="mt-3 text-xs font-semibold uppercase tracking-[0.08em] text-[#7a8982]">Priorité <span className={`ml-1 ${priority.className}`}>{priority.label}</span></p>
        <div className="mt-4 rounded-xl bg-[#f4f7f5] px-4 py-3 text-sm text-[#465b51]"><strong className="font-semibold text-[#263b32]">Action proposée :</strong> {message.proposedAction}</div>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap xl:max-w-[480px] xl:justify-end"><ActionButton label={isOpen ? "Fermer" : "Ouvrir"} onClick={onOpen} /><ActionButton label="À traiter" onClick={() => onManage("to_process")} disabled={!canManage || pending} /><ActionButton label="En attente" onClick={() => onManage("waiting")} disabled={!canManage || pending} /><ActionButton label="Traité" onClick={() => onManage("processed")} disabled={!canManage || pending} /><ActionButton label={message.isArchived ? "Restaurer" : "Archiver"} onClick={() => onManage(message.isArchived ? "restore" : "archive")} disabled={!canManage || pending} /><ActionButton label={message.isRead ? "Non lu" : "Lu"} onClick={() => onManage(message.isRead ? "mark_unread" : "mark_read")} disabled={!canManage || pending} />{undoActivityId ? <ActionButton label="Annuler la dernière action" onClick={() => onUndo(undoActivityId)} disabled={pending} /> : null}<ActionButton label="Proposer une réponse" onClick={onPrepareReply} primary /><ActionButton label="Créer une action" onClick={onCreateAction} /><ActionButton label="Masquer localement" onClick={onIgnore} muted /></div>
    </div>
    {isOpen ? <div className={`mt-5 border-t border-[#e8eeeb] pt-5 ${hasRightPane ? "xl:mt-0 xl:border-l xl:border-t-0 xl:pl-6 xl:pt-0" : ""}`}><p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#819087]">Message original</p><p className="mt-3 max-w-4xl whitespace-pre-line text-sm leading-7 text-[#4f6259]">{message.bodyText}</p><MailAttachments attachments={message.attachments} /><MailAiPanel account={account} message={message} replyRequested={replyRequested} onNotice={onNotice} /></div> : null}
  </article>;
}

function ActionButton({ label, onClick, primary = false, muted = false, disabled = false }: { label: string; onClick: () => void; primary?: boolean; muted?: boolean; disabled?: boolean }) { const color = primary ? "border-[#195c45] bg-[#195c45] text-white hover:bg-[#104432]" : muted ? "border-transparent bg-transparent text-[#7b8982] hover:bg-[#f3f5f4]" : "border-[#cbd7d1] bg-white text-[#40554b] hover:bg-[#f5f8f6]"; return <button type="button" disabled={disabled} onClick={onClick} className={`min-h-10 rounded-xl border px-3 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#195c45] disabled:cursor-not-allowed disabled:opacity-40 sm:text-sm ${color}`}>{label}</button>; }
function formatMessageDate(value: string, account: MailAccount): string { const year = account.settings.dateFormat === "dd/MM/yy" ? "2-digit" : "numeric"; return new Intl.DateTimeFormat("fr-BE", { day: "2-digit", month: "2-digit", year, hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Europe/Brussels" }).format(new Date(value)).replace(",", " à"); }
