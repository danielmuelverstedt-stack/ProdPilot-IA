"use client";

import { useMemo, useState } from "react";
import { fieldClass, formatEuropeanDate, primaryButton, secondaryButton, StatusPill } from "@/components/ui/ModuleUi";
import { PhotoThumbnail } from "@/components/ui/PhotoThumbnail";
import { ActionFormDialog } from "@/features/actions/components/ActionFormDialog";
import { contactFullName } from "@/features/contacts/services/contact-directory";
import { useContactPhotos } from "@/features/contacts/services/contact-photo-store";
import { useDemoData } from "@/features/demo/services/demo-repository";
import { deleteMeetingFieldPoint, markMeetingParticipantNoIssue, saveMeetingFieldPoint } from "@/features/meetings/services/meeting-field-round-service";
import { useSettings } from "@/features/settings/components/SettingsProvider";
import type { ActionContextLink, Contact, Meeting, MeetingFieldPoint } from "@/features/demo/types/demo";

export function MeetingFieldRound({ meeting, onActionCreated }: { meeting: Meeting; onActionCreated: (id: string, responsable: string) => void }) {
  const data = useDemoData();
  const { settings } = useSettings();
  const photos = useContactPhotos();
  const participants = useMemo(() => meeting.participants.filter((item) => item.present).map((item) => data.contacts.find((contact) => contact.id === item.contactId)).filter((item): item is Contact => item !== undefined), [data.contacts, meeting.participants]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [text, setText] = useState("");
  const [comments, setComments] = useState("");
  const [machineIds, setMachineIds] = useState<string[]>([]);
  const [workOrderIds, setWorkOrderIds] = useState<string[]>([]);
  const [dossierIds, setDossierIds] = useState<string[]>([]);
  const [linkedActionIds, setLinkedActionIds] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | undefined>();
  const [creatingAction, setCreatingAction] = useState(false);
  const [showLinks, setShowLinks] = useState<"machine" | "workOrder" | "dossier" | null>(null);
  const [roundFinished, setRoundFinished] = useState(false);
  const current = participants[Math.min(currentIndex, Math.max(0, participants.length - 1))];
  const completed = new Set(meeting.fieldRoundCompletedContactIds);
  const allCompleted = participants.length > 0 && participants.every((contact) => completed.has(contact.id));

  function resetDraft() { setText(""); setComments(""); setMachineIds([]); setWorkOrderIds([]); setDossierIds([]); setLinkedActionIds([]); setEditingId(undefined); setShowLinks(null); }
  function goTo(index: number) { resetDraft(); setCurrentIndex(Math.max(0, Math.min(index, participants.length - 1))); }
  function save(actionIds: string[] = linkedActionIds) {
    if (!current || !text.trim()) return;
    saveMeetingFieldPoint(meeting.id, { participantContactId: current.id, authorContactId: meeting.responsableContactId, text, comments, actionIds, machineIds, workOrderIds, priorityDossierIds: dossierIds }, editingId);
    resetDraft();
    if (currentIndex < participants.length - 1) setCurrentIndex(currentIndex + 1);
  }
  function noIssue() {
    if (!current) return;
    markMeetingParticipantNoIssue(meeting.id, current.id);
    resetDraft();
    if (currentIndex < participants.length - 1) setCurrentIndex(currentIndex + 1);
  }
  function edit(point: MeetingFieldPoint) {
    const index = participants.findIndex((item) => item.id === point.participantContactId);
    if (index >= 0) setCurrentIndex(index);
    setText(point.text); setComments(point.comments); setMachineIds(point.machineIds); setWorkOrderIds(point.workOrderIds); setDossierIds(point.priorityDossierIds); setLinkedActionIds(point.actionIds); setEditingId(point.id);
  }
  function toggle(list: string[], value: string, setter: (next: string[]) => void) { setter(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]); }
  const additionalContextLinks: ActionContextLink[] = [
    ...machineIds.map((id) => ({ module: "machine" as const, id, label: settings.production.machines.find((item) => item.id === id)?.displayName ?? id, href: `/machines/${id}` })),
    ...workOrderIds.map((id) => ({ module: "workOrder" as const, id, label: id, href: `/of/${id}` })),
  ];

  if (meeting.status !== "En cours") return <div className="mt-4 rounded-2xl border border-dashed p-8 text-center"><h3 className="font-semibold">Disponible pendant la réunion</h3><p className="mt-2 text-sm text-slate-500">Lancez la réunion pour commencer le tour de table.</p></div>;
  if (!participants.length) return <div className="mt-4 rounded-2xl border border-dashed p-8 text-center"><h3 className="font-semibold">Aucun participant présent</h3><p className="mt-2 text-sm text-slate-500">Ajoutez ou marquez des participants présents dans la catégorie Participants.</p></div>;

  return <div className="mt-4 grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
    <aside className="rounded-2xl border border-[var(--app-border)] bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase text-slate-500">Avancement</p>
      <div className="mt-3 grid gap-1">{participants.map((contact, index) => <button key={contact.id} type="button" onClick={() => goTo(index)} className={`flex items-center gap-2 rounded-xl px-3 py-2 text-left text-sm ${index === currentIndex ? "bg-white font-semibold shadow-sm ring-1 ring-[var(--app-primary)]" : "hover:bg-white"}`}><span aria-hidden>{completed.has(contact.id) ? "●" : index === currentIndex ? "●" : "○"}</span><span className={completed.has(contact.id) ? "text-emerald-700" : index === currentIndex ? "text-amber-700" : "text-slate-500"}>{contactFullName(contact)}</span></button>)}</div>
      <div className="mt-5 border-t pt-4"><p className="text-xs font-semibold uppercase text-slate-500">Points déjà remontés</p>{meeting.fieldPoints.length ? <div className="mt-2 grid gap-2">{meeting.fieldPoints.map((point) => { const contact = data.contacts.find((item) => item.id === point.participantContactId); return <details key={point.id} className="rounded-lg bg-white p-2 text-sm"><summary className="cursor-pointer font-medium">{contact ? contactFullName(contact) : "Contact supprimé"} · {point.text}</summary><p className="mt-2 text-xs text-slate-500">{formatEuropeanDate(point.createdAt, true)}</p>{point.comments ? <p className="mt-2">{point.comments}</p> : null}<div className="mt-2 flex gap-2"><button className="text-xs font-semibold text-[var(--app-primary)]" onClick={() => edit(point)}>Modifier</button><button className="text-xs font-semibold text-red-600" onClick={() => { if (window.confirm("Supprimer cette remontée terrain ?")) deleteMeetingFieldPoint(meeting.id, point.id); }}>Supprimer</button></div></details>; })}</div> : <p className="mt-2 text-sm text-slate-500">Aucune remontée terrain.</p>}</div>
    </aside>
    <section className="rounded-2xl border border-[var(--app-border)] bg-white p-5 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase text-slate-500">Participant {currentIndex + 1} / {participants.length}</p><h3 className="mt-1 text-xl font-bold">Remontées terrain</h3></div><StatusPill tone={completed.has(current.id) ? "success" : "warning"}>{completed.has(current.id) ? "Terminé" : "En cours"}</StatusPill></div>
      <div className="mt-6 grid gap-5 sm:grid-cols-[150px_minmax(0,1fr)]"><div className="text-center"><PhotoThumbnail photoDataUrl={photos[current.id]} alt={contactFullName(current)} size="md" /><p className="mt-3 font-semibold">{contactFullName(current)}</p><p className="text-sm text-slate-500">{current.role || "Fonction non renseignée"}</p><p className="text-xs text-slate-400">{settings.contacts.categories.filter((category) => current.categoryIds.includes(category.id)).map((category) => category.label).join(", ") || "Service non renseigné"}</p></div><div><label className="text-base font-semibold">Quel est votre point ?<textarea autoFocus className={`${fieldClass} mt-2 min-h-44 w-full resize-y py-3 text-base`} value={text} onChange={(event) => setText(event.target.value)} placeholder="Décrivez le point susceptible d’impacter la production…" /></label><label className="mt-4 block text-sm font-semibold">Commentaires complémentaires <span className="font-normal text-slate-400">(facultatif)</span><textarea className={`${fieldClass} mt-2 min-h-20 w-full py-3 font-normal`} value={comments} onChange={(event) => setComments(event.target.value)} /></label></div></div>
      {text.trim() ? <div className="mt-5 flex flex-wrap gap-2"><button className={primaryButton} onClick={() => setCreatingAction(true)}>Créer une action</button><button className={secondaryButton} onClick={() => setShowLinks("machine")}>Lier à une machine</button><button className={secondaryButton} onClick={() => setShowLinks("workOrder")}>Lier à un OF</button><button className={secondaryButton} onClick={() => setShowLinks("dossier")}>Lier à un dossier prioritaire</button><button className={secondaryButton} onClick={() => save()}>Conserver uniquement comme information</button></div> : <button className={`${primaryButton} mt-5 w-full sm:w-auto`} onClick={noIssue}>Rien à signaler</button>}
      {showLinks ? <div className="mt-4 rounded-xl bg-slate-50 p-4">{showLinks === "machine" ? <CheckboxList title="Machines" items={settings.production.machines.map((item) => ({ id: item.id, label: item.displayName }))} selected={machineIds} onToggle={(id) => toggle(machineIds, id, setMachineIds)} /> : showLinks === "workOrder" ? <CheckboxList title="OF" items={data.workOrders.map((item) => ({ id: item.id, label: `${item.id} · ${item.customer} · ${item.description}` }))} selected={workOrderIds} onToggle={(id) => toggle(workOrderIds, id, setWorkOrderIds)} /> : <CheckboxList title="Dossiers prioritaires" items={meeting.priorityDossiers.map((item) => ({ id: item.id, label: item.title }))} selected={dossierIds} onToggle={(id) => toggle(dossierIds, id, setDossierIds)} />}</div> : null}
      <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t pt-5"><div className="flex gap-2"><button className={secondaryButton} disabled={currentIndex === 0} onClick={() => goTo(currentIndex - 1)}>← Participant précédent</button><button className={secondaryButton} disabled={currentIndex === participants.length - 1} onClick={() => goTo(currentIndex + 1)}>Participant suivant →</button></div>{allCompleted ? <button className={primaryButton} onClick={() => setRoundFinished(true)}>Terminer le tour de table</button> : null}</div>
      {roundFinished ? <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm font-medium text-emerald-800">Tour de table terminé : tous les participants présents ont été traités.</p> : null}
      {creatingAction ? <ActionFormDialog origine="Réunion de production" contextLink={{ module: "meeting", id: meeting.id, label: meeting.id, href: "/reunions/production" }} additionalContextLinks={additionalContextLinks} initialDescription={text} onClose={() => setCreatingAction(false)} onCreated={(id, responsable) => { save([...linkedActionIds, id]); onActionCreated(id, responsable); }} /> : null}
    </section>
  </div>;
}

function CheckboxList({ title, items, selected, onToggle }: { title: string; items: Array<{ id: string; label: string }>; selected: string[]; onToggle: (id: string) => void }) {
  const [query, setQuery] = useState("");
  const visible = items.filter((item) => `${item.id} ${item.label}`.toLocaleLowerCase("fr").includes(query.trim().toLocaleLowerCase("fr"))).slice(0, 50);
  return <div><label className="text-sm font-semibold">{title}<input className={`${fieldClass} mt-2 w-full bg-white font-normal`} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher…" /></label><div className="mt-2 grid max-h-48 gap-1 overflow-y-auto">{visible.map((item) => <label key={item.id} className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm"><input type="checkbox" checked={selected.includes(item.id)} onChange={() => onToggle(item.id)} /><span>{item.label}</span></label>)}</div></div>;
}
