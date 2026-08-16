import { meetingSteps } from "./meeting-steps.ts";
import { groupMeetingRecapSection, parseMeetingRecapDocument } from "./meeting-recap-presentation.ts";
import type { Contact, MaintenanceProblem, Meeting, MeetingParticipant, MeetingStepEntry, ProductionAction } from "@/features/demo/types/demo";

/** Même construction que `contactFullName` (`src/features/contacts/services/contact-directory.ts`), dupliquée ici pour la même raison que `formatEuropeanDate` ci-dessous. */
function contactFullName(contact: Contact): string {
  return `${contact.firstName} ${contact.lastName}`.trim();
}

/** Même format que `formatEuropeanDate` (`src/components/ui/ModuleUi.tsx`), dupliqué ici pour que ce service reste exécutable directement par le test runner Node (sans alias `@/` en import de valeur, non résolu hors du bundler Next.js). */
function formatEuropeanDate(isoDateTime: string): string {
  return new Intl.DateTimeFormat("fr-BE", { dateStyle: "short", timeZone: "Europe/Brussels" }).format(new Date(isoDateTime));
}

/**
 * Retrouve l'adresse e-mail de chaque participant marqué Présent, en le faisant correspondre à sa
 * fiche du module Contacts (référencée par `contactId`, jamais par nom depuis que les participants
 * sont des références Contacts) — un participant absent n'est pas destinataire du récap ; un
 * participant présent sans adresse renseignée (ou dont le contact a été supprimé depuis) n'a pas
 * d'adresse connue et ne peut pas le recevoir ; jamais d'adresse inventée.
 */
export function resolveParticipantEmails(participants: MeetingParticipant[], contacts: Contact[]): { resolved: { name: string; email: string }[]; unresolved: string[] } {
  const byId = new Map(contacts.map((contact) => [contact.id, contact]));
  const resolved: { name: string; email: string }[] = [];
  const unresolved: string[] = [];
  for (const participant of participants.filter((item) => item.present)) {
    const contact = byId.get(participant.contactId);
    if (contact?.email) resolved.push({ name: contactFullName(contact), email: contact.email });
    else if (contact) unresolved.push(contactFullName(contact));
  }
  return { resolved, unresolved };
}

function meetingTitle(type: "QRQC" | "Production"): string {
  return type === "QRQC" ? "QRQC quotidien" : "Réunion Production";
}

function bulletList(items: string[], emptyLabel: string): string {
  return items.length ? items.map((item) => `- ${item}`).join("\n") : emptyLabel;
}

/** Regroupe les entrées (notes ou décisions) par étape, dans leur ordre d'ajout au sein de chaque étape. */
function groupByStep(entries: MeetingStepEntry[]): Map<string, string[]> {
  const byStep = new Map<string, string[]>();
  for (const entry of entries) byStep.set(entry.step, [...(byStep.get(entry.step) ?? []), entry.text]);
  return byStep;
}

/**
 * Reconstitue le déroulé de la réunion étape par étape (ce qui a été noté et décidé à chacune),
 * dans l'ordre du déroulé du rituel — plutôt que deux listes plates sans lien avec le moment où
 * chaque point a été abordé. Une étape sans note ni décision n'apparaît pas. Une entrée dont
 * l'étape ne correspond à aucune étape connue (réunion migrée depuis l'ancien format à plat)
 * apparaît quand même, à la suite, sous son propre libellé — jamais silencieusement perdue.
 */
function buildStepByStepSection(type: "QRQC" | "Production", notes: MeetingStepEntry[], decisions: MeetingStepEntry[]): string {
  const notesByStep = groupByStep(notes);
  const decisionsByStep = groupByStep(decisions);
  const orderedSteps = [...meetingSteps(type)];
  for (const step of [...notesByStep.keys(), ...decisionsByStep.keys()]) if (!orderedSteps.includes(step)) orderedSteps.push(step);
  const blocks = orderedSteps.map((step) => {
    const stepNotes = notesByStep.get(step) ?? [];
    const stepDecisions = decisionsByStep.get(step) ?? [];
    if (!stepNotes.length && !stepDecisions.length) return null;
    return [`${step} :`, ...stepNotes.map((text) => `  - ${text}`), ...stepDecisions.map((text) => `  - Décision : ${text}`)].join("\n");
  }).filter((block): block is string => block !== null);
  return blocks.length ? blocks.join("\n\n") : "Rien n'a été noté pendant cette réunion.";
}

