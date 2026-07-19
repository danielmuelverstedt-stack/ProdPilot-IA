import type { ReactNode } from "react";

export function SettingsPanel({ title, description, children, actions }: { title: string; description?: string; children: ReactNode; actions?: ReactNode }) {
  return <section className="rounded-2xl border border-[var(--app-border)] bg-white p-5 shadow-[var(--app-shadow-sm)]"><header className="mb-5 flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-semibold text-[var(--app-text)]">{title}</h2>{description && <p className="mt-1 text-sm text-slate-500">{description}</p>}</div>{actions}</header>{children}</section>;
}

export const inputClass = "min-h-10 w-full rounded-lg border border-[var(--app-border)] bg-white px-3 text-sm outline-none focus:border-[var(--app-primary)] focus:ring-4 focus:ring-[color-mix(in_srgb,var(--app-primary)_12%,transparent)]";
export const buttonClass = "inline-flex min-h-10 items-center justify-center rounded-lg border border-[var(--app-border)] bg-white px-3 text-sm font-semibold hover:bg-slate-50 active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100";

export function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="block text-sm font-medium text-slate-700"><span className="mb-1.5 block">{label}</span>{children}</label>; }

export function EmptySettings({ title }: { title: string }) { return <SettingsPanel title={title} description="Ce réglage sera relié au module correspondant dans une prochaine version."><div className="rounded-xl border border-dashed border-[var(--app-border)] bg-slate-50 p-8 text-center text-sm text-slate-500">Configuration préparée — aucune donnée réelle n’est modifiée.</div></SettingsPanel>; }
