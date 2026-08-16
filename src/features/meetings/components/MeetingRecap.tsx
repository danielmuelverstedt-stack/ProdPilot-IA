"use client";

import Link from "next/link";
import { formatEuropeanDate, StatusPill } from "@/components/ui/ModuleUi";
import { actionStatusTone } from "@/features/actions/services/action-status";
import { meetingSteps } from "@/features/meetings/services/meeting-steps";
import { useDemoData } from "@/features/demo/services/demo-repository";
import { useSettings } from "@/features/settings/components/SettingsProvider";
import type { Meeting, MeetingStepEntry, ProductionAction } from "@/features/demo/types/demo";

/**
 * Compte rendu détaillé d'une réunion : déroulé étape par étape (ce qui a été noté/décidé à
 * chacune) et actions liées (avec responsable, échéance, statut) — même contenu que le récap
 * e-mail (`meeting-recap-email.ts`) et l'historique (`/reunions/historique`), affiché ici pour que
 * l'écran vu juste après la clôture (et son impression) ne soit plus un simple compteur.
 */
export function MeetingRecap({ meeting, actions }: { meeting: Meeting; actions: ProductionAction[] }) {
  const data = useDemoData();
  const { settings } = useSettings();
  const maintenanceProblems = (meeting.maintenanceProblemIds ?? []).map((id) => data.maintenanceProblems.find((item) => item.id === id)).filter((item) => item !== undefined);
  const contactsById = new Map(data.contacts.map((contact) => [contact.id, contact]));
  return <div className="grid gap-5 sm:grid-cols-2">
    {(meeting.priorityDossiers ?? []).length ? <div className="sm:col-span-2"><h3 className="text-xs font-semibold uppercase text-slate-500">Dossiers prioritaires</h3><ol className="mt-2 grid gap-2 sm:grid-cols-2">{meeting.priorityDossiers.map((dossier) => <li key={dossier.id} className="rounded-lg bg-slate-50 p-3 text-sm"><div className="flex items-start justify-between gap-2"><strong>{dossier.title}</strong><StatusPill tone={dossier.status === "Décision prise" ? "success" : "neutral"}>{dossier.status}</StatusPill></div>{dossier.meetingComment ? <p className="mt-2 text-slate-600">{dossier.meetingComment}</p> : null}{dossier.decision ? <p className="mt-2 font-medium">Décision : {dossier.decision}</p> : null}</li>)}</ol></div> : null}
    {maintenanceProblems.length ? <div className="sm:col-span-2"><h3 className="text-xs font-semibold uppercase text-slate-500">Maintenance</h3><div className="mt-2 grid gap-2 sm:grid-cols-2">{maintenanceProblems.map((problem) => { const machine = settings.production.machines.find((item) => item.id === problem.machineId); return <article key={problem.id} className="rounded-lg bg-slate-50 p-3 text-sm"><div className="flex justify-between gap-2"><strong>{machine?.displayName ?? problem.machineId} — {problem.title}</strong><StatusPill tone={problem.status === "Résolu" ? "success" : problem.status === "En attente" ? "warning" : "info"}>{problem.status}</StatusPill></div>{problem.productionImpact ? <p className="mt-2 text-slate-600">Impact : {problem.productionImpact}</p> : null}{problem.comments.at(-1) ? <p className="mt-2">Dernière mise à jour : {problem.comments.at(-1)!.text}</p> : null}</article>; })}</div></div> : null}
    {(meeting.fieldPoints ?? []).length ? <div className="sm:col-span-2"><h3 className="text-xs font-semibold uppercase text-slate-500">Remontées terrain</h3><div className="mt-2 grid gap-2 sm:grid-cols-2">{meeting.fieldPoints.map((point) => { const contact = contactsById.get(point.participantContactId); const pointActions = actions.filter((action) => point.actionIds.includes(action.id)); return <article key={point.id} className="rounded-lg bg-slate-50 p-3 text-sm"><strong>{contact ? `${contact.firstName} ${contact.lastName}`.trim() : "Contact supprimé"}</strong><p className="mt-1">{point.text}</p>{point.comments ? <p className="mt-2 text-slate-600">Commentaires : {point.comments}</p> : null}<div className="mt-2 flex flex-wrap gap-1 text-xs text-slate-500">{point.machineIds.map((id) => <Link key={`m-${id}`} href={`/machines/${id}`}>Machine {id}</Link>)}{point.workOrderIds.map((id) => <Link key={`of-${id}`} href={`/of/${id}`}>OF {id}</Link>)}</div>{pointActions.length ? <ul className="mt-2">{pointActions.map((action) => <li key={action.id}><Link className="text-[var(--app-primary)]" href={`/actions/${action.id}`}>Action : {action.description}</Link></li>)}</ul> : null}</article>; })}</div></div> : null}
    <div>
      <h3 className="text-xs font-semibold uppercase text-slate-500">Actions créées ou suivies</h3>
      {actions.length ? <ul className="mt-2 space-y-2">{actions.map((action) => <li key={action.id}>
        <Link href={`/actions/${action.id}`} className="block rounded-lg bg-slate-50 p-2.5 text-sm hover:bg-slate-100">
          <strong className="font-medium">{action.description}</strong>
          <span className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">{action.responsable || "sans responsable"} · échéance {formatEuropeanDate(action.echeance)} <StatusPill tone={actionStatusTone(action.statut)}>{action.statut}</StatusPill></span>
        </Link>
      </li>)}</ul> : <p className="mt-2 text-sm text-slate-500">Aucune action liée.</p>}
    </div>
    <div className="grid gap-4">
      <StepEntryList type={meeting.type} notes={meeting.notes} decisions={meeting.decisions} />
      <TextList title="Parking lot" items={meeting.parkingLot} emptyLabel="Aucun point en attente." />
    </div>
  </div>;
}

