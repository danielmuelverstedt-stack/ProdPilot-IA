import type { ReactNode } from "react";
import { fieldClass, secondaryButton } from "@/components/ui/ModuleUi";

export function SettingsPanel({ title, description, children, actions }: { title: string; description?: string; children: ReactNode; actions?: ReactNode }) {
  return <section className="rounded-2xl border border-[var(--app-border)] bg-white p-5 shadow-[var(--app-shadow-sm)]"><header className="mb-5 flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-semibold text-[var(--app-text)]">{title}</h2>{description && <p className="mt-1 text-sm text-slate-500">{description}</p>}</div>{actions}</header>{children}</section>;
}

/** Repose sur les primitives partagées de ModuleUi.tsx plutôt que de les redéfinir — l'ancienne redéfinition locale avait dérivé (opacité désactivée différente, curseur désactivé manquant) des boutons du reste de l'app. */
export const inputClass = `${fieldClass} w-full`;
export const buttonClass = secondaryButton;

export function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="block text-sm font-medium text-slate-700"><span className="mb-1.5 block">{label}</span>{children}</label>; }

export function EmptySettings({ title }: { title: string }) { return <SettingsPanel title={title} description="Ce réglage sera relié au module correspondant dans une prochaine version."><div className="rounded-xl border border-dashed border-[var(--app-border)] bg-slate-50 p-8 text-center text-sm text-slate-500">Configuration préparée — aucune donnée réelle n’est modifiée.</div></SettingsPanel>; }
