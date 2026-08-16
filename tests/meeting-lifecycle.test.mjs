import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { buildNewMeeting, isMeetingVisibleToUser, meetingFridayDate, meetingParticipantNames, meetingStatusTone, MEETING_LIFECYCLE_STATUSES, previousMeetingParticipants, previousMeetingResponsable } from "../src/features/meetings/services/meeting-lifecycle.ts";
import { migrateDemoData } from "../src/features/demo/services/demo-data-migration.ts";

function meeting(overrides) {
  return { id: "MEET-QRQC-01", type: "QRQC", date: "2026-07-01T08:00:00.000Z", status: "Terminée", createdByUserId: null, sharedAt: null, preparationSentAt: null, preparationSentVia: null, startedAt: null, closedAt: null, archivedAt: null, responsableContactId: null, participants: [], notes: [], decisions: [], parkingLot: [], actionIds: [], criticalWorkOrderIds: [], ...overrides };
}

test("une réunion peut être lancée sans envoyer obligatoirement la préparation", async () => {
  const workflow = await readFile(new URL("../src/features/meetings/components/MeetingWorkflow.tsx", import.meta.url), "utf8");
  assert.match(workflow, /!isTerminee && !isLive \? <button className={primaryButton} onClick={startMeeting}>Lancer la réunion/);
  assert.match(workflow, /La préparation n’a pas été envoyée\. Voulez-vous quand même lancer la réunion/);
  assert.match(workflow, /\["Brouillon", "Préparation", "Envoyée"\]\.includes\(target\.status\)/);
});

test("les commandes principales restent visibles dans l'en-tête sans parcours de statuts imposé", async () => {
  const workflow = await readFile(new URL("../src/features/meetings/components/MeetingWorkflow.tsx", import.meta.url), "utf8");
  const header = workflow.slice(workflow.indexOf("<ModuleHeader eyebrow={`Réunion"), workflow.indexOf("{creatingAction ?"));
  assert.match(header, /Envoyer la préparation/);
  assert.match(header, /Lancer la réunion/);
  assert.match(header, /Clôturer la réunion/);
  assert.doesNotMatch(workflow, /<MeetingStatusBar/);
});

function contact(overrides) {
  return { id: overrides.id, type: "Interne", firstName: "", lastName: "", company: null, role: null, categoryIds: [], phone: null, mobile: null, internalNumber: null, privateNumber: null, email: null, address: null, website: null, notes: null, ...overrides };
}

const daniel = { contactId: "CT-daniel", present: true };
const sophie = { contactId: "CT-sophie", present: true };
const marc = { contactId: "CT-marc", present: false };

const contacts = [
  contact({ id: "CT-daniel", firstName: "Daniel", lastName: "Mülverstedt" }),
  contact({ id: "CT-sophie", firstName: "Sophie", lastName: "Planification" }),
  contact({ id: "CT-marc", firstName: "Marc", lastName: "Lambert" }),
];

test("previousMeetingParticipants reprend les participants de la réunion la plus récente du même type, clôturée ou non", () => {
  const meetings = [
    meeting({ id: "MEET-QRQC-01", date: "2026-07-01T08:00:00.000Z", participants: [daniel] }),
    meeting({ id: "MEET-QRQC-02", date: "2026-07-08T08:00:00.000Z", participants: [daniel, sophie] }),
    meeting({ id: "MEET-PROD-01", type: "Production", date: "2026-07-09T08:00:00.000Z", participants: [marc] }),
  ];
  assert.deepEqual(previousMeetingParticipants(meetings, "QRQC"), [daniel, sophie]);
  assert.deepEqual(previousMeetingParticipants(meetings, "Production"), [marc]);
});

test("previousMeetingParticipants renvoie un tableau vide sans réunion antérieure du même type", () => {
  assert.deepEqual(previousMeetingParticipants([], "QRQC"), []);
  assert.deepEqual(previousMeetingParticipants([meeting({ type: "Production" })], "QRQC"), []);
});