function TextList({ title, items, emptyLabel }: { title: string; items: string[]; emptyLabel: string }) {
  return <div>
    <h3 className="text-xs font-semibold uppercase text-slate-500">{title}</h3>
    {items.length ? <ul className="mt-2 space-y-1">{items.map((item, index) => <li key={index} className="rounded-lg bg-slate-50 p-2 text-sm">{item}</li>)}</ul> : <p className="mt-2 text-sm text-slate-500">{emptyLabel}</p>}
  </div>;
}

/** Reconstitue ce qui a été noté et décidé à chaque étape de la réunion, dans l'ordre du déroulé — pas deux listes plates sans lien avec le moment où chaque point a été abordé. */
function StepEntryList({ type, notes, decisions }: { type: Meeting["type"]; notes: MeetingStepEntry[]; decisions: MeetingStepEntry[] }) {
  const byStep = new Map<string, { notes: string[]; decisions: string[] }>();
  function get(step: string) {
    const existing = byStep.get(step);
    if (existing) return existing;
    const created = { notes: [] as string[], decisions: [] as string[] };
    byStep.set(step, created);
    return created;
  }
  for (const entry of notes) get(entry.step).notes.push(entry.text);
  for (const entry of decisions) get(entry.step).decisions.push(entry.text);
  const orderedSteps = [...meetingSteps(type)];
  for (const step of byStep.keys()) if (!orderedSteps.includes(step)) orderedSteps.push(step);
  const stepsWithContent = orderedSteps.filter((step) => byStep.get(step)?.notes.length || byStep.get(step)?.decisions.length);
  return <div>
    <h3 className="text-xs font-semibold uppercase text-slate-500">Déroulé de la réunion</h3>
    {stepsWithContent.length
      ? <ul className="mt-2 space-y-2">{stepsWithContent.map((step) => <li key={step} className="rounded-lg bg-slate-50 p-2.5 text-sm">
          <p className="font-semibold">{step}</p>
          <ul className="mt-1 space-y-1">
            {byStep.get(step)!.notes.map((text, index) => <li key={`note-${index}`}>{text}</li>)}
            {byStep.get(step)!.decisions.map((text, index) => <li key={`decision-${index}`} className="font-medium">Décision : {text}</li>)}
          </ul>
        </li>)}</ul>
      : <p className="mt-2 text-sm text-slate-500">Rien n&apos;a été noté pendant cette réunion.</p>}
  </div>;
}
