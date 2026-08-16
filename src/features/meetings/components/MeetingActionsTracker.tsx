"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { fieldClass, formatEuropeanDate, primaryButton, StatusPill } from "@/components/ui/ModuleUi";
import { PhotoThumbnail } from "@/components/ui/PhotoThumbnail";
import { useDemoData } from "@/features/demo/services/demo-repository";
import { useSettings } from "@/features/settings/components/SettingsProvider";
import { currentDemoUserName } from "@/features/settings/services/current-user";
import { useContactPhotos } from "@/features/contacts/services/contact-photo-store";
import { ActionFormDialog } from "@/features/actions/components/ActionFormDialog";
import { ActionQuickEditPanel } from "@/features/actions/components/ActionQuickEditPanel";
import { endOfWeekIso, sortWithOverdueFirst } from "@/features/actions/services/action-grouping";
import { actionStatusTone, isActionOverdue, isSubAction } from "@/features/actions/services/action-status";
import type { ActionContextLink, Contact, ProductionAction } from "@/features/demo/types/demo";
import type { ActionOriginSettings } from "@/features/settings/types/settings";

type TrackerFilter = "toutes" | "retard" | "aujourdhui" | "semaine" | "moi" | "terminees";

const FILTERS: { key: TrackerFilter; label: string }[] = [
  { key: "toutes", label: "Toutes ouvertes" },
  { key: "retard", label: "En retard" },
  { key: "aujourdhui", label: "Échéance aujourd’hui" },
  { key: "semaine", label: "Cette semaine" },
  { key: "moi", label: "Mes actions" },
  { key: "terminees", label: "Terminées / Historique" },
];

/**
 * Étape « Suivi des actions » des réunions QRQC/Production : vue spécialisée du module Actions —
 * mêmes données, même service (`action-service.ts`), mêmes statuts — mais présentation propre à la
 * réunion (résumé, tri retard-en-premier, jamais de priorité) que le tableau générique
 * `ActionGroupedList` ne permet pas sans le dénaturer. Les actions « Reporté » restent affichées
 * (contrairement à l'ancienne revue, limitée à « À faire ») : elles ne sont pas terminées, donc pas
 * encore closes pour la réunion.
 */
export function MeetingActionsTracker({ origine, meetingLink, onActionCreated }: { origine: string; meetingLink: ActionContextLink; onActionCreated: (id: string, responsable: string) => void }) {
  const data = useDemoData();
  const { settings } = useSettings();
  const photos = useContactPhotos();
  const author = currentDemoUserName(settings);
  const [filter, setFilter] = useState<TrackerFilter>("toutes");
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const today = new Date().toISOString().slice(0, 10);
  const week = endOfWeekIso(today);

  const scoped = useMemo(() => data.actions.filter((item) => item.origine === origine && !isSubAction(item)), [data.actions, origine]);
  const open = useMemo(() => scoped.filter((item) => item.statut !== "Fait"), [scoped]);
  const closed = useMemo(() => scoped.filter((item) => item.statut === "Fait"), [scoped]);

  const summary = {
    total: open.length,
    retard: open.filter((item) => isActionOverdue(item, today)).length,
    aujourdhui: open.filter((item) => item.echeance === today).length,
    semaine: open.filter((item) => item.echeance > today && item.echeance <= week).length,
  };

  const base = filter === "terminees" ? closed : open;
  const filtered = base.filter((item) => {
    if (filter === "retard") return isActionOverdue(item, today);
    if (filter === "aujourdhui") return item.echeance === today;
    if (filter === "semaine") return item.echeance > today && item.echeance <= week;
    if (filter === "moi") return item.responsable.trim().toLocaleLowerCase("fr") === author.trim().toLocaleLowerCase("fr");
    return true;
  });

  const normalizedSearch = search.trim().toLocaleLowerCase("fr");
  const searched = normalizedSearch
    ? filtered.filter((item) => `${item.description} ${item.responsable} ${item.contextLinks.map((link) => link.label).join(" ")}`.toLocaleLowerCase("fr").includes(normalizedSearch))
    : filtered;

  const sorted = sortWithOverdueFirst(searched, today);

  return <div className="mt-4 grid gap-4">
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <SummaryTile label="Actions ouvertes" value={summary.total} />
      <SummaryTile label="En retard" value={summary.retard} danger={summary.retard > 0} />
      <SummaryTile label="Échéance aujourd’hui" value={summary.aujourdhui} />
      <SummaryTile label="Cette semaine" value={summary.semaine} />
    </div>

    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex flex-wrap gap-2">{FILTERS.map((item) => <button key={item.key} type="button" onClick={() => setFilter(item.key)} className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${filter === item.key ? "border-[color-mix(in_srgb,var(--app-primary)_45%,transparent)] bg-[color-mix(in_srgb,var(--app-primary)_10%,white)] text-[var(--app-primary)]" : "border-[var(--app-border)] bg-white text-slate-600 hover:bg-slate-50"}`}>{item.label}</button>)}</div>
      <button type="button" className={primaryButton} onClick={() => setCreating(true)}>+ Nouvelle action</button>
    </div>

    <input className={`${fieldClass} w-full max-w-sm`} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher (titre, responsable, machine, OF, projet)…" />

    <div className="grid gap-2">
      {sorted.length
        ? sorted.map((action) => <ActionCard key={action.id} action={action} contacts={data.contacts} photos={photos} origins={settings.actions.origins} onEdit={() => setEditingId(action.id)} />)
        : <p className="text-sm text-slate-500">Aucune action ne correspond.</p>}
    </div>

    {creating ? <ActionFormDialog origine={origine} contextLink={meetingLink} allowLinkPicker onClose={() => setCreating(false)} onCreated={onActionCreated} /> : null}
    {editingId ? <ActionQuickEditPanel actionId={editingId} onClose={() => setEditingId(null)} /> : null}
  </div>;
}

