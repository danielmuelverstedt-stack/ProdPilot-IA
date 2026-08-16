import Link from "next/link";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { AppIcon } from "@/components/ui/AppIcon";

export function ModuleBreadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return <nav aria-label="Fil d’Ariane" className="mb-4 overflow-x-auto"><ol className="flex min-w-max items-center gap-2 text-xs text-slate-500">{items.map((item, index) => <li key={`${item.label}-${index}`} className="flex items-center gap-2">{index ? <span aria-hidden="true" className="text-slate-300">/</span> : null}{item.href ? <Link href={item.href} className="font-medium hover:text-[var(--app-primary)]">{item.label}</Link> : <span aria-current="page" className="font-semibold text-slate-700">{item.label}</span>}</li>)}</ol></nav>;
}

export function ModuleHeader({ eyebrow, title, description, actions, meta }: { eyebrow: string; title: string; description: string; actions?: ReactNode; meta?: ReactNode }) {
  return <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-widest text-[var(--app-primary)]">{eyebrow}</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-[var(--app-text)] sm:text-4xl">{title}</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">{description}</p>{meta ? <div className="mt-2 text-xs text-slate-500">{meta}</div> : null}</div>{actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}</header>;
}

export const PageHeader = ModuleHeader;

export function StatusPill({ children, tone = "neutral", size = "md" }: { children: ReactNode; tone?: "neutral" | "success" | "warning" | "danger" | "info"; size?: "sm" | "md" }) {
  const classes = { neutral: "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200", success: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200", warning: "bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-200", danger: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200", info: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200" }[tone];
  const sizing = size === "sm" ? "px-1.5 py-0 text-[10px] leading-4" : "px-2.5 py-1 text-xs";
  return <span className={`inline-flex items-center whitespace-nowrap rounded-full font-semibold ${sizing} ${classes}`}>{children}</span>;
}

export const StatusBadge = StatusPill;

export function EmptyState({ title, description, action, icon }: { title: string; description: string; action?: ReactNode; icon?: string }) {
  return <section className="rounded-[var(--app-radius-lg)] border border-dashed border-[var(--app-border)] bg-white px-6 py-10 text-center">{icon ? <span className="mx-auto mb-3 grid size-10 place-items-center rounded-full bg-slate-100 text-slate-500"><AppIcon name={icon} className="size-5" /></span> : null}<h2 className="font-semibold text-[var(--app-text)]">{title}</h2><p className="mx-auto mt-2 max-w-lg text-sm text-slate-500">{description}</p>{action ? <div className="mt-4 flex justify-center">{action}</div> : null}</section>;
}

export function ErrorBanner({ children, className = "" }: { children: ReactNode; className?: string }) { return <p role="alert" className={`rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 ${className}`}>{children}</p>; }

export const primaryButton = "inline-flex min-h-10 items-center justify-center rounded-lg bg-[var(--app-primary)] px-4 text-sm font-semibold text-white shadow-[var(--app-shadow-sm)] hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 disabled:active:scale-100";
export const secondaryButton = "inline-flex min-h-10 items-center justify-center rounded-lg border border-[var(--app-border)] bg-white px-3 text-sm font-semibold hover:bg-slate-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 disabled:active:scale-100";
export const fieldClass = "min-h-10 rounded-lg border border-[var(--app-border)] bg-white px-3 text-sm outline-none focus:border-[var(--app-primary)] focus:ring-4 focus:ring-[color-mix(in_srgb,var(--app-primary)_12%,transparent)]";

const buttonVariants = {
  primary: primaryButton,
  secondary: secondaryButton,
  ghost: "inline-flex min-h-10 items-center justify-center rounded-lg px-3 text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45",
  danger: "inline-flex min-h-10 items-center justify-center rounded-lg bg-[var(--app-danger)] px-4 text-sm font-semibold text-white shadow-[var(--app-shadow-sm)] hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45",
} as const;

export function Button({ variant = "primary", loading = false, className = "", children, disabled, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof buttonVariants; loading?: boolean }) {
  return <button className={`${buttonVariants[variant]} gap-2 ${className}`} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>{loading ? <span className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden="true" /> : null}{children}</button>;
}

export function IconButton({ label, icon, variant = "ghost", className = "", ...props }: Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & { label: string; icon: string; variant?: keyof typeof buttonVariants }) {
  return <Button variant={variant} className={`size-10 min-h-10 px-0 ${className}`} aria-label={label} title={label} {...props}><AppIcon name={icon} className="size-4" /></Button>;
}

export function Card({ children, className = "", compact = false }: { children: ReactNode; className?: string; compact?: boolean }) { return <section className={`rounded-[var(--app-radius-lg)] border border-[var(--app-border)] bg-[var(--app-card)] shadow-[var(--app-shadow-sm)] ${compact ? "p-3" : "p-4 sm:p-5"} ${className}`}>{children}</section>; }

export function MetricCard({ label, value, detail }: { label: string; value: ReactNode; detail?: ReactNode }) { return <Card compact><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-1 text-2xl font-bold tabular-nums text-[var(--app-text)]">{value}</p>{detail ? <p className="mt-1 text-xs text-slate-500">{detail}</p> : null}</Card>; }

export function FieldLabel({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) { return <label className="block text-sm font-medium text-slate-700"><span className="flex items-center justify-between gap-2">{label}{hint ? <span className="text-xs font-normal text-slate-500">{hint}</span> : null}</span><span className="mt-1 block">{children}</span></label>; }
export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) { return <input className={`${fieldClass} w-full ${className}`} {...props} />; }
export function Textarea({ className = "", ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) { return <textarea className={`${fieldClass} min-h-24 w-full py-2 ${className}`} {...props} />; }
export function Select({ className = "", children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) { return <select className={`${fieldClass} w-full ${className}`} {...props}>{children}</select>; }

export function SearchInput({ className = "", value, onClear, ...props }: InputHTMLAttributes<HTMLInputElement> & { onClear?: () => void }) {
  const hasValue = typeof value === "string" && value.length > 0;
  return <span className={`relative block ${className}`}><AppIcon name="search" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><input className={`${fieldClass} w-full pl-9 ${hasValue && onClear ? "pr-10" : "pr-3"}`} type="search" value={value} {...props} />{hasValue && onClear ? <button type="button" onClick={onClear} aria-label="Effacer la recherche" className="absolute right-1 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700"><AppIcon name="close" className="size-4" /></button> : null}</span>;
}

export function FilterBar({ children, className = "" }: { children: ReactNode; className?: string }) { return <section aria-label="Filtres" className={`rounded-[var(--app-radius-lg)] border border-[var(--app-border)] bg-white p-3 shadow-[var(--app-shadow-sm)] ${className}`}>{children}</section>; }

export function Tabs({ items, value, onChange, label = "Vues" }: { items: { value: string; label: ReactNode }[]; value: string; onChange: (value: string) => void; label?: string }) { return <div role="tablist" aria-label={label} className="flex flex-wrap gap-1 rounded-xl border border-[var(--app-border)] bg-slate-100/80 p-1">{items.map((item) => <button key={item.value} type="button" role="tab" aria-selected={value === item.value} onClick={() => onChange(item.value)} className={`min-h-9 rounded-lg px-3 text-sm font-semibold ${value === item.value ? "bg-white text-[var(--app-primary)] shadow-sm" : "text-slate-600 hover:bg-white/70 hover:text-slate-900"}`}>{item.label}</button>)}</div>; }

export function EntityLink({ href, children, className = "" }: { href: string; children: ReactNode; className?: string }) { return <Link href={href} className={`font-semibold text-[var(--app-primary)] underline-offset-2 hover:underline ${className}`}>{children}</Link>; }
export function LoadingState({ label = "Chargement en cours…" }: { label?: string }) { return <div role="status" className="flex min-h-32 items-center justify-center gap-3 rounded-[var(--app-radius-lg)] border border-[var(--app-border)] bg-white text-sm text-slate-500"><span className="size-5 animate-spin rounded-full border-2 border-[var(--app-primary)] border-r-transparent" aria-hidden="true" />{label}</div>; }
export function Toast({ tone = "info", children }: { tone?: "success" | "info" | "warning" | "danger"; children: ReactNode }) { const colors = { success: "border-emerald-200 bg-emerald-50 text-emerald-800", info: "border-blue-200 bg-blue-50 text-blue-800", warning: "border-amber-200 bg-amber-50 text-amber-900", danger: "border-red-200 bg-red-50 text-red-800" }[tone]; return <div role={tone === "danger" ? "alert" : "status"} className={`rounded-xl border px-4 py-3 text-sm shadow-[var(--app-shadow-md)] ${colors}`}>{children}</div>; }

export function formatEuropeanDate(value: string, withTime = false): string { return new Intl.DateTimeFormat("fr-BE", withTime ? { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Brussels" } : { dateStyle: "short", timeZone: "Europe/Brussels" }).format(new Date(value)); }