test("previousMeetingResponsable reprend le responsable de la réunion la plus récente du même type, null sans réunion antérieure", () => {
  const meetings = [
    meeting({ id: "MEET-QRQC-01", date: "2026-07-01T08:00:00.000Z", responsableContactId: "CT-daniel" }),
    meeting({ id: "MEET-QRQC-02", date: "2026-07-08T08:00:00.000Z", responsableContactId: "CT-sophie" }),
  ];
  assert.equal(previousMeetingResponsable(meetings, "QRQC"), "CT-sophie");
  assert.equal(previousMeetingResponsable(meetings, "Production"), null);
});

test("meetingParticipantNames résout chaque participant vers son nom complet, en ignorant un contact supprimé depuis", () => {
  assert.deepEqual(meetingParticipantNames([daniel, sophie], contacts), ["Daniel Mülverstedt", "Sophie Planification"]);
  assert.deepEqual(meetingParticipantNames([daniel, { contactId: "CT-inconnu", present: true }], contacts), ["Daniel Mülverstedt"]);
});

test("MEETING_LIFECYCLE_STATUSES liste les 6 statuts du cycle de vie, dans l'ordre", () => {
  assert.deepEqual(MEETING_LIFECYCLE_STATUSES, ["Brouillon", "Préparation", "Envoyée", "En cours", "Terminée", "Archivée"]);
});

test("meetingStatusTone associe une couleur de pastille à chacun des 6 statuts", () => {
  for (const status of MEETING_LIFECYCLE_STATUSES) assert.ok(meetingStatusTone(status), `statut sans couleur associée : ${status}`);
  assert.equal(meetingStatusTone("Terminée"), "success");
  assert.equal(meetingStatusTone("En cours"), "warning");
});

test("isMeetingVisibleToUser masque un Brouillon créé par un autre utilisateur, jamais les autres statuts ni un Brouillon sans créateur connu", () => {
  const draft = meeting({ status: "Brouillon", createdByUserId: "user-1" });
  assert.equal(isMeetingVisibleToUser(draft, "user-1"), true, "visible par son créateur");
  assert.equal(isMeetingVisibleToUser(draft, "user-2"), false, "masqué pour un autre utilisateur");
  assert.equal(isMeetingVisibleToUser(draft, null), false, "masqué sans identité connue");
  assert.equal(isMeetingVisibleToUser(meeting({ status: "Brouillon", createdByUserId: null }), "user-2"), true, "un Brouillon sans créateur connu (donnée migrée) reste visible par tous");
  assert.equal(isMeetingVisibleToUser(meeting({ status: "Préparation", createdByUserId: "user-1" }), "user-2"), true, "le filtrage ne s'applique qu'au Brouillon, jamais aux autres statuts");
});

test("buildNewMeeting démarre en Brouillon, avec son créateur et tous les horodatages de transition à null", () => {
  const created = buildNewMeeting([], "QRQC", "user-1");
  assert.equal(created.status, "Brouillon");
  assert.equal(created.createdByUserId, "user-1");
  assert.equal(created.sharedAt, null);
  assert.equal(created.preparationSentAt, null);
  assert.equal(created.preparationSentVia, null);
  assert.equal(created.startedAt, null);
  assert.equal(created.closedAt, null);
  assert.equal(created.archivedAt, null);
});

test("meetingFridayDate choisit toujours le vendredi de la même semaine du lundi au dimanche", () => {
  assert.equal(meetingFridayDate(new Date("2026-08-03T14:00:00.000Z")), "2026-08-07T09:00:00.000Z", "lundi → vendredi à venir");
  assert.equal(meetingFridayDate(new Date("2026-08-07T18:00:00.000Z")), "2026-08-07T09:00:00.000Z", "vendredi → même date");
  assert.equal(meetingFridayDate(new Date("2026-08-09T12:00:00.000Z")), "2026-08-07T09:00:00.000Z", "dimanche → vendredi précédent de la même semaine");
});

