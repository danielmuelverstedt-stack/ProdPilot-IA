"use client";

import { useEffect, type ReactNode } from "react";
import { IconButton } from "@/components/ui/ModuleUi";

function useEscape(onClose: () => void) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) { if (event.key === "Escape") onClose(); }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);
}

export function Modal({ title, description, children, actions, onClose, maxWidthClassName = "max-w-xl" }: { title: string; description?: string; children: ReactNode; actions?: ReactNode; onClose: () => void; maxWidthClassName?: string }) {
  useEscape(onClose);
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section role="dialog" aria-modal="true" aria-labelledby="app-modal-title" className={`max-h-[90vh] w-full ${maxWidthClassName} overflow-y-auto rounded-[var(--app-radius-lg)] border border-[var(--app-border)] bg-white shadow-[var(--app-shadow-lg)]`}><header className="flex items-start gap-4 border-b border-[var(--app-border)] p-5"><div><h2 id="app-modal-title" className="font-bold text-[var(--app-text)]">{title}</h2>{description ? <p className="mt-1 text-xs text-slate-500">{description}</p> : null}</div><IconButton className="ml-auto" label="Fermer" icon="close" onClick={onClose} /></header><div className="p-5">{children}</div>{actions ? <footer className="flex flex-wrap justify-end gap-2 border-t border-[var(--app-border)] p-4">{actions}</footer> : null}</section></div>;
}

export function SidePanel({ title, description, children, actions, onClose }: { title: string; description?: string; children: ReactNode; actions?: ReactNode; onClose: () => void }) {
  useEscape(onClose);
  return <div className="fixed inset-0 z-50 bg-slate-950/35" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><aside role="dialog" aria-modal="true" aria-labelledby="app-panel-title" className="ml-auto flex h-full w-full max-w-xl flex-col bg-white shadow-[var(--app-shadow-lg)]"><header className="flex items-start gap-4 border-b border-[var(--app-border)] p-5"><div><h2 id="app-panel-title" className="font-bold">{title}</h2>{description ? <p className="mt-1 text-xs text-slate-500">{description}</p> : null}</div><IconButton className="ml-auto" label="Fermer" icon="close" onClick={onClose} /></header><div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>{actions ? <footer className="flex flex-wrap justify-end gap-2 border-t border-[var(--app-border)] p-4">{actions}</footer> : null}</aside></div>;
}
