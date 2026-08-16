import assert from "node:assert/strict";
import test from "node:test";
import { buildMeetingRecapEmail, buildMeetingRecapEmailHtml, buildMeetingRecapInlineImages, resolveParticipantEmails } from "../src/features/meetings/services/meeting-recap-email.ts";
import { groupMeetingRecapSection, parseMeetingRecapDocument } from "../src/features/meetings/services/meeting-recap-presentation.ts";

function contact(overrides) {
  return { id: overrides.firstName, type: "Interne", firstName: "", lastName: "", company: null, role: null, categoryIds: [], phone: null, mobile: null, internalNumber: null, privateNumber: null, email: null, address: null, website: null, notes: null, ...overrides };
}

const daniel = contact({ firstName: "Daniel", lastName: "Mülverstedt", email: "daniel@exemple.fr" });
const sophie = contact({ firstName: "Sophie", lastName: "Planification", email: "planning@exemple.fr" });
const julie = contact({ firstName: "Julie", lastName: "Qualité", email: null });
const externe = contact({ firstName: "Fournisseur", lastName: "Externe", type: "Externe", email: "externe@exemple.fr" });

const contacts = [daniel, sophie, julie, externe];

test("resolveParticipantEmails retrouve l'adresse de chaque participant présent, par référence de contact", () => {
  const participants = [{ contactId: "Daniel", present: true }, { contactId: "Sophie", present: true }];
  const { resolved, unresolved } = resolveParticipantEmails(participants, contacts);
  assert.deepEqual(resolved, [{ name: "Daniel Mülverstedt", email: "daniel@exemple.fr" }, { name: "Sophie Planification", email: "planning@exemple.fr" }]);
  assert.deepEqual(unresolved, []);
});

test("resolveParticipantEmails exclut un participant marqué absent, même avec une adresse connue", () => {
  const participants = [{ contactId: "Daniel", present: true }, { contactId: "Sophie", present: false }];
  const { resolved, unresolved } = resolveParticipantEmails(participants, contacts);
  assert.deepEqual(resolved, [{ name: "Daniel Mülverstedt", email: "daniel@exemple.fr" }]);
  assert.deepEqual(unresolved, []);
});

test("resolveParticipantEmails laisse sans adresse un participant présent dont le contact n'a pas d'e-mail renseigné, sans jamais en inventer une", () => {
  const participants = [{ contactId: "Julie", present: true }];
  const { resolved, unresolved } = resolveParticipantEmails(participants, contacts);
  assert.deepEqual(resolved, []);
  assert.deepEqual(unresolved, ["Julie Qualité"]);
});

test("resolveParticipantEmails ignore silencieusement un participant dont le contact a été supprimé depuis", () => {
  const participants = [{ contactId: "Inconnu", present: true }];
  const { resolved, unresolved } = resolveParticipantEmails(participants, contacts);
  assert.deepEqual(resolved, []);
  assert.deepEqual(unresolved, []);
});

const meeting = {
  id: "meeting-1",
  type: "Production",
  date: "2026-08-06",
  status: "Clôturée",
  responsableContactId: "Daniel",
  participants: [{ contactId: "Daniel", present: true }, { contactId: "Sophie", present: false }],
  notes: [{ step: "Cinq projets critiques", text: "Retard fournisseur signalé" }],
  decisions: [{ step: "Compte rendu", text: "Réunion clôturée après 12 minute(s)." }],
  parkingLot: ["Revoir le planning maintenance"],
  actionIds: ["action-1"],
};

const meetingActions = [
  { id: "action-1", dateEncodage: "2026-08-06", introduitPar: "Daniel Mülverstedt", origine: "Réunion de production", contextLink: null, description: "Relancer le fournisseur X", responsable: "Sophie Planification", echeance: "2026-08-10", statut: "À faire", dateCloture: null, remarque: null, priority: null },
];

test("buildMeetingRecapEmail compose un sujet et un corps déterministes à partir des seules données de la réunion", () => {
  // Le format exact du jour/année dépend de `Intl.DateTimeFormat` (ICU de l'environnement, pas
  // testé ailleurs dans ce dépôt pour cette raison) : seule la structure du texte est vérifiée ici.
  const { subject, bodyText } = buildMeetingRecapEmail(meeting, "Production", meetingActions, contacts);
  assert.match(subject, /^Compte rendu — Réunion Production du \d{1,2}\/08\/\d{2,4}$/);
  assert.match(bodyText, /Participants : Daniel Mülverstedt, Sophie Planification \(absent\)/);
  assert.match(bodyText, /Cinq projets critiques :\n {2}- Retard fournisseur signalé/);
  assert.match(bodyText, /Compte rendu :\n {2}- Décision : Réunion clôturée après 12 minute\(s\)\./);
  assert.match(bodyText, /- Relancer le fournisseur X — Sophie Planification, échéance \d{1,2}\/08\/\d{2,4} \(À faire\)/);
  assert.match(bodyText, /- Revoir le planning maintenance/);
});

