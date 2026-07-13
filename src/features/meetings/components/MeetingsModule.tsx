"use client";

import Link from "next/link";
import { formatEuropeanDate, ModuleHeader, secondaryButton, StatusPill } from "@/components/ui/ModuleUi";
import { useDemoData } from "@/features/demo/services/demo-repository";

export function MeetingsModule() {
  const data = useDemoData();
  return <div className="mx-auto max-w-6xl"><ModuleHeader eyebrow="Rituels de production" title="Réunions" description="Choisissez un rituel rapide, créez des actions partagées et conservez un compte rendu local." actions={<Link className={secondaryButton} href="/reunions/historique">Historique</Link>} />
    <div className="mt-7 grid gap-5 md:grid-cols-2"><MeetingChoice title="QRQC quotidien" description="Passez rapidement les OF et machines en revue, identifiez les besoins et créez les actions immédiates." href="/reunions/qrqc" color="emerald" /><MeetingChoice title="Réunion Production" description="Arbitrez les projets critiques, le planning, les urgences et les demandes des départements." href="/reunions/production" color="blue" /></div>
    <section className="mt-7 rounded-2xl border border-[var(--app-border)] bg-white p-5"><h2 className="font-semibold">Prochaines réunions</h2><div className="mt-3 grid gap-3 sm:grid-cols-2">{data.meetings.filter((item) => item.status !== "Clôturée").map((meeting) => <article key={meeting.id} className="rounded-xl bg-slate-50 p-4"><div className="flex justify-between gap-2"><strong>{meeting.type}</strong><StatusPill tone="info">{meeting.status}</StatusPill></div><p className="mt-2 text-sm text-slate-600">{formatEuropeanDate(meeting.date, true)} · {meeting.participants.length} participants</p></article>)}</div></section>
  </div>;
}

function MeetingChoice({ title, description, href, color }: { title: string; description: string; href: string; color: "emerald" | "blue" }) { return <article className="flex min-h-64 flex-col rounded-3xl border border-[var(--app-border)] bg-white p-6 shadow-sm"><span className={`grid size-12 place-items-center rounded-2xl text-xl font-bold text-white ${color === "emerald" ? "bg-emerald-600" : "bg-blue-600"}`}>✓</span><h2 className="mt-5 text-xl font-semibold">{title}</h2><p className="mt-3 flex-1 text-sm leading-6 text-slate-600">{description}</p><Link className={`mt-5 inline-flex min-h-11 items-center justify-center rounded-xl font-semibold text-white ${color === "emerald" ? "bg-emerald-700" : "bg-blue-700"}`} href={href}>Démarrer</Link></article>; }
