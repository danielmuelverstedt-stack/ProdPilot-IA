"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { fieldClass, formatEuropeanDate, ModuleBreadcrumbs, ModuleHeader, primaryButton, secondaryButton, StatusPill } from "@/components/ui/ModuleUi";
import { updateDemoData, useDemoData } from "@/features/demo/services/demo-repository";
import { useSettings } from "@/features/settings/components/SettingsProvider";
import { currentDemoUserId } from "@/features/settings/services/current-user";
import { ActionFormDialog } from "@/features/actions/components/ActionFormDialog";
import { MeetingActionsTracker } from "@/features/meetings/components/MeetingActionsTracker";
import { MeetingCriticalProjectsReview } from "@/features/meetings/components/MeetingCriticalProjectsReview";
import { MeetingMachineReview } from "@/features/meetings/components/MeetingMachineReview";
import { MeetingFieldRound } from "@/features/meetings/components/MeetingFieldRound";
import { MaintenanceProblemsWorkspace } from "@/features/maintenance/components/MaintenanceProblemsWorkspace";
import { MeetingParticipantsPicker } from "@/features/meetings/components/MeetingParticipantsPicker";
import { MeetingPrintView } from "@/features/meetings/components/MeetingPrintView";
import { MeetingRecap } from "@/features/meetings/components/MeetingRecap";
import { MeetingRecapWorkspace } from "@/features/meetings/components/MeetingRecapWorkspace";
import { MeetingRequestsReview } from "@/features/meetings/components/MeetingRequestsReview";
import { MeetingSendPanel } from "@/features/meetings/components/MeetingSendPanel";
import { buildNewMeeting, MAX_MEETING_PRIORITY_DOSSIERS, meetingParticipantNames, previousMeetingParticipants } from "@/features/meetings/services/meeting-lifecycle";
import { buildMeetingPreparationDocument } from "@/features/meetings/services/meeting-preparation-document";
import { buildMeetingRecapEmail } from "@/features/meetings/services/meeting-recap-email";
import { meetingSteps } from "@/features/meetings/services/meeting-steps";
import { contactFullName } from "@/features/contacts/services/contact-directory";
import type { ActionContextLink, Contact, Meeting, MeetingParticipant, MeetingPriorityDossier, MeetingPriorityDossierReferenceKind, MeetingSendChannelType, ProductionAction } from "@/features/demo/types/demo";

const needs = ["Qualité", "Planning", "Programme", "Outillage", "Matière", "Maintenance", "Achats", "Autre"];

function originForType(type: "QRQC" | "Production") { return type === "QRQC" ? "QRQC" : "Réunion de production"; }
function meetingHref(type: "QRQC" | "Production") { return type === "QRQC" ? "/reunions/qrqc" : "/reunions/production"; }
function meetingTitle(type: "QRQC" | "Production") { return type === "QRQC" ? "QRQC quotidien" : "Réunion Production"; }

