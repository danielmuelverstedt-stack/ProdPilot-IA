"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { fieldClass, ModuleHeader, primaryButton, secondaryButton, StatusPill } from "@/components/ui/ModuleUi";
import { updateDemoData, useDemoData } from "@/features/demo/services/demo-repository";
import { ActionFormDialog } from "@/features/actions/components/ActionFormDialog";
import { MeetingActionReview } from "@/features/meetings/components/MeetingActionReview";
import { MeetingMachineReview } from "@/features/meetings/components/MeetingMachineReview";
import type { ActionContextLink } from "@/features/demo/types/demo";

const qrqcSteps = ["Revue des actions QRQC", "OF en cours", "Prochains OF", "Points bloquants", "Besoins des départements", "Actions créées", "Synthèse", "Clôture"];
const productionSteps = ["Revue des actions précédentes", "Cinq projets critiques", "OF planifiés par machine", "OF urgents", "Demandes des départements", "Décisions", "Synthèse", "Compte rendu"];
const needs = ["Qualité", "Planning", "Programme", "Outillage", "Matière", "Maintenance", "Achats", "Autre"];

function originForType(type: "QRQC" | "Production") { return type === "QRQC" ? "QRQC" : "Réunion de production"; }
function meetingHref(type: "QRQC" | "Production") { return type === "QRQC" ? "/reunions/qrqc" : "/reunions/production"; }

export function MeetingWorkflow({ type }: { type: "QRQC" | "Production" }) {
  const data = useDemoData();
  const steps = type === "QRQC" ? qrqcSteps : productionSteps;
  const origine = originForType(type);
  const selectedMeeting = data.meetings.find((item) => item.type === type && item.status !== "Clôturée") ?? data.meetings.find((item) => item.type === type);
  const [step, setStep] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [note, setNote] = useState("");
  const [parking, setParking] = useState("");
  const [creatingAction, setCreatingAction] = useState(false);
  const [closed, setClosed] = useState(selectedMeeting?.status === "Clôturée");
  useEffect(() => { if (!running) return; const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000); return () => window.clearInterval(timer); }, [running]);
  const criticalOrders = useMemo(() => data.workOrders.filter((item) => item.priority === "Urgente" || item.status === "Bloqué" || item.dueDate <= "2026-07-15").slice(0, 5), [data.workOrders]);
  if (!selectedMeeting) return null;
  const meeting = selectedMeeting;
  const originActions = data.actions.filter((item) => item.origine === origine);
  const contextLink: ActionContextLink = { module: "meeting", id: meeting.id, label: meeting.id, href: meetingHref(type) };
  function addNote() { if (!note.trim()) return; updateDemoData((draft) => { draft.meetings.find((item) => item.id === meeting.id)?.notes.push(note.trim()); }); setNote(""); }
  function addParking() { if (!parking.trim()) return; updateDemoData((draft) => { draft.meetings.find((item) => item.id === meeting.id)?.parkingLot.push(parking.trim()); }); setParking(""); }
  function linkActionToMeeting(id: string) { updateDemoData((draft) => { draft.meetings.find((item) => item.id === meeting.id)?.actionIds.push(id); }); }
  function closeMeeting() { if (!window.confirm(`Clôturer la réunion ${type} et générer le compte rendu de démonstration ?`)) return; updateDemoData((draft) => { const target = draft.meetings.find((item) => item.id === meeting.id); if (target) { target.status = "Clôturée"; target.decisions.push(`Réunion clôturée après ${Math.floor(seconds / 60)} minute(s).`); } }); setClosed(true); setRunning(false); }
  return <div className="mx-auto max-w-6xl"><ModuleHeader eyebrow={`Réunion · ${meeting.id}`} title={type === "QRQC" ? "QRQC quotidien" : "Réunion Production"} description={`${meeting.participants.join(", ")} · chronomètre ${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`} actions={<><button className={secondaryButton} onClick={() => setRunning((value) => !value)}>{running ? "Pause" : "Démarrer le minuteur"}</button><Link className={secondaryButton} href="/reunions">Quitter</Link></>} />
    {creatingAction ? <ActionFormDialog origine={origine} contextLink={contextLink} onClose={() => setCreatingAction(false)} onCreated={linkActionToMeeting} /> : null}
    <div className="mt-6 h-2 overflow-hidden rounded-full bg-slate-200"><span className="block h-full bg-[var(--app-primary)] transition-all" style={{ width: `${((step + 1) / steps.length) * 100}%` }} /></div><p className="mt-2 text-xs text-slate-500">Étape {step + 1} sur {steps.length} · {steps[step]}</p>
    {closed ? <section className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-6"><StatusPill tone="success">Réunion clôturée</StatusPill><h2 className="mt-3 text-xl font-semibold">Compte rendu généré</h2><p className="mt-2 text-sm text-emerald-900">{meeting.notes.length} notes, {meeting.actionIds.length} actions liées et {meeting.parkingLot.length} sujets au parking. Revue des actions « {origine} » : {originActions.filter((item) => item.statut === "Fait").length} faites, {originActions.filter((item) => item.statut === "Reporté").length} reportées, {originActions.filter((item) => item.statut === "À faire").length} encore à faire. Aucune donnée externe n’a été transmise.</p><button className={`${secondaryButton} mt-4`} onClick={() => window.print()}>Imprimer le compte rendu</button></section> : <section className="mt-6 rounded-2xl border border-[var(--app-border)] bg-white p-5 sm:p-6"><h2 className="text-xl font-semibold">{steps[step]}</h2><StepContent type={type} step={step} data={data} criticalOrders={criticalOrders} origine={origine} /><div className="mt-6 grid gap-4 lg:grid-cols-3"><QuickInput label="Note rapide" value={note} setValue={setNote} onAdd={addNote} /><div><label className="text-xs font-semibold uppercase text-slate-500">Créer une action</label><div className="mt-1"><button className={`${secondaryButton} w-full`} onClick={() => setCreatingAction(true)}>+ Nouvelle action</button></div></div><QuickInput label="Parking lot" value={parking} setValue={setParking} onAdd={addParking} /></div><div className="mt-6 flex flex-wrap justify-between gap-2"><button className={secondaryButton} disabled={step === 0} onClick={() => setStep((value) => value - 1)}>Précédent</button>{step < steps.length - 1 ? <button className={primaryButton} onClick={() => setStep((value) => value + 1)}>Suivant</button> : <button className={primaryButton} onClick={closeMeeting}>Clôturer la réunion</button>}</div></section>}
  </div>;
}

