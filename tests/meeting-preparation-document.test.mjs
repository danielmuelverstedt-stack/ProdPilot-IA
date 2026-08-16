import assert from "node:assert/strict";
import test from "node:test";
import { buildMeetingPreparationDocument } from "../src/features/meetings/services/meeting-preparation-document.ts";
import { buildMeetingPlanningPdf } from "../src/features/meetings/services/meeting-planning-pdf.ts";

function contact(overrides) {
  return { id: overrides.firstName, type: "Interne", firstName: "", lastName: "", company: null, role: null, categoryIds: [], phone: null, mobile: null, internalNumber: null, privateNumber: null, email: null, address: null, website: null, notes: null, ...overrides };
}

const daniel = contact({ firstName: "Daniel", lastName: "Mülverstedt", email: "daniel@exemple.fr" });
const sophie = contact({ firstName: "Sophie", lastName: "Planification", email: "planning@exemple.fr" });
const contacts = [daniel, sophie];

const meeting = {
  id: "meeting-1",
  type: "Production",
  date: "2026-08-06T09:00:00.000Z",
  status: "Préparation",
  createdByUserId: null,
  sharedAt: null,
  preparationSentAt: null,
  preparationSentVia: null,
  startedAt: null,
  closedAt: null,
  archivedAt: null,
  responsableContactId: "Daniel",
  participants: [{ contactId: "Daniel", present: true }, { contactId: "Sophie", present: true }],
  notes: [{ step: "Cinq projets critiques", text: "Retard fournisseur à signaler" }],
  decisions: [],
  parkingLot: [],
  actionIds: [],
  criticalWorkOrderIds: ["OF-1"],
};

const actionsToReview = [
  { id: "action-1", dateEncodage: "2026-08-05", introduitPar: "Daniel Mülverstedt", origine: "Réunion de production", contextLink: null, description: "Relancer le fournisseur X", responsable: "Sophie Planification", echeance: "2026-08-10", statut: "À faire", dateCloture: null, remarque: null, priority: null },
];

const criticalWorkOrders = [
  { id: "OF-1", customer: "Client A", article: "Pièce 123", quantity: 10, priority: "Urgente", dueDate: "2026-08-12", status: "En production", progress: 40, project: "Projet A", dataProblems: [], comments: [], history: [], operations: [] },
];