test("buildNewMeeting utilise le vendredi de la semaine comme date de réunion", () => {
  const created = buildNewMeeting([], "Production", null, [], new Date("2026-08-05T12:00:00.000Z"));
  assert.equal(created.date, "2026-08-07T09:00:00.000Z");
});

test("buildNewMeeting reprend le responsable et les participants de la dernière réunion du même type (tous remis Présent), sans jamais réutiliser le même tableau (copie)", () => {
  const previous = meeting({ id: "MEET-QRQC-02", date: "2026-07-08T08:00:00.000Z", responsableContactId: "CT-daniel", participants: [daniel, marc] });
  const created = buildNewMeeting([previous], "QRQC", null);
  assert.deepEqual(created.participants, [{ contactId: "CT-daniel", present: true }, { contactId: "CT-marc", present: true }]);
  assert.equal(created.responsableContactId, "CT-daniel");
  assert.notEqual(created.participants, previous.participants, "doit être une copie, pas la même référence");
  assert.deepEqual(created.notes, []);
  assert.deepEqual(created.decisions, []);
  assert.deepEqual(created.parkingLot, []);
  assert.deepEqual(created.actionIds, []);
});

test("buildNewMeeting attribue un id incrémental distinct, propre au type (préfixe MEET-QRQC / MEET-PROD)", () => {
  const existing = [meeting({ id: "MEET-QRQC-12" }), meeting({ id: "MEET-PROD-07", type: "Production" })];
  assert.equal(buildNewMeeting(existing, "QRQC", null).id, "MEET-QRQC-13");
  assert.equal(buildNewMeeting(existing, "Production", null).id, "MEET-PROD-08");
});

test("buildNewMeeting démarre à 01 quand aucune réunion de ce type n'existe encore", () => {
  assert.equal(buildNewMeeting([], "QRQC", null).id, "MEET-QRQC-01");
  assert.equal(buildNewMeeting([], "QRQC", null).responsableContactId, null);
});

test("buildNewMeeting reprend les projets critiques suggérés (copie), ajustables ensuite ; vide par défaut", () => {
  const suggested = ["OF-1", "OF-2"];
  const created = buildNewMeeting([], "Production", null, suggested);
  assert.deepEqual(created.criticalWorkOrderIds, ["OF-1", "OF-2"]);
  assert.notEqual(created.criticalWorkOrderIds, suggested, "doit être une copie, pas la même référence");
  assert.deepEqual(buildNewMeeting([], "Production", null).criticalWorkOrderIds, [], "sans suggestion fournie, la liste part vide plutôt que d'échouer");
});

test("migrateDemoData convertit l'ancien statut à 3 valeurs vers le cycle de vie à 6 valeurs (Planifiée→Préparation, En cours→En cours, Clôturée→Terminée) et complète les nouveaux champs à null", () => {
  const legacyPlanifiee = meeting({ id: "MEET-PROD-01", type: "Production", status: "Planifiée" });
  const legacyEnCours = meeting({ id: "MEET-PROD-02", type: "Production", status: "En cours" });
  const legacyCloturee = meeting({ id: "MEET-PROD-03", type: "Production", status: "Clôturée" });
  delete legacyPlanifiee.createdByUserId;
  delete legacyPlanifiee.sharedAt;
  const payload = { version: 2, actions: [], workOrders: [], planning: [], machines: [], maintenance: [], meetings: [legacyPlanifiee, legacyEnCours, legacyCloturee], requests: [], erpQuality: [], notifications: [], contacts: [] };
  const migrated = migrateDemoData(payload);
  assert.equal(migrated.meetings[0].status, "Préparation");
  assert.equal(migrated.meetings[0].createdByUserId, null);
  assert.equal(migrated.meetings[0].sharedAt, null);
  assert.equal(migrated.meetings[1].status, "En cours");
  assert.equal(migrated.meetings[2].status, "Terminée");
});