function StepContent({ type, step, data, criticalOrders, origine }: { type: "QRQC" | "Production"; step: number; data: ReturnType<typeof useDemoData>; criticalOrders: ReturnType<typeof useDemoData>["workOrders"]; origine: string }) {
  if (step === 0) return <MeetingActionReview origine={origine} />;
  if (type === "Production" && step === 2) return <MeetingMachineReview origine={origine} />;
  if ((type === "QRQC" && [1, 2, 3, 4].includes(step)) || (type === "Production" && [1, 3].includes(step))) return <div className="mt-4 grid gap-3">{criticalOrders.map((order) => <article key={order.id} className="rounded-xl border border-[var(--app-border)] p-4"><div className="flex flex-wrap justify-between gap-2"><Link href={`/of/${order.id}`} className="font-semibold text-[var(--app-primary)]">{order.id} · {order.customer}</Link><StatusPill tone={order.status === "Bloqué" ? "danger" : "warning"}>{order.status}</StatusPill></div><p className="mt-2 text-sm">Cet OF a-t-il besoin de quelque chose ?</p><div className="mt-2 flex flex-wrap gap-1">{needs.map((need) => <button key={need} className="rounded-full border px-2.5 py-1 text-xs hover:bg-slate-50">{need}</button>)}</div></article>)}</div>;
  if ((type === "Production" && step === 4)) return <List items={data.requests.filter((item) => item.status !== "Terminée").map((item) => `${item.id} · ${item.title} · ${item.status}`)} />;
  if (step >= 5) return <List items={[`${data.actions.filter((item) => item.statut !== "Fait").length} actions ouvertes`, `${data.requests.filter((item) => item.status !== "Terminée").length} demandes actives`, `${data.machines.filter((item) => item.status === "En panne").length} machine en panne`]} />;
  return <p className="mt-4 text-sm text-slate-600">Ajoutez les décisions et points à suivre dans les champs ci-dessous.</p>;
}

function List({ items }: { items: string[] }) { return <ul className="mt-4 grid gap-2">{items.map((item) => <li key={item} className="rounded-lg bg-slate-50 p-3 text-sm">{item}</li>)}</ul>; }
function QuickInput({ label, value, setValue, onAdd }: { label: string; value: string; setValue: (value: string) => void; onAdd: () => void }) { return <div><label className="text-xs font-semibold uppercase text-slate-500">{label}</label><div className="mt-1 flex gap-1"><input className={`${fieldClass} min-w-0 flex-1`} value={value} onChange={(event) => setValue(event.target.value)} /><button className={secondaryButton} onClick={onAdd}>Ajouter</button></div></div>; }