export function MeetingWorkflow({ type }: { type: "QRQC" | "Production" }) {
  const data = useDemoData();
  const { settings } = useSettings();
  const steps = meetingSteps(type);
  const origine = originForType(type);
  const typeMeetings = useMemo(() => data.meetings.filter((item) => item.type === type), [data.meetings, type]);
  const openMeeting = typeMeetings.find((item) => item.status !== "Archivée") ?? null;
  const [step, setStep] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [note, setNote] = useState("");
  const [decision, setDecision] = useState("");
  const [parking, setParking] = useState("");
  const [creatingAction, setCreatingAction] = useState(false);
  const [sendPanelOpen, setSendPanelOpen] = useState(false);
  const [printTarget, setPrintTarget] = useState<"preparation" | "recap" | null>(null);
  useEffect(() => { if (!running) return; const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000); return () => window.clearInterval(timer); }, [running]);
  const criticalOrders = useMemo(() => data.workOrders.filter((item) => item.priority === "Urgente" || item.status === "Bloqué" || item.dueDate <= "2026-07-15").slice(0, 5), [data.workOrders]);
  function startNewMeeting() { updateDemoData((draft) => { draft.meetings.push(buildNewMeeting(draft.meetings, type, currentDemoUserId(settings), criticalOrders.map((item) => item.id))); }); setStep(0); setSeconds(0); }
  if (!openMeeting) return <NewMeetingPrompt type={type} carriedParticipants={previousMeetingParticipants(typeMeetings, type)} contacts={data.contacts} onStart={startNewMeeting} />;
  const meeting = openMeeting;
  const originActions = data.actions.filter((item) => item.origine === origine);
  const meetingActions = data.actions.filter((item) => meeting.actionIds.includes(item.id));
  const actionsToReview = originActions.filter((item) => item.statut !== "Fait" && item.parentActionId === null);
  const criticalWorkOrders = data.workOrders.filter((item) => meeting.priorityDossiers.some((dossier) => dossier.referenceKind === "workOrder" && dossier.referenceId === item.id));
  const machineNames = Object.fromEntries(settings.production.machines.map((item) => [item.id, item.displayName]));
  const contextLink: ActionContextLink = { module: "meeting", id: meeting.id, label: meeting.id, href: meetingHref(type) };
  const currentStepLabel = steps[step];
  const isLive = meeting.status === "En cours";
  const isTerminee = meeting.status === "Terminée";

  if (printTarget === "preparation") {
    const document = buildMeetingPreparationDocument(meeting, type, actionsToReview, criticalWorkOrders, data.contacts, data.maintenanceProblems, machineNames);
    return <MeetingPrintView title={document.subject} bodyText={document.bodyText} onBack={() => setPrintTarget(null)} onPrinted={() => { markPreparationSent("print"); setPrintTarget(null); }} />;
  }
  if (printTarget === "recap") {
    const document = buildMeetingRecapEmail(meeting, type, meetingActions, data.contacts, data.maintenanceProblems, machineNames);
    return <MeetingPrintView title={document.subject} bodyText={document.bodyText} onBack={() => setPrintTarget(null)} />;
  }

  function addNote() { if (!note.trim()) return; updateDemoData((draft) => { draft.meetings.find((item) => item.id === meeting.id)?.notes.push({ step: currentStepLabel, text: note.trim() }); }); setNote(""); }
  function addDecision() { if (!decision.trim()) return; updateDemoData((draft) => { draft.meetings.find((item) => item.id === meeting.id)?.decisions.push({ step: currentStepLabel, text: decision.trim() }); }); setDecision(""); }
  function addParking() { if (!parking.trim()) return; updateDemoData((draft) => { draft.meetings.find((item) => item.id === meeting.id)?.parkingLot.push(parking.trim()); }); setParking(""); }
  /**
   * Lie l'action à la réunion et, si son responsable correspond à un contact qui n'est pas déjà
   * participant, propose de l'ajouter (pour qu'il reçoive le récap envoyé en fin de réunion) —
   * jamais sans confirmation, et jamais si le nom ne correspond à aucun contact connu.
   */
  function linkActionToMeeting(id: string, responsable: string) {
    const name = responsable.trim().toLocaleLowerCase("fr");
    const matchedContact = name ? data.contacts.find((item) => contactFullName(item).toLocaleLowerCase("fr") === name) : undefined;
    const alreadyParticipant = matchedContact ? meeting.participants.some((item) => item.contactId === matchedContact.id) : true;
    const addParticipant = matchedContact && !alreadyParticipant
      ? window.confirm(`${contactFullName(matchedContact)} ne participe pas actuellement à la réunion.\nVoulez-vous l'ajouter aux participants ?`)
      : false;
    updateDemoData((draft) => {
      const target = draft.meetings.find((item) => item.id === meeting.id);
      if (!target) return;
      if (!target.actionIds.includes(id)) target.actionIds.push(id);
      if (addParticipant && matchedContact && !target.participants.some((item) => item.contactId === matchedContact.id)) target.participants.push({ contactId: matchedContact.id, present: true });
    });
  }
  function addPriorityDossier(referenceKind: MeetingPriorityDossierReferenceKind, referenceId: string | null, title: string, preparationComment = "") {
    updateDemoData((draft) => {
      const target = draft.meetings.find((item) => item.id === meeting.id);
      if (!target || target.priorityDossiers.length >= MAX_MEETING_PRIORITY_DOSSIERS) return;
      const id = `${meeting.id}-DOS-${Date.now().toString(36)}`;
      if (referenceKind === "workOrder" && referenceId && target.priorityDossiers.some((item) => item.referenceKind === "workOrder" && item.referenceId === referenceId)) return;
      target.priorityDossiers.push({ id, title: referenceKind === "workOrder" ? referenceId ?? title : title, description: "", preparationComment, meetingComment: "", decision: "", status: "À discuter", referenceKind, referenceId, actionIds: [] });
    });
  }
  function addPriorityDossierFromAction(actionId: string, preparationComment = "") {
    const action = data.actions.find((item) => item.id === actionId);
    if (!action) return;
    linkActionToMeeting(action.id, action.responsable);
    updateDemoData((draft) => {
      const target = draft.meetings.find((item) => item.id === meeting.id);
      if (!target || target.priorityDossiers.length >= MAX_MEETING_PRIORITY_DOSSIERS || target.priorityDossiers.some((item) => item.actionIds.includes(actionId))) return;
      const id = `${meeting.id}-DOS-${Date.now().toString(36)}`;
      target.priorityDossiers.push({ id, title: `Action ${action.id}`, description: "", preparationComment, meetingComment: "", decision: "", status: "À discuter", referenceKind: "free", referenceId: null, actionIds: [action.id] });
      const storedAction = draft.actions.find((item) => item.id === action.id);
      if (storedAction && !storedAction.contextLinks.some((link) => link.module === "meeting" && link.id === meeting.id)) storedAction.contextLinks.push(contextLink);
    });
  }
  function updatePriorityDossier(id: string, patch: Partial<MeetingPriorityDossier>) { updateDemoData((draft) => { const dossier = draft.meetings.find((item) => item.id === meeting.id)?.priorityDossiers.find((item) => item.id === id); if (dossier) Object.assign(dossier, patch); }); }
  function removePriorityDossier(id: string) { updateDemoData((draft) => { const target = draft.meetings.find((item) => item.id === meeting.id); if (target) target.priorityDossiers = target.priorityDossiers.filter((item) => item.id !== id); }); }
  function movePriorityDossier(id: string, direction: -1 | 1) { updateDemoData((draft) => { const list = draft.meetings.find((item) => item.id === meeting.id)?.priorityDossiers; if (!list) return; const index = list.findIndex((item) => item.id === id); const next = index + direction; if (index < 0 || next < 0 || next >= list.length) return; [list[index], list[next]] = [list[next], list[index]]; }); }
  function linkActionToDossier(dossierId: string, actionId: string, responsable: string) {
    linkActionToMeeting(actionId, responsable);
    updateDemoData((draft) => {
      const target = draft.meetings.find((item) => item.id === meeting.id);
      const dossier = target?.priorityDossiers.find((item) => item.id === dossierId);
      const action = draft.actions.find((item) => item.id === actionId);
      if (dossier && !dossier.actionIds.includes(actionId)) dossier.actionIds.push(actionId);
      if (action && !action.contextLinks.some((link) => link.module === "meeting" && link.id === meeting.id)) action.contextLinks.push(contextLink);
    });
  }
  function linkExistingActionsToDossier(dossierId: string, actionIds: string[]) {
    for (const actionId of actionIds) {
      const action = data.actions.find((item) => item.id === actionId);
      if (action) linkActionToDossier(dossierId, action.id, action.responsable);
    }
  }
  /** Préparation/Brouillon → Envoyée : déclenché uniquement par un envoi réellement confirmé (e-mail envoyé ou impression lancée), jamais par la simple ouverture du panneau de canaux. Notifie une seule fois (id déterministe), sans ciblage par participant (aucun mécanisme de ce type n'existe dans l'application). */
  function markPreparationSent(channel: MeetingSendChannelType) {
    updateDemoData((draft) => {
      const target = draft.meetings.find((item) => item.id === meeting.id);
      if (!target) return;
      target.status = "Envoyée";
      target.preparationSentAt = new Date().toISOString();
      target.preparationSentVia = channel;
      const notificationId = `NOT-meeting-${target.id}-envoi`;
      if (!draft.notifications.some((item) => item.id === notificationId)) draft.notifications.push({ id: notificationId, title: `Préparation envoyée — ${target.id}`, description: `La préparation de la réunion ${meetingTitle(type)} du ${formatEuropeanDate(target.date)} a été envoyée aux participants.`, href: meetingHref(type), level: "information", read: false });
    });
    setSendPanelOpen(false);
  }
  /** Brouillon/Préparation/Envoyée → En cours : l'envoi préalable reste conseillé mais jamais bloquant. */
  function startMeeting() {
    if (meeting.status !== "Envoyée" && !window.confirm("La préparation n’a pas été envoyée. Voulez-vous quand même lancer la réunion ?")) return;
    updateDemoData((draft) => {
      const target = draft.meetings.find((item) => item.id === meeting.id);
      if (target && ["Brouillon", "Préparation", "Envoyée"].includes(target.status)) { target.status = "En cours"; target.startedAt = new Date().toISOString(); }
    });
    setSeconds(0);
    setRunning(true);
  }
  function closeMeeting() {
    if (!window.confirm(`Clôturer la réunion ${type} et générer le compte rendu de démonstration ?`)) return;
    updateDemoData((draft) => {
      const target = draft.meetings.find((item) => item.id === meeting.id);
      if (target) { target.status = "Terminée"; target.closedAt = new Date().toISOString(); target.decisions.push({ step: steps[steps.length - 1], text: `Réunion clôturée après ${Math.floor(seconds / 60)} minute(s).` }); }
    });
    setRunning(false);
  }
  /** Terminée → Archivée : dernière étape du cycle de vie, la réunion reste consultable en détail (`/reunions/historique`) avec tous ses liens vers les autres modules toujours actifs. */
  function archiveMeeting() {
    if (!window.confirm(`Archiver la réunion ${meeting.id} ? Une nouvelle réunion ${type} pourra alors être démarrée.`)) return;
    updateDemoData((draft) => {
      const target = draft.meetings.find((item) => item.id === meeting.id);
      if (target) { target.status = "Archivée"; target.archivedAt = new Date().toISOString(); }
    });
  }

  return <div className="mx-auto max-w-6xl">
    <ModuleBreadcrumbs items={[{ label: "Réunions", href: "/reunions" }, { label: meetingTitle(type) }, { label: meeting.id }, { label: steps[step] }]} />
    <ModuleHeader eyebrow={`Réunion · ${meeting.id}`} title={meetingTitle(type)} description={`${meetingParticipantNames(meeting.participants, data.contacts).join(", ") || "Aucun participant"}${isLive ? ` · chronomètre ${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}` : ""}`} actions={<>{!isTerminee && !isLive ? <button className={secondaryButton} onClick={() => setSendPanelOpen(true)}>Envoyer la préparation</button> : null}{!isTerminee && !isLive ? <button className={primaryButton} onClick={startMeeting}>Lancer la réunion</button> : null}{isLive ? <button className={primaryButton} onClick={closeMeeting}>Clôturer la réunion</button> : null}<button className={secondaryButton} onClick={() => setCreatingAction(true)}>+ Nouvelle action</button>{isLive ? <button className={secondaryButton} onClick={() => setRunning((value) => !value)}>{running ? "Pause" : "Démarrer le minuteur"}</button> : null}<Link className={secondaryButton} href="/reunions">Quitter</Link></>} />
    {creatingAction ? <ActionFormDialog origine={origine} contextLink={contextLink} allowLinkPicker onClose={() => setCreatingAction(false)} onCreated={linkActionToMeeting} /> : null}
    {sendPanelOpen ? <MeetingSendPanel meeting={meeting} type={type} actionsToReview={actionsToReview} criticalWorkOrders={criticalWorkOrders} onClose={() => setSendPanelOpen(false)} onOpenPrint={() => { setSendPanelOpen(false); setPrintTarget("preparation"); }} onSent={() => markPreparationSent("email")} /> : null}
    <StepTabs steps={steps} activeStep={step} disabled={isTerminee} recapLocked={!isTerminee} onSelect={setStep} />
    {isTerminee
      ? <MeetingRecapWorkspace meeting={meeting} actions={meetingActions} onArchive={archiveMeeting} />
      : <section className="mt-6 rounded-2xl border border-[var(--app-border)] bg-white p-5 sm:p-6">
          <h2 className="text-xl font-semibold">{steps[step]}</h2>
          <StepContent type={type} step={step} data={data} criticalOrders={criticalOrders} origine={origine} meeting={meeting} meetingActions={meetingActions} onActionCreated={linkActionToMeeting} onAddPriorityDossier={addPriorityDossier} onAddPriorityDossierFromAction={addPriorityDossierFromAction} onUpdatePriorityDossier={updatePriorityDossier} onRemovePriorityDossier={removePriorityDossier} onMovePriorityDossier={movePriorityDossier} onDossierActionCreated={linkActionToDossier} onLinkExistingDossierActions={linkExistingActionsToDossier} />
          {isLive ? <div className="mt-6 grid gap-4 sm:grid-cols-3"><QuickInput label="Note rapide" value={note} setValue={setNote} onAdd={addNote} /><QuickInput label="Décision" value={decision} setValue={setDecision} onAdd={addDecision} /><QuickInput label="Parking lot" value={parking} setValue={setParking} onAdd={addParking} /></div> : null}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-2">
              <button className={secondaryButton} disabled={step === 0} onClick={() => setStep((value) => value - 1)}>Précédent</button>
              <button className={secondaryButton} disabled={step === steps.length - 1} onClick={() => setStep((value) => value + 1)}>Suivant</button>
            </div>
            <span className="text-xs text-slate-500">Les commandes de réunion restent disponibles dans l’en-tête.</span>
          </div>
        </section>}
  </div>;
}

