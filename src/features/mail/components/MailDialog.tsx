"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

export function MailDialog({ open, title, description, onClose, children }: {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onCancel={onClose}
      onClose={onClose}
      aria-labelledby={titleId}
      className="m-auto w-[min(94vw,42rem)] rounded-2xl border border-[#d7e2dd] bg-white p-0 text-[#17211d] shadow-2xl backdrop:bg-slate-950/40"
    >
      <div className="flex items-start justify-between gap-4 border-b border-[#e7ece9] p-5 sm:p-6">
        <div>
          <h2 id={titleId} className="text-xl font-semibold">{title}</h2>
          {description ? <p className="mt-1 text-sm leading-6 text-[#64736c]">{description}</p> : null}
        </div>
        <button type="button" onClick={onClose} aria-label="Fermer la fenêtre" className="min-h-10 min-w-10 rounded-lg border border-[#d7e2dd] text-xl text-[#64736c]">×</button>
      </div>
      <div className="max-h-[75vh] overflow-y-auto p-5 sm:p-6">{children}</div>
    </dialog>
  );
}