function SummaryTile({ label, value, danger = false }: { label: string; value: number; danger?: boolean }) {
  return <div className={`rounded-2xl border p-4 ${danger ? "border-red-200 bg-red-50" : "border-[var(--app-border)] bg-white"}`}>
    <p className={`text-2xl font-bold ${danger ? "text-red-700" : "text-[var(--app-text)]"}`}>{value}</p>
    <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
  </div>;
}

function ActionCard({ action, contacts, photos, origins, onEdit }: { action: ProductionAction; contacts: Contact[]; photos: Record<string, string>; origins: ActionOriginSettings[]; onEdit: () => void }) {
  const overdue = isActionOverdue(action);
  const responsableContact = action.responsableContactId ? contacts.find((item) => item.id === action.responsableContactId) : null;
  const lastComment = action.comments.at(-1);
  const originLabel = origins.find((item) => item.value === action.origine)?.label ?? action.origine;

  return <article className={`rounded-xl border p-3 ${overdue ? "border-red-200 bg-red-50" : "border-[var(--app-border)] bg-white"}`}>
    <div className="flex flex-wrap items-start justify-between gap-2">
      <button type="button" className="min-w-0 flex-1 text-left" onClick={onEdit}>
        <p className="font-medium text-[var(--app-text)]">{action.description}</p>
        <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">{responsableContact ? <PhotoThumbnail photoDataUrl={photos[responsableContact.id]} alt={action.responsable} size="xs" /> : null}{action.responsable || "Non assigné"}</span>
          <span className={overdue ? "font-semibold text-red-700" : undefined}>{action.statut === "À planifier" ? "—" : formatEuropeanDate(action.echeance)}</span>
          <StatusPill tone={actionStatusTone(action.statut)}>{action.statut}</StatusPill>
          <span>Créée depuis : {originLabel}</span>
        </p>
        {lastComment ? <p className="mt-1 truncate text-xs text-slate-500">« {lastComment.text} »</p> : null}
      </button>
      {action.contextLinks.length ? <div className="flex flex-wrap gap-1">{action.contextLinks.map((link) => <Link key={`${link.module}-${link.id}`} href={link.href} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-200">{link.label}</Link>)}</div> : null}
    </div>
  </article>;
}
