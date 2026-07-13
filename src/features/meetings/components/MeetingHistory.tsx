"use client";

import { formatEuropeanDate, ModuleHeader, StatusPill } from "@/components/ui/ModuleUi";
import { useDemoData } from "@/features/demo/services/demo-repository";

export function MeetingHistory() { const data = useDemoData(); return <div className="mx-auto max-w-5xl"><ModuleHeader eyebrow="Traçabilité" title="Historique des réunions" description="Comptes rendus et actions issus des rituels de démonstration." /><div className="mt-6 grid gap-3">{data.meetings.map((meeting) => <article className="rounded-2xl border border-[var(--app-border)] bg-white p-5" key={meeting.id}><div className="flex flex-wrap justify-between gap-2"><div><h2 className="font-semibold">{meeting.type} · {meeting.id}</h2><p className="mt-1 text-sm text-slate-500">{formatEuropeanDate(meeting.date, true)} · {meeting.participants.join(", ")}</p></div><StatusPill tone={meeting.status === "Clôturée" ? "success" : "info"}>{meeting.status}</StatusPill></div><p className="mt-3 text-sm">{meeting.notes.length} notes · {meeting.actionIds.length} actions · {meeting.parkingLot.length} sujets au parking</p></article>)}</div></div>; }