/** Navigation libre entre les étapes de la réunion (revenir, sauter en avant), même style de pilules que les onglets de vue d'Actions — en plus des boutons Précédent/Suivant, conservés pour l'avancement linéaire habituel. */
function StepTabs({ steps, activeStep, disabled, recapLocked, onSelect }: { steps: string[]; activeStep: number; disabled: boolean; recapLocked: boolean; onSelect: (step: number) => void }) {
  return <div className="mt-6 flex flex-wrap items-center gap-2 overflow-x-auto pb-1">
    {steps.map((label, index) => <button
      key={label}
      type="button"
      disabled={disabled || (recapLocked && label === "Compte rendu")}
      title={recapLocked && label === "Compte rendu" ? "Le compte rendu sera disponible une fois la réunion terminée." : undefined}
      aria-current={index === activeStep ? "step" : undefined}
      onClick={() => onSelect(index)}
      className={`shrink-0 rounded-full border px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${index === activeStep ? "border-[color-mix(in_srgb,var(--app-primary)_45%,transparent)] bg-[color-mix(in_srgb,var(--app-primary)_10%,white)] text-[var(--app-primary)]" : "border-[var(--app-border)] bg-white text-slate-600 hover:bg-slate-50"}`}
    >{index + 1}. {label}</button>)}
  </div>;
}

