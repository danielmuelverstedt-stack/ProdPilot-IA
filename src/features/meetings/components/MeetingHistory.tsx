"use client";

import { formatEuropeanDate, ModuleBreadcrumbs, ModuleHeader, StatusPill } from "@/components/ui/ModuleUi";
import { useDemoData } from "@/features/demo/services/demo-repository";
import { useSettings } from "@/features/settings/components/SettingsProvider";
import { currentDemoUserId } from "@/features/settings/services/current-user";
import { MeetingRecap } from "@/features/meetings/components/MeetingRecap";
import { isMeetingVisibleToUser, meetingParticipantNames, meetingStatusTone } from "@/features/meetings/services/meeting-lifecycle";
import type { Contact, Meeting, ProductionAction } from "@/features/demo/types/demo";

/** Traçabilité complète de chaque réunion passée : date, participants et détail dépliable (actions créées, notes, décisions, parking lot) — pas seulement des compteurs. Un Brouillon d'un autre utilisateur de démonstration n'apparaît pas (filtrage cosmétique, voir `isMeetingVisibleToUser`). */
export function MeetingHistory() {
  const data = useDemoData();
  const { settings } = useSettings();
  const viewerId = currentDemoUserId(settings);
  const meetings = [...data.meetings].sort((a, b) => b.date.localeCompare(a.date)).filter((item) => isMeetingVisibleToUser(item, viewerId));
  return <div className="mx-auto max-w-5xl">
    <ModuleBreadcrumbs items={[{ label: "Réunions", href: "/reunions" }, { label: "Historique" }]} />
    <ModuleHeader eyebrow="Traçabilité" title="Historique des réunions" description="Comptes rendus, participants et actions de tous les rituels, du plus récent au plus ancien." />
    <div className="mt-6 grid gap-3">
      {meetings.length ? meetings.map((meeting) => <MeetingHistoryCard key={meeting.id} meeting={meeting} actions={data.actions.filter((item) => meeting.actionIds.includes(item.id))} contacts={data.contacts} />) : <p className="text-sm text-slate-500">Aucune réunion enregistrée.</p>}
    </div>
  </div>;
}

function MeetingHistoryCard({ meeting, actions, contacts }: { meeting: Meeting; actions: ProductionAction[]; contacts: Contact[] }) {
  const participantNames = meetingParticipantNames(meeting.participants, contacts);
  return <article className="rounded-2xl border border-[var(--app-border)] bg-white p-5">
    <div className="flex flex-wrap justify-between gap-2">
      <div>
        <h2 className="font-semibold">{meeting.type} · {meeting.id}</h2>
        <p className="mt-1 text-sm text-slate-500">{formatEuropeanDate(meeting.date, true)} · {participantNames.length ? participantNames.join(", ") : "aucun participant renseigné"}</p>
      </div>
      <StatusPill tone={meetingStatusTone(meeting.status)}>{meeting.status}</StatusPill>
    </div>
    <p className="mt-3 text-sm">{meeting.notes.length} notes · {meeting.decisions.length} décisions · {actions.length} actions · {(meeting.fieldPoints ?? []).length} remontées terrain · {meeting.parkingLot.length} sujets au parking</p>
    <details className="mt-3">
      <summary className="cursor-pointer text-sm font-semibold text-[var(--app-primary)]">Voir le détail</summary>
      <div className="mt-3"><MeetingRecap meeting={meeting} actions={actions} /></div>
    </details>
  </article>;
}
