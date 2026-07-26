import Link from "next/link";
import { AppIcon } from "@/components/ui/AppIcon";
import type { WorkspaceCardConfig } from "@/features/settings/types/settings";

/** Tuile de lancement rapide de Mon Espace : accès direct à un module, configurable dans Réglages → Interface → Mon Espace. */
export function WorkspaceCard({ card, counter }: { card: WorkspaceCardConfig; counter?: number }) {
  const badgeCount = counter ?? card.counter;
  return (
    <Link href={card.href} title={card.description} className="group flex flex-col items-center justify-center gap-3 rounded-2xl border border-[var(--app-border)] bg-[var(--app-card)] px-3 py-5 text-center shadow-[var(--app-shadow-sm)] transition hover:-translate-y-0.5 hover:border-[color-mix(in_srgb,var(--app-primary)_45%,var(--app-border))] hover:shadow-[var(--app-shadow-md)]">
      <span className="relative grid size-14 place-items-center rounded-2xl" style={{ backgroundColor: `color-mix(in srgb, ${card.color} 14%, white)`, color: card.color }}>
        <AppIcon name={card.icon} className="size-7" strokeWidth={1.75} />
        {badgeCount > 0 && <span className="absolute -right-1.5 -top-1.5 grid min-w-5 place-items-center rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm" style={{ backgroundColor: card.color }}>{badgeCount}</span>}
      </span>
      <span className="text-sm font-semibold text-[var(--app-text)]">{card.label}</span>
    </Link>
  );
}
