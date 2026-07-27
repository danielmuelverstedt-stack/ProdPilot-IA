import type { ReactNode } from "react";
import { AppIcon } from "@/components/ui/AppIcon";

export function PlanningDialogShell({ title, description, children, actions, onClose }: {
  title: string;
  description?: string;
  children: ReactNode;
  actions: ReactNode;
  onClose: () => void;
}) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section role="dialog" aria-modal="true" aria-labelledby="planning-dialog-title" className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-[var(--app-border)] bg-white shadow-2xl">
      <header className="flex items-start gap-4 border-b border-[var(--app-border)] p-5"><div><h2 id="planning-dialog-title" className="font-bold">{title}</h2>{description ? <p className="mt-1 text-xs text-slate-500">{description}</p> : null}</div><button type="button" className="ml-auto rounded-lg p-2 text-slate-500 hover:bg-slate-100" onClick={onClose} aria-label="Fermer"><AppIcon name="close" className="size-4" /></button></header>
      <div className="p-5">{children}</div>
      <footer className="flex flex-wrap justify-end gap-2 border-t border-[var(--app-border)] p-4">{actions}</footer>
    </section>
  </div>;
}
