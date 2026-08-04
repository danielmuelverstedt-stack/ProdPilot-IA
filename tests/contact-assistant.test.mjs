import assert from "node:assert/strict";
import test from "node:test";
import {
  buildContactReply,
  extractContactQuery,
  interpretContactAssistantMessage,
  isContactAssistantRequest,
} from "../src/features/contacts/services/contact-assistant-interpreter.ts";

function buildContact(overrides = {}) {
  return {
    id: "ct-1",
    type: "Interne",
    firstName: "Jean",
    lastName: "Dupont",
    company: null,
    role: null,
    categoryIds: [],
    phone: "081 12 34 56",
    mobile: "0470 12 34 56",
    internalNumber: null,
    privateNumber: null,
    email: "jean.dupont@example.com",
    address: null,
    website: null,
    notes: null,
    ...overrides,
  };
}

test("isContactAssistantRequest reconnaît une question de téléphone/e-mail « de X » et exclut les OF", () => {
  assert.equal(isContactAssistantRequest("quel est le numéro de téléphone de Jean Dupont"), true);
  assert.equal(isContactAssistantRequest("quel est l'e-mail de Jean Dupont"), true);
  assert.equal(isContactAssistantRequest("les coordonnées de Jean Dupont"), true);
  assert.equal(isContactAssistantRequest("quel est le numéro de l'OF-63596"), false);
  assert.equal(isContactAssistantRequest("bonjour, comment vas-tu"), false);
});

test("extractContactQuery détecte le champ demandé et capture le nom en fin de phrase", () => {
  assert.deepEqual(extractContactQuery("quel est le numéro de téléphone de Jean Dupont"), { field: "phone", name: "Jean Dupont" });
  assert.deepEqual(extractContactQuery("quel est l'e-mail de Jean Dupont ?"), { field: "email", name: "Jean Dupont" });
  assert.deepEqual(extractContactQuery("les coordonnées de Jean Dupont"), { field: "all", name: "Jean Dupont" });
});

test("buildContactReply répond directement pour un contact unique selon le champ demandé", () => {
  const contacts = [buildContact()];
  assert.match(buildContactReply("Jean Dupont", "phone", contacts), /081 12 34 56/);
  assert.match(buildContactReply("Jean Dupont", "phone", contacts), /0470 12 34 56/);
  assert.match(buildContactReply("Jean Dupont", "email", contacts), /jean\.dupont@example\.com/);
});

test("buildContactReply signale l'absence de numéro/e-mail sans en inventer un", () => {
  const contacts = [buildContact({ phone: null, mobile: null, email: null })];
  assert.match(buildContactReply("Jean Dupont", "phone", contacts), /Aucun numéro/);
  assert.match(buildContactReply("Jean Dupont", "email", contacts), /Aucun e-mail/);
});

test("buildContactReply signale l'absence de contact correspondant", () => {
  assert.match(buildContactReply("Personne Inconnue", "phone", []), /Aucun contact/);
});

test("buildContactReply liste les homonymes sans en choisir un au hasard", () => {
  const contacts = [buildContact({ id: "ct-1", company: "TKMI" }), buildContact({ id: "ct-2", company: "Autre société" })];
  const reply = buildContactReply("Jean Dupont", "phone", contacts);
  assert.match(reply, /Plusieurs contacts/);
  assert.match(reply, /TKMI/);
  assert.match(reply, /Autre société/);
});

test("interpretContactAssistantMessage renvoie null pour un message qui n'est pas une question de contact", () => {
  assert.equal(interpretContactAssistantMessage("l'OF-63596 est sur quelle machine", []), null);
});

test("interpretContactAssistantMessage bout en bout sur une question de téléphone", () => {
  const reply = interpretContactAssistantMessage("quel est le numéro de téléphone de Jean Dupont", [buildContact()]);
  assert.match(reply ?? "", /081 12 34 56/);
});