test("buildMeetingPreparationDocument compose un ordre du jour déterministe avec responsable, participants, déroulé et actions à revoir", () => {
  const { subject, bodyText } = buildMeetingPreparationDocument(meeting, "Production", actionsToReview, criticalWorkOrders, contacts);
  assert.match(subject, /^Préparation — Réunion Production du \d{1,2}\/08\/\d{2,4}/);
  assert.match(bodyText, /^Bonjour,/);
  assert.match(bodyText, /Merci d'en prendre connaissance avant la réunion/);
  assert.match(bodyText, /Responsable : Daniel Mülverstedt/);
  assert.match(bodyText, /Participants prévus : Daniel Mülverstedt, Sophie Planification/);
  assert.match(bodyText, /ORDRE DU JOUR\n- Participants/);
  assert.match(bodyText, /ACTIONS À REVOIR\n- Relancer le fournisseur X — Sophie Planification, échéance \d{1,2}\/08\/\d{2,4}/);
});

test("buildMeetingPreparationDocument liste les dossiers prioritaires pour une réunion Production, jamais pour une réunion QRQC", () => {
  const production = buildMeetingPreparationDocument(meeting, "Production", actionsToReview, criticalWorkOrders, contacts);
  assert.match(production.bodyText, /DOSSIERS PRIORITAIRES/);
  const qrqc = buildMeetingPreparationDocument({ ...meeting, type: "QRQC" }, "QRQC", actionsToReview, criticalWorkOrders, contacts);
  assert.doesNotMatch(qrqc.bodyText, /Dossiers prioritaires :\n/);
});

test("buildMeetingPreparationDocument reprend les sujets déjà préparés (notes/décisions saisies avant l'envoi), par étape", () => {
  const { bodyText } = buildMeetingPreparationDocument(meeting, "Production", [], [], contacts);
  assert.match(bodyText, /SUJETS DÉJÀ PRÉPARÉS\nCinq projets critiques :\n {2}- Retard fournisseur à signaler/);
});

test("buildMeetingPreparationDocument affiche des libellés explicites plutôt que des sections vides", () => {
  const empty = { ...meeting, responsableContactId: null, participants: [], notes: [], decisions: [], criticalWorkOrderIds: [] };
  const { bodyText } = buildMeetingPreparationDocument(empty, "Production", [], [], contacts);
  assert.match(bodyText, /Responsable : non désigné/);
  assert.match(bodyText, /Participants prévus : aucun renseigné/);
  assert.match(bodyText, /ACTIONS À REVOIR\nAucune action à revoir\./);
  assert.match(bodyText, /DOSSIERS PRIORITAIRES\nAucun dossier prioritaire\./);
  assert.match(bodyText, /SUJETS DÉJÀ PRÉPARÉS\nRien n'a encore été préparé\./);
});

test("buildMeetingPreparationDocument renvoie le planning Production vers le PDF joint", () => {
  const planning = [{ machineId: "M-1", machineLabel: "Fraiseuse 1", rows: [1, 2, 3, 4].map((index) => ({ workOrderId: `OF-${index}`, description: `Pièce ${index}`, customerName: `Client ${index}`, articleCode: `ART-${index}`, quantity: index })) }];
  const { bodyText } = buildMeetingPreparationDocument(meeting, "Production", [], [], contacts, planning);
  assert.match(bodyText, /PLANNING MACHINES\nLe planning détaillé est disponible dans le PDF joint/);
  assert.doesNotMatch(bodyText, /OF-1 · Client 1/);
  assert.doesNotMatch(bodyText, /OF-4/);
});

test("le planning machines compact n'est pas ajouté à la préparation QRQC", () => {
  const planning = [{ machineId: "M-1", machineLabel: "Fraiseuse 1", rows: [{ workOrderId: "OF-1", description: "Pièce", customerName: "Client", articleCode: "ART", quantity: 1 }] }];
  const { bodyText } = buildMeetingPreparationDocument({ ...meeting, type: "QRQC" }, "QRQC", [], [], contacts, planning);
  assert.doesNotMatch(bodyText, /Planning machines/);
});

test("la préparation HTML annonce clairement le PDF du planning", () => {
  const document = buildMeetingPreparationDocument(meeting, "Production", [], [], contacts);
  assert.match(document.bodyHtml, /Bonjour/);
  assert.match(document.bodyHtml, /01/);
  assert.match(document.bodyHtml, /Ordre du jour/);
  assert.match(document.bodyHtml, /^<div[^>]*><div[^>]*><p[^>]*><strong>Bonjour,/);
  assert.doesNotMatch(document.bodyHtml, /Préparation de réunion<\/div><h1/);
  assert.match(document.bodyHtml, /Planning machines en pièce jointe/);
  assert.match(document.bodyHtml, /photos, les 3 OF par machine, les descriptions, les quantités et les dates/);
  assert.equal(document.inlineImages.length, 0);
  assert.doesNotMatch(document.bodyText, /ProdPilot/i);
  assert.doesNotMatch(document.bodyHtml, /ProdPilot/i);
});

test("buildMeetingPlanningPdf génère une vraie pièce jointe PDF avec le planning", async () => {
  const planning = [{ machineId: "M-1", machineLabel: "Fraiseuse 1", rows: [{ workOrderId: "OF-1", description: "Pièce", customerName: "Client", articleCode: "ART-1", quantity: 12, plannedStartAt: "2026-08-07T06:00:00.000Z", plannedEndAt: "2026-08-08T14:00:00.000Z" }] }];
  const attachment = await buildMeetingPlanningPdf("Réunion Production", "07/08/2026", planning, {});
  assert.equal(attachment.mimeType, "application/pdf");
  assert.match(attachment.filename, /^planning-machines-/);
  assert.equal(Buffer.from(attachment.base64, "base64").subarray(0, 4).toString(), "%PDF");
});
