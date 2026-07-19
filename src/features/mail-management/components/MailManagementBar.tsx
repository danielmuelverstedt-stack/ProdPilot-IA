"use client";

import type { MailManagementAction, MailWorkflowView } from "@/features/mail-management/types/mail-management";

const views: readonly { id: MailWorkflowView; label: string }[] = [
  { id: "all", label: "Tous" },
  { id: "new", label: "Nouveaux" },
  { id: "to_process", label: "À traiter" },
  { id: "waiting", label: "En attente" },
  { id: "processed", label: "Traités" },
  { id: "ai_archived", label: "Archivés par IA" },
];

export function MailManagementBar({ activeView, counts, selectedCount, pending, onView, onSelectAll, onAction }: {
  activeView: MailWorkflowView;
  counts: Record<MailWorkflowView, { total: number; unread: number }>;
  selectedCount: number;
  pending: boolean;
  onView: (view: MailWorkflowView) => void;
  onSelectAll: () => void;
  onAction: (action: MailManagementAction) => void;
}) {
  return <div className="space-y-3">
    <nav aria-label="États de traitement des mails" className="flex gap-1 overflow-x-auto rounded-2xl border border-[#dce5e0] bg-white p-3 shadow-sm">
      {views.map((view) => <button key={view.id} type="button" aria-pressed={activeView === view.id} onClick={() => onView(view.id)} className={`min-h-11 shrink-0 rounded-xl px-3.5 text-sm font-semibold ${activeView === view.id ? "bg-[#195c45] text-white" : "text-[#5d6e66] hover:bg-[#f1f5f3]"}`}>
        {view.label} <span className="ml-1 opacity-75">{counts[view.id].total}</span>{counts[view.id].unread ? <span className="ml-1 text-[10px]">· {counts[view.id].unread} non lu{counts[view.id].unread > 1 ? "s" : ""}</span> : null}
      </button>)}
    </nav>
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-[#dce5e0] bg-white p-3">
      <button type="button" onClick={onSelectAll} className={buttonClass}>Tout sélectionner</button>
      <span className="mr-auto text-sm text-[#64736c]">{selectedCount} sélectionné{selectedCount > 1 ? "s" : ""}</span>
      <BulkButton label="À traiter" action="to_process" disabled={!selectedCount || pending} onAction={onAction} />
      <BulkButton label="En attente" action="waiting" disabled={!selectedCount || pending} onAction={onAction} />
      <BulkButton label="Traités" action="processed" disabled={!selectedCount || pending} onAction={onAction} />
      <BulkButton label="Archiver" action="archive" disabled={!selectedCount || pending} onAction={onAction} />
      <BulkButton label="Restaurer" action="restore" disabled={!selectedCount || pending} onAction={onAction} />
      <BulkButton label="Marquer lus" action="mark_read" disabled={!selectedCount || pending} onAction={onAction} />
      <BulkButton label="Marquer non lus" action="mark_unread" disabled={!selectedCount || pending} onAction={onAction} />
    </div>
  </div>;
}

const buttonClass = "min-h-10 rounded-xl border border-[#cbd7d1] bg-white px-3 text-xs font-semibold text-[#40554b] disabled:opacity-40";

function BulkButton({ label, action, disabled, onAction }: { label: string; action: MailManagementAction; disabled: boolean; onAction: (action: MailManagementAction) => void }) {
  return <button type="button" disabled={disabled} onClick={() => onAction(action)} className={buttonClass}>{label}</button>;
}