/** Nom de chaque participant retrouvé dans Contacts, suffixé « (absent) » pour qui n'a pas été marqué présent — un participant dont le contact a été supprimé depuis n'apparaît plus, sans faire échouer la composition du récap. */
function participantsLine(participants: MeetingParticipant[], contacts: Contact[]): string {
  const byId = new Map(contacts.map((contact) => [contact.id, contact]));
  const labels = participants
    .map((participant) => {
      const contact = byId.get(participant.contactId);
      if (!contact) return null;
      const name = contactFullName(contact);
      return participant.present ? name : `${name} (absent)`;
    })
    .filter((label): label is string => label !== null);
  return labels.length ? labels.join(", ") : "aucun renseigné";
}

/** Compose le sujet et le corps du récap, uniquement à partir des données de la réunion — jamais d'appel IA pour ce texte déterministe. */
export function buildMeetingRecapEmail(meeting: Meeting, type: "QRQC" | "Production", meetingActions: ProductionAction[], contacts: Contact[], maintenanceProblems: MaintenanceProblem[] = [], machineNames: Record<string, string> = {}): { subject: string; bodyText: string } {
  const title = meetingTitle(type);
  // `meeting.date` est déjà un ISO datetime complet (vendredi de la semaine à la création), contrairement à `action.echeance` (simple date) ci-dessous — ne jamais lui ajouter de suffixe d'heure.
  const date = formatEuropeanDate(meeting.date);
  const subject = `Compte rendu — ${title} du ${date}`;
  const actionLines = meetingActions.map((action) => `${action.description} — ${action.responsable || "sans responsable"}, échéance ${formatEuropeanDate(`${action.echeance}T00:00:00.000Z`)} (${action.statut})`);
  const dossierLines = (meeting.priorityDossiers ?? []).flatMap((dossier, index) => [
    `${index + 1}. ${dossier.title} (${dossier.status})`,
    ...(dossier.meetingComment ? [`   Échanges : ${dossier.meetingComment}`] : []),
    ...(dossier.decision ? [`   Décision : ${dossier.decision}`] : []),
  ]);
  const maintenanceLines = (meeting.maintenanceProblemIds ?? []).flatMap((problemId) => {
    const problem = maintenanceProblems.find((item) => item.id === problemId);
    if (!problem) return [];
    const linkedActions = meetingActions.filter((action) => problem.actionIds.includes(action.id));
    return [`${machineNames[problem.machineId] ?? problem.machineId} — ${problem.title} — statut final : ${problem.status}`, ...problem.comments.slice(-1).map((item) => `   Commentaire : ${item.text}`), ...linkedActions.map((action) => `   Action : ${action.description} (${action.statut})`)];
  });
  const fieldPointLines = (meeting.fieldPoints ?? []).flatMap((point) => {
    const participant = contacts.find((item) => item.id === point.participantContactId);
    if (!participant) return [];
    const linkedActions = meetingActions.filter((action) => point.actionIds.includes(action.id));
    const dossierLabels = point.priorityDossierIds.map((id) => meeting.priorityDossiers.find((item) => item.id === id)?.title).filter((item): item is string => Boolean(item));
    return [
      `${contactFullName(participant)} — ${point.text}`,
      ...(point.comments ? [`   Commentaires : ${point.comments}`] : []),
      ...(point.machineIds.length ? [`   Machines : ${point.machineIds.map((id) => machineNames[id] ?? id).join(", ")}`] : []),
      ...(point.workOrderIds.length ? [`   OF : ${point.workOrderIds.join(", ")}`] : []),
      ...(dossierLabels.length ? [`   Dossiers prioritaires : ${dossierLabels.join(", ")}`] : []),
      ...linkedActions.map((action) => `   Action : ${action.description} (${action.statut})`),
    ];
  });
  const bodyText = [
    `Compte rendu — ${title} du ${date}`,
    "",
    `Participants : ${participantsLine(meeting.participants, contacts)}`,
    "",
    "Dossiers prioritaires :",
    bulletList(dossierLines, "Aucun dossier prioritaire."),
    "",
    "Maintenance :",
    bulletList(maintenanceLines, "Aucun problème maintenance abordé."),
    "",
    ...(fieldPointLines.length ? ["Remontées terrain :", bulletList(fieldPointLines, ""), ""] : []),
    "Déroulé de la réunion :",
    buildStepByStepSection(type, meeting.notes, meeting.decisions),
    "",
    "Actions créées ou suivies pendant la réunion :",
    bulletList(actionLines, "Aucune action liée."),
    "",
    "Points au parking lot :",
    bulletList(meeting.parkingLot, "Aucun point en attente."),
    "",
    "Message généré depuis ProdPilot IA, sans intervention de l'IA sur ce contenu.",
  ].join("\n");
  return { subject, bodyText };
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function groupHtml(title: string, details: string[], color: string): string {
  const detailRows = details.map((detail) => {
    const decision = /^Décision\s*:/i.test(detail);
    return `<tr><td style="padding:6px 10px 6px 15px;border-top:1px solid #e5ebef;font-size:12px;line-height:1.5;color:${decision ? "#14534f" : "#526777"};${decision ? "background:#ecfdf5;font-weight:700;border-left:3px solid #087c75;" : ""}">${escapeHtml(detail)}</td></tr>`;
  }).join("");
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 9px;border:1px solid #dbe4ea;border-left:4px solid ${color};border-radius:7px;background:#ffffff;"><tr><td style="padding:10px 12px;font-size:13px;font-weight:700;line-height:1.45;color:#102a43;">${escapeHtml(title)}</td></tr>${detailRows}</table>`;
}

export interface MeetingRecapInlineImage { contentId: string; mimeType: "image/jpeg" | "image/png" | "image/webp"; base64: string; filename: string }

/** Convertit le logo configuré en pièce MIME CID : les messageries bloquent fréquemment les images `data:`. */
export function buildMeetingRecapInlineImages(logoDataUrl?: string): MeetingRecapInlineImage[] {
  if (!logoDataUrl) return [];
  const match = logoDataUrl.match(/^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/);
  if (!match) return [];
  const extension = match[1] === "image/jpeg" ? "jpg" : match[1].split("/")[1];
  return [{ contentId: "meeting-recap-logo", mimeType: match[1] as MeetingRecapInlineImage["mimeType"], base64: match[2], filename: `logo-compte-rendu.${extension}` }];
}

/** Produit un e-mail visuel en HTML inline, compatible avec les principaux clients Gmail et Outlook. */
export function buildMeetingRecapEmailHtml(input: { subject: string; mailBody: string; documentBody: string; companyName?: string; footerText?: string; logoDataUrl?: string }): string {
  const recap = parseMeetingRecapDocument(input.documentBody);
  const intro = input.mailBody.split(/\n{2,}/).map((paragraph) => paragraph.trim()).filter(Boolean).map((paragraph) => `<p style="margin:0 0 12px;color:#334155;line-height:1.6;">${escapeHtml(paragraph).replace(/\n/g, "<br>")}</p>`).join("");
  const cards = [["Dossiers", recap.metrics.dossiers, "#0f2942"], ["Décisions", recap.metrics.decisions, "#087c75"], ["Actions", recap.metrics.actions, "#285ca8"], ["Terrain", recap.metrics.terrain, "#c66a0a"]].map(([label, value, color]) => `<td width="25%" style="padding:0 4px;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #dbe4ea;border-radius:9px;background:#f8fafc;"><tr><td style="padding:12px 6px;text-align:center;border-top:4px solid ${color};"><div style="font-size:21px;font-weight:800;color:${color};">${value}</div><div style="font-size:10px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:#64748b;">${label}</div></td></tr></table></td>`).join("");
  const sectionStyle = (title: string) => /action/i.test(title) ? ["#285ca8", "#eff6ff", "A"] : /maintenance|parking/i.test(title) ? ["#c66a0a", "#fff7ed", "!"] : /terrain/i.test(title) ? ["#087c75", "#ecfdf5", "T"] : ["#0f2942", "#f1f5f9", "•"];
  const sections = recap.sections.map((section) => { const [color, background, icon] = sectionStyle(section.title); const groups = groupMeetingRecapSection(section); return `<tr><td style="padding:0 26px 16px;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #dbe4ea;border-radius:11px;overflow:hidden;"><tr><td width="42" valign="middle" style="background:${color};text-align:center;font-size:16px;font-weight:800;color:#ffffff;">${icon}</td><td style="padding:12px 14px;background:${background};font-size:14px;font-weight:800;color:#102a43;">${escapeHtml(section.title)}</td></tr><tr><td colspan="2" style="padding:12px 14px 5px;background:#f8fafc;">${groups.map((group) => groupHtml(group.title, group.details, color)).join("") || "<span style=\"color:#64748b;\">Aucun élément.</span>"}</td></tr></table></td></tr>`; }).join("");
  const logo = buildMeetingRecapInlineImages(input.logoDataUrl).length ? `<img src="cid:meeting-recap-logo" alt="${escapeHtml(input.companyName || "Logo")}" width="120" style="display:block;width:auto;max-width:120px;height:auto;max-height:42px;margin:0 0 15px;background:#ffffff;border-radius:6px;padding:5px;">` : "";
  return `<!doctype html><html lang="fr"><body style="margin:0;padding:0;background:#edf2f5;font-family:Arial,Helvetica,sans-serif;color:#102a43;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#edf2f5;"><tr><td align="center" style="padding:24px 8px;"><table role="presentation" width="680" cellspacing="0" cellpadding="0" style="width:100%;max-width:680px;background:#ffffff;border:1px solid #dbe4ea;border-radius:14px;overflow:hidden;"><tr><td style="padding:26px 28px;background:#0f2942;border-left:7px solid #087c75;">${logo}<div style="font-size:10px;font-weight:700;letter-spacing:.13em;text-transform:uppercase;color:#80d6cf;">${escapeHtml(input.companyName || "ProdPilot IA")} &nbsp;|&nbsp; Pilotage de production</div><h1 style="margin:9px 0 0;font-size:23px;line-height:1.25;color:#ffffff;">${escapeHtml(input.subject || recap.title)}</h1></td></tr><tr><td style="padding:24px 28px 12px;">${intro}<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:17px;background:#ecfdf5;border-left:4px solid #087c75;border-radius:8px;"><tr><td style="padding:12px 14px;font-size:13px;line-height:1.5;color:#14534f;"><strong>Participants</strong><br>${escapeHtml(recap.participants)}</td></tr></table></td></tr><tr><td style="padding:8px 22px 22px;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>${cards}</tr></table></td></tr><tr><td style="padding:0 28px 18px;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#087c75;">Synthèse opérationnelle</td></tr>${sections}<tr><td style="padding:15px 28px 20px;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc;border:1px dashed #b8c7d1;border-radius:9px;"><tr><td style="padding:12px 14px;font-size:12px;line-height:1.5;color:#526777;"><strong style="color:#102a43;">Document complet</strong><br>Le compte rendu PDF joint reprend l’ensemble des décisions, actions et points abordés dans une mise en page optimisée pour l’impression.</td></tr></table></td></tr><tr><td style="padding:17px 28px;background:#0f2942;text-align:center;font-size:10px;line-height:1.5;color:#b9c9d4;">${escapeHtml(input.footerText || recap.disclaimer || "Document interne généré par ProdPilot IA")}</td></tr></table></td></tr></table></body></html>`;
}