test("buildMeetingRecapEmail organise le déroulé dans l'ordre des étapes du rituel, pas dans l'ordre de saisie", () => {
  const withStepsOutOfOrder = { ...meeting, notes: [{ step: "Compte rendu", text: "Point final" }, { step: "Dossiers prioritaires", text: "Point plus tôt" }], decisions: [] };
  const { bodyText } = buildMeetingRecapEmail(withStepsOutOfOrder, "Production", [], contacts);
  assert.ok(bodyText.indexOf("Dossiers prioritaires :") < bodyText.indexOf("Compte rendu :"), "les étapes doivent suivre le déroulé du rituel, pas l'ordre de saisie");
});

test("buildMeetingRecapEmail affiche quand même une note/décision rattachée à une étape inconnue (réunion migrée depuis l'ancien format), plutôt que de la perdre", () => {
  const legacy = { ...meeting, notes: [{ step: "Réunion", text: "Ancienne note" }], decisions: [] };
  const { bodyText } = buildMeetingRecapEmail(legacy, "Production", [], contacts);
  assert.match(bodyText, /Réunion :\n {2}- Ancienne note/);
});

test("buildMeetingRecapEmail affiche des libellés explicites plutôt que des sections vides", () => {
  const empty = { ...meeting, participants: [], notes: [], decisions: [], parkingLot: [] };
  const { bodyText } = buildMeetingRecapEmail(empty, "QRQC", [], contacts);
  assert.match(bodyText, /Participants : aucun renseigné/);
  assert.match(bodyText, /Rien n'a été noté pendant cette réunion\./);
  assert.match(bodyText, /Aucune action liée\./);
  assert.match(bodyText, /Aucun point en attente\./);
});

test("buildMeetingRecapEmailHtml présente le compte rendu en cartes visuelles sans perdre le texte éditable", () => {
  const { subject, bodyText } = buildMeetingRecapEmail(meeting, "Production", meetingActions, contacts);
  const html = buildMeetingRecapEmailHtml({ subject, mailBody: "Bonjour,\n\nVoici le compte rendu.", documentBody: bodyText, companyName: "ProdPilot Industries", footerText: "Document interne" });
  assert.match(html, /<!doctype html>/);
  for (const marker of ["ProdPilot Industries", "Participants", "Dossiers", "Décisions", "Actions", "Terrain", "Synthèse opérationnelle", "Document complet", "Retard fournisseur signal", "Document interne"]) assert.match(html, new RegExp(marker));
});

test("la présentation conserve les étapes du déroulé et regroupe leurs notes et décisions dans la même carte", () => {
  const { bodyText } = buildMeetingRecapEmail(meeting, "Production", meetingActions, contacts);
  const recap = parseMeetingRecapDocument(bodyText);
  const flow = recap.sections.find((section) => section.title === "Déroulé de la réunion");
  assert.ok(flow);
  const groups = groupMeetingRecapSection(flow);
  assert.deepEqual(groups.find((group) => group.title === "Cinq projets critiques"), {
    title: "Cinq projets critiques",
    details: ["Retard fournisseur signalé"],
  });
  assert.equal(recap.sections.filter((section) => section.title === "Dossiers prioritaires").length, 1);
});

test("le logo du compte rendu est embarqué en CID pour rester visible dans Gmail et Outlook", () => {
  const logo = "data:image/png;base64,aGVsbG8=";
  const images = buildMeetingRecapInlineImages(logo);
  assert.deepEqual(images, [{ contentId: "meeting-recap-logo", mimeType: "image/png", base64: "aGVsbG8=", filename: "logo-compte-rendu.png" }]);
  const html = buildMeetingRecapEmailHtml({ subject: "Compte rendu", mailBody: "Bonjour", documentBody: "Compte rendu\n\nParticipants : Daniel", logoDataUrl: logo });
  assert.match(html, /src="cid:meeting-recap-logo"/);
  assert.doesNotMatch(html, /src="data:image/);
});