function StepContent({ type, step, data, criticalOrders, origine, meeting, meetingActions, onActionCreated, onAddPriorityDossier, onAddPriorityDossierFromAction, onUpdatePriorityDossier, onRemovePriorityDossier, onMovePriorityDossier, onDossierActionCreated, onLinkExistingDossierActions }: { type: "QRQC" | "Production"; step: number; data: ReturnType<typeof useDemoData>; criticalOrders: ReturnType<typeof useDemoData>["workOrders"]; origine: string; meeting: Meeting; meetingActions: ProductionAction[]; onActionCreated: (id: string, responsable: string) => void; onAddPriorityDossier: (kind: MeetingPriorityDossierReferenceKind, id: string | null, title: string) => void; onAddPriorityDossierFromAction: (actionId: string, preparationComment?: string) => void; onUpdatePriorityDossier: (id: string, patch: Partial<MeetingPriorityDossier>) => void; onRemovePriorityDossier: (id: string) => void; onMovePriorityDossier: (id: string, direction: -1 | 1) => void; onDossierActionCreated: (dossierId: string, actionId: string, responsable: string) => void; onLinkExistingDossierActions: (dossierId: string, actionIds: string[]) => void }) {
  if (step === 0) return <MeetingParticipantsPicker meeting={meeting} />;
  if (step === 1) return <MeetingActionsTracker origine={origine} meetingLink={{ module: "meeting", id: meeting.id, label: meeting.id, href: meetingHref(type) }} onActionCreated={onActionCreated} />;
  if (type === "Production" && step === 2) return <MeetingCriticalProjectsReview dossiers={meeting.priorityDossiers} meetingStatus={meeting.status} actions={data.actions} onAdd={onAddPriorityDossier} onAddFromAction={onAddPriorityDossierFromAction} onUpdate={onUpdatePriorityDossier} onRemove={onRemovePriorityDossier} onMove={onMovePriorityDossier} onActionCreated={onDossierActionCreated} onLinkExistingActions={onLinkExistingDossierActions} />;
  if (type === "Production" && step === 3) return <MaintenanceProblemsWorkspace meetingId={meeting.id} />;
  if (type === "Production" && step === 4) return <MeetingFieldRound meeting={meeting} onActionCreated={onActionCreated} />;
  if (type === "Production" && step === 5) return <MeetingMachineReview origine={origine} onActionCreated={onActionCreated} />;
  if (type === "QRQC" && [2, 3, 4, 5].includes(step)) return <div className="mt-4 grid gap-3">{criticalOrders.map((order) => <article key={order.id} className="rounded-xl border border-[var(--app-border)] p-4"><div className="flex flex-wrap justify-between gap-2"><Link href={`/of/${order.id}`} className="font-semibold text-[var(--app-primary)]">{order.id} · {order.customer}</Link><StatusPill tone={order.status === "Bloqué" ? "danger" : "warning"}>{order.status}</StatusPill></div><p className="mt-2 text-sm">Cet OF a-t-il besoin de quelque chose ?</p><div className="mt-2 flex flex-wrap gap-1">{needs.map((need) => <button key={need} className="rounded-full border px-2.5 py-1 text-xs hover:bg-slate-50">{need}</button>)}</div></article>)}</div>;
  if (type === "Production" && step === 6) return <MeetingRequestsReview requests={data.requests.filter((item) => item.status !== "Terminée")} origine={origine} onActionCreated={onActionCreated} />;
  if (type === "Production" && step === 7) return <MeetingRecap meeting={meeting} actions={meetingActions} />;
  if (type === "QRQC" && step >= 6) return <List items={[`${data.actions.filter((item) => item.statut !== "Fait").length} actions ouvertes`, `${data.requests.filter((item) => item.status !== "Terminée").length} demandes actives`, `${data.machines.filter((item) => item.status === "En panne").length} machine en panne`]} />;
  return <p className="mt-4 text-sm text-slate-600">Ajoutez les décisions et points à suivre dans les champs ci-dessous.</p>;
}

