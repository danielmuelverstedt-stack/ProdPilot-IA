import type { ReactNode } from "react";

export function ModuleHeader({ eyebrow, title, description, actions }: { eyebrow: string; title: string; description: string; actions?: ReactNode }) {
  return <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-widest text-[var(--app-primary)]">{eyebrow}</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-[var(--app-text)] sm:text-4xl">{title}</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">{description}</p></div>{actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}</header>;
}

export function StatusPill({ children, tone = "neutral", size = "md" }: { children: ReactNode; tone?: "neutral" | "success" | "warning" | "danger" | "info"; /** "sm" : variante resserrée pour les tableaux compacts (ex. colonne Retard de l'Atelier), même palette. */ size?: "sm" | "md" }) {
  const classes = { neutral: "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200", success: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200", warning: "bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-200", danger: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200", info: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200" }[tone];
  const sizing = size === "sm" ? "px-1.5 py-0 text-[10px] leading-4" : "px-2.5 py-1 text-xs";
  return <span className={`inline-flex items-center whitespace-nowrap rounded-full font-semibold ${sizing} ${classes}`}>{children}</span>;
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return <section className="rounded-2xl border border-dashed border-[var(--app-border)] bg-white px-6 py-12 text-center"><h2 className="font-semibold text-[var(--app-text)]">{title}</h2><p className="mt-2 text-sm text-slate-500">{description}</p></section>;
}

export function ErrorBanner({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p role="alert" className={`rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 ${className}`}>{children}</p>;
}

export const primaryButton = "inline-flex min-h-10 items-center justify-center rounded-lg bg-[var(--app-primary)] px-4 text-sm font-semibold text-white shadow-[var(--app-shadow-sm)] hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 disabled:active:scale-100";
export const secondaryButton = "inline-flex min-h-10 items-center justify-center rounded-lg border border-[var(--app-border)] bg-white px-3 text-sm font-semibold hover:bg-slate-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 disabled:active:scale-100";
export const fieldClass = "min-h-10 rounded-lg border border-[var(--app-border)] bg-white px-3 text-sm outline-none focus:border-[var(--app-primary)] focus:ring-4 focus:ring-[color-mix(in_srgb,var(--app-primary)_12%,transparent)]";

export function formatEuropeanDate(value: string, withTime = false): string {
  return new Intl.DateTimeFormat("fr-BE", withTime ? { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Brussels" } : { dateStyle: "short", timeZone: "Europe/Brussels" }).format(new Date(value));
}
