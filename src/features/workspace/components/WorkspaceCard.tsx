import Link from "next/link";
import { AppIcon } from "@/components/ui/AppIcon";
import type { WorkspaceCardConfig } from "@/features/settings/types/settings";

export function WorkspaceCard({ card, counter, status }: { card: WorkspaceCardConfig; counter?: number; status?: string }) {
  return (
    <article className={`flex min-h-56 flex-col rounded-2xl border border-[var(--app-border)] bg-[var(--app-card)] p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${card.size === "wide" ? "md:col-span-2" : ""}`}>
      <div className="flex items-start justify-between gap-3"><span className="grid size-11 place-items-center rounded-xl text-white" style={{ backgroundColor: card.color }}><AppIcon name={card.icon} className="size-5" /></span>{(counter ?? card.counter) > 0 && <span className="grid min-w-7 place-items-center rounded-full px-2 py-1 text-xs font-bold text-white" style={{ backgroundColor: card.color }}>{counter ?? card.counter}</span>}</div>
      <h2 className="mt-4 text-lg font-semibold">{card.label}</h2>
      <div className="mt-1 flex flex-wrap items-center gap-2"><p className="text-xs font-semibold" style={{ color: card.color }}>{status ?? card.status}</p><span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">Priorité {card.priorityLevel.toLowerCase()}</span></div>
      <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">{card.description}</p>
      <Link href={card.href} className="mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[var(--app-border)] px-4 text-sm font-semibold hover:bg-slate-50">Ouvrir <AppIcon name="arrow" className="size-4" /></Link>
    </article>
  );
}