function List({ items }: { items: string[] }) { return <ul className="mt-4 grid gap-2">{items.map((item) => <li key={item} className="rounded-lg bg-slate-50 p-3 text-sm">{item}</li>)}</ul>; }
function QuickInput({ label, value, setValue, onAdd }: { label: string; value: string; setValue: (value: string) => void; onAdd: () => void }) { return <div><label className="text-xs font-semibold uppercase text-slate-500">{label}</label><div className="mt-1 flex gap-1"><input className={`${fieldClass} min-w-0 flex-1`} value={value} onChange={(event) => setValue(event.target.value)} /><button className={secondaryButton} onClick={onAdd}>Ajouter</button></div></div>; }

/** Affiché quand aucune réunion de ce type n'est en cours (la précédente a été archivée, ou aucune n'existe encore) : les participants de la dernière réunion sont repris automatiquement (tous « Présent »), pour ne pas les ressaisir à chaque fois. La nouvelle réunion démarre en Brouillon, visible uniquement par son créateur. */
function NewMeetingPrompt({ type, carriedParticipants, contacts, onStart }: { type: "QRQC" | "Production"; carriedParticipants: MeetingParticipant[]; contacts: Contact[]; onStart: () => void }) {
  const names = meetingParticipantNames(carriedParticipants, contacts);
  return <div className="mx-auto max-w-6xl">
    <ModuleHeader eyebrow="Réunion" title={meetingTitle(type)} description="Aucune réunion en cours pour ce rituel." actions={<Link className={secondaryButton} href="/reunions">Retour</Link>} />
    <section className="mt-6 rounded-2xl border border-[var(--app-border)] bg-white p-6 text-center">
      <p className="text-sm text-slate-600">{names.length ? `Les ${names.length} participants de la dernière réunion (${names.join(", ")}) seront repris automatiquement, tous marqués Présent — modifiables ensuite.` : "Aucun participant n’a été retrouvé pour la réunion précédente."} La réunion démarre en Brouillon, visible uniquement par vous.</p>
      <button type="button" className={`${primaryButton} mt-4`} onClick={onStart}>Démarrer une nouvelle réunion</button>
    </section>
  </div>;
}