test("migrateDemoData complète les réunions déjà enregistrées avec criticalWorkOrderIds (vide par défaut) et responsableContactId (null par défaut), sans perdre leurs autres champs", () => {
  const legacyMeeting = meeting({ id: "MEET-PROD-05", type: "Production", participants: [daniel] });
  delete legacyMeeting.criticalWorkOrderIds;
  delete legacyMeeting.responsableContactId;
  const payload = { version: 2, actions: [], workOrders: [], planning: [], machines: [], maintenance: [], meetings: [legacyMeeting], requests: [], erpQuality: [], notifications: [], contacts };
  const migrated = migrateDemoData(payload);
  assert.deepEqual(migrated.meetings[0].criticalWorkOrderIds, []);
  assert.equal(migrated.meetings[0].responsableContactId, null);
  assert.equal(migrated.meetings[0].id, "MEET-PROD-05");
  assert.deepEqual(migrated.meetings[0].participants, [daniel]);
});

// Noms volontairement absents de l'annuaire TKMI réel (toujours fusionné par `migrateDemoData`,
// voir `withTkmiDirectorySeed`) pour ne pas entrer en collision avec un contact réel du même nom.
test("migrateDemoData convertit les participants enregistrés avant le rattachement à Contacts (noms en texte libre) en références, en retrouvant chaque nom dans l'annuaire", () => {
  const legacyMeeting = meeting({ id: "MEET-PROD-05", type: "Production", participants: ["Sophie Planification", "Marc Lambert"] });
  const payload = { version: 2, actions: [], workOrders: [], planning: [], machines: [], maintenance: [], meetings: [legacyMeeting], requests: [], erpQuality: [], notifications: [], contacts };
  const migrated = migrateDemoData(payload);
  assert.deepEqual(migrated.meetings[0].participants, [{ contactId: "CT-sophie", present: true }, { contactId: "CT-marc", present: true }]);
});

test("migrateDemoData laisse de côté un participant enregistré avant le rattachement à Contacts dont le nom ne correspond à aucun contact connu, plutôt que de garder une référence invalide", () => {
  const legacyMeeting = meeting({ id: "MEET-PROD-05", type: "Production", participants: ["Sophie Planification", "Personne Inconnue"] });
  const payload = { version: 2, actions: [], workOrders: [], planning: [], machines: [], maintenance: [], meetings: [legacyMeeting], requests: [], erpQuality: [], notifications: [], contacts };
  const migrated = migrateDemoData(payload);
  assert.deepEqual(migrated.meetings[0].participants, [{ contactId: "CT-sophie", present: true }]);
});

test("migrateDemoData rattache les notes/décisions enregistrées avant le suivi par étape (simples textes) à une étape générique, sans les perdre", () => {
  const legacyMeeting = meeting({ id: "MEET-PROD-05", type: "Production", notes: ["Retard fournisseur"], decisions: ["Réunion clôturée après 10 minute(s)."] });
  const payload = { version: 2, actions: [], workOrders: [], planning: [], machines: [], maintenance: [], meetings: [legacyMeeting], requests: [], erpQuality: [], notifications: [], contacts: [] };
  const migrated = migrateDemoData(payload);
  assert.deepEqual(migrated.meetings[0].notes, [{ step: "Réunion", text: "Retard fournisseur" }]);
  assert.deepEqual(migrated.meetings[0].decisions, [{ step: "Réunion", text: "Réunion clôturée après 10 minute(s)." }]);
});

test("migrateDemoData laisse inchangées des notes/décisions déjà rattachées à une étape", () => {
  const legacyMeeting = meeting({ id: "MEET-PROD-05", type: "Production", notes: [{ step: "Cinq projets critiques", text: "Retard fournisseur" }] });
  const payload = { version: 2, actions: [], workOrders: [], planning: [], machines: [], maintenance: [], meetings: [legacyMeeting], requests: [], erpQuality: [], notifications: [], contacts: [] };
  const migrated = migrateDemoData(payload);
  assert.deepEqual(migrated.meetings[0].notes, [{ step: "Cinq projets critiques", text: "Retard fournisseur" }]);
});
