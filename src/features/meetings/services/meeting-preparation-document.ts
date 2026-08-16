import { meetingSteps } from "./meeting-steps.ts";
import type { Contact, MaintenanceProblem, Meeting, MeetingStepEntry, ProductionAction, WorkOrder } from "@/features/demo/types/demo";

/** Même construction que `contactFullName` (`src/features/contacts/services/contact-directory.ts`), dupliquée ici pour la même raison que `formatEuropeanDate` ci-dessous. */
function contactFullName(contact: Contact): string {
  return `${contact.firstName} ${contact.lastName}`.trim();
}

/** Même format que `formatEuropeanDate` (`src/components/ui/ModuleUi.tsx`), dupliqué ici pour que ce service reste exécutable directement par le test runner Node (sans alias `@/` en import de valeur, non résolu hors du bundler Next.js). */
function formatEuropeanDate(isoDateTime: string, withTime = false): string {
  return new Intl.DateTimeFormat("fr-BE", withTime ? { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Brussels" } : { dateStyle: "short", timeZone: "Europe/Brussels" }).format(new Date(isoDateTime));
}

function meetingTitle(type: "QRQC" | "Production"): string {
  return type === "QRQC" ? "QRQC quotidien" : "Réunion Production";
}

function bulletList(items: string[], emptyLabel: string): string {
  return items.length ? items.map((item) => `- ${item}`).join("\n") : emptyLabel;
}

/** Même construction que `meeting-recap-email.ts` (dupliquée pour la même raison — exécutable par le test runner Node). */
function participantsLine(meeting: Meeting, contacts: Contact[]): string {
  const byId = new Map(contacts.map((contact) => [contact.id, contact]));
  const labels = meeting.participants.map((participant) => byId.get(participant.contactId)).filter((contact): contact is Contact => contact !== undefined).map(contactFullName);
  return labels.length ? labels.join(", ") : "aucun renseigné";
}

function responsableLine(meeting: Meeting, contacts: Contact[]): string {
  const responsable = meeting.responsableContactId ? contacts.find((contact) => contact.id === meeting.responsableContactId) : undefined;
  return responsable ? contactFullName(responsable) : "non désigné";
}

/**
 * Reconstitue ce qui a déjà été préparé (notes/décisions saisies avant l'envoi), étape par étape,
 * dans l'ordre du déroulé du rituel — même logique que `buildStepByStepSection` de
 * `meeting-recap-email.ts`, dupliquée ici pour la même raison (test runner Node).
 */
function buildPreparedTopicsSection(type: "QRQC" | "Production", notes: MeetingStepEntry[], decisions: MeetingStepEntry[]): string {
  const notesByStep = new Map<string, string[]>();
  for (const entry of notes) notesByStep.set(entry.step, [...(notesByStep.get(entry.step) ?? []), entry.text]);
  const decisionsByStep = new Map<string, string[]>();
  for (const entry of decisions) decisionsByStep.set(entry.step, [...(decisionsByStep.get(entry.step) ?? []), entry.text]);
  const orderedSteps = [...meetingSteps(type)];
  for (const step of [...notesByStep.keys(), ...decisionsByStep.keys()]) if (!orderedSteps.includes(step)) orderedSteps.push(step);
  const blocks = orderedSteps.map((step) => {
    const stepNotes = notesByStep.get(step) ?? [];
    const stepDecisions = decisionsByStep.get(step) ?? [];
    if (!stepNotes.length && !stepDecisions.length) return null;
    return [`${step} :`, ...stepNotes.map((text) => `  - ${text}`), ...stepDecisions.map((text) => `  - ${text}`)].join("\n");
  }).filter((block): block is string => block !== null);
  return blocks.length ? blocks.join("\n\n") : "Rien n'a encore été préparé.";
}

/**
 * Compose le sujet et le corps du document de préparation (ordre du jour) d'une réunion, envoyé
 * avant le jour J — uniquement à partir des données déjà rattachées à la réunion (jamais de copie :
 * les actions/projets critiques restent identifiés par leur id, ce document n'est qu'un résumé
 * textuel à un instant donné). Jamais d'appel IA pour ce texte déterministe.
 */
function escapeHtml(value: string): string { return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!); }

function compactHtmlList(items: string[], emptyLabel: string): string {
  if (!items.length) return `<p style="margin:0;color:#64748b;font-size:13px">${escapeHtml(emptyLabel)}</p>`;
  return `<ul style="margin:0;padding-left:18px;color:#334155;font-size:13px;line-height:1.5">${items.map((item) => `<li style="margin:0 0 4px">${escapeHtml(item)}</li>`).join("")}</ul>`;
}

function sectionHtml(number: string, title: string, content: string): string {
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:20px;border-collapse:collapse"><tr><td width="38" valign="top"><div style="width:30px;height:30px;border-radius:8px;background:#312e81;color:#fff;text-align:center;line-height:30px;font-size:12px;font-weight:700">${number}</div></td><td valign="middle"><h2 style="margin:0;font-size:16px;color:#0f172a">${escapeHtml(title)}</h2></td></tr><tr><td></td><td style="padding-top:9px">${content}</td></tr></table>`;
}

export function buildMeetingPreparationDocument(meeting: Meeting, type: "QRQC" | "Production", actionsToReview: ProductionAction[], criticalWorkOrders: WorkOrder[], contacts: Contact[], maintenanceProblems: MaintenanceProblem[] = [], machineNames: Record<string, string> = {}): { subject: string; bodyText: string; bodyHtml: string; inlineImages: { contentId: string; mimeType: "image/jpeg" | "image/png" | "image/webp"; base64: string; filename: string }[] } {
  const title = meetingTitle(type);
  const date = formatEuropeanDate(meeting.date, true);
  const subject = `Préparation — ${title} du ${date}`;
  const actionLines = actionsToReview.map((action) => `${action.description} — ${action.responsable || "sans responsable"}, échéance ${formatEuropeanDate(`${action.echeance}T00:00:00.000Z`)}`);
  const workOrdersById = new Map(criticalWorkOrders.map((order) => [order.id, order]));
  const dossierLines = (meeting.priorityDossiers ?? []).flatMap((dossier, index) => {
    const workOrder = dossier.referenceKind === "workOrder" && dossier.referenceId ? workOrdersById.get(dossier.referenceId) : undefined;
    const source = workOrder ? `${workOrder.id} · ${workOrder.customer} · ${workOrder.article}, livraison ${formatEuropeanDate(`${workOrder.dueDate}T00:00:00.000Z`)}` : dossier.referenceId;
    return [`${index + 1}. ${dossier.title}${source ? ` — ${source}` : ""}`, ...(dossier.description ? [`   ${dossier.description}`] : []), ...(dossier.preparationComment ? [`   Préparation : ${dossier.preparationComment}`] : [])];
  });
  const maintenanceLines = (meeting.maintenanceProblemIds ?? []).flatMap((problemId) => {
    const problem = maintenanceProblems.find((item) => item.id === problemId);
    if (!problem) return [];
    const openActions = problem.actionIds.filter((actionId) => actionsToReview.some((action) => action.id === actionId)).length;
    return [`${machineNames[problem.machineId] ?? problem.machineId} — ${problem.title} (${problem.status})${problem.productionImpact ? ` — ${problem.productionImpact}` : ""}${openActions ? ` — ${openActions} action(s) ouverte(s)` : ""}`];
  });
  const bodyText = [
    "Bonjour,",
    "",
    `Voici la préparation de la ${title} du ${date}.`,
    "Merci d'en prendre connaissance avant la réunion et de préparer les éventuels points vous concernant.",
    "",
    "INFORMATIONS PRATIQUES",
    `Responsable : ${responsableLine(meeting, contacts)}`,
    `Participants prévus : ${participantsLine(meeting, contacts)}`,
    "",
    "ORDRE DU JOUR",
    bulletList(meetingSteps(type), "Aucune étape définie."),
    "",
    "ACTIONS À REVOIR",
    bulletList(actionLines, "Aucune action à revoir."),
    ...(type === "Production" ? ["", "DOSSIERS PRIORITAIRES", bulletList(dossierLines, "Aucun dossier prioritaire.")] : []),
    ...(type === "Production" ? ["", "MAINTENANCE", bulletList(maintenanceLines, "Aucun problème maintenance sélectionné.")] : []),
    "",
    "SUJETS DÉJÀ PRÉPARÉS",
    buildPreparedTopicsSection(type, meeting.notes, meeting.decisions),
    ...(type === "Production" ? ["", "PLANNING MACHINES", "Le planning détaillé est disponible dans le PDF joint : photos, 3 OF par machine, descriptions, quantités et dates."] : []),
    "",
    "Merci de signaler avant la réunion toute information manquante ou modification nécessaire.",
    "",
    "Bien cordialement.",
  ].join("\n");
  const preparedTopics = buildPreparedTopicsSection(type, meeting.notes, meeting.decisions);
  const informationHtml = `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:separate;border-spacing:0;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px"><tr><td style="padding:12px 14px;border-bottom:1px solid #e2e8f0;font-size:12px;color:#64748b">DATE ET HEURE<br><strong style="font-size:14px;color:#0f172a">${escapeHtml(date)}</strong></td><td style="padding:12px 14px;border-bottom:1px solid #e2e8f0;font-size:12px;color:#64748b">RESPONSABLE<br><strong style="font-size:14px;color:#0f172a">${escapeHtml(responsableLine(meeting, contacts))}</strong></td></tr><tr><td colspan="2" style="padding:12px 14px;font-size:12px;color:#64748b">PARTICIPANTS<br><strong style="font-size:14px;color:#0f172a">${escapeHtml(participantsLine(meeting, contacts))}</strong></td></tr></table>`;
  const bodyHtml = `<div style="font-family:Arial,sans-serif;max-width:760px;margin:auto;color:#0f172a;background:#fff"><div style="padding:24px;border:1px solid #e2e8f0;border-radius:14px"><p style="margin:0 0 10px;font-size:15px"><strong>Bonjour,</strong></p><p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#334155">Voici la préparation de la <strong>${escapeHtml(title)}</strong> du <strong>${escapeHtml(date)}</strong>.</p><p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#334155">Merci d’en prendre connaissance avant la réunion et de préparer les éventuels points vous concernant.</p>${informationHtml}${sectionHtml("01", "Ordre du jour", compactHtmlList(meetingSteps(type), "Aucune étape définie."))}${sectionHtml("02", "Actions à revoir", compactHtmlList(actionLines, "Aucune action à revoir."))}${type === "Production" ? sectionHtml("03", "Dossiers prioritaires", compactHtmlList(dossierLines, "Aucun dossier prioritaire.")) + sectionHtml("04", "Maintenance", compactHtmlList(maintenanceLines, "Aucun problème maintenance sélectionné.")) : ""}${sectionHtml(type === "Production" ? "05" : "03", "Sujets déjà préparés", `<p style="margin:0;white-space:pre-wrap;font-size:13px;line-height:1.55;color:#475569">${escapeHtml(preparedTopics)}</p>`)}${type === "Production" ? `<div style="margin-top:22px;padding:16px 18px;border-left:4px solid #4f46e5;border-radius:8px;background:#eef2ff"><div style="font-size:15px;font-weight:700;color:#312e81">Planning machines en pièce jointe</div><p style="margin:5px 0 0;font-size:13px;line-height:1.5;color:#475569">Le PDF contient les photos, les 3 OF par machine, les descriptions, les quantités et les dates.</p></div>` : ""}<div style="margin-top:24px;padding-top:18px;border-top:1px solid #e2e8f0"><p style="margin:0;font-size:13px;line-height:1.6;color:#475569">Merci de signaler avant la réunion toute information manquante ou modification nécessaire.</p><p style="margin:14px 0 0;font-size:13px;color:#334155">Bien cordialement.</p></div></div></div>`;
  return { subject, bodyText, bodyHtml, inlineImages: [] };
}
