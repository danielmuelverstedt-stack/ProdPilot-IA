import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { buildDeterministicBrief, createMailSessionBrief } from "../src/features/mail-assistant/services/mail-session-brief-service.ts";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const settings = { askFollowUpQuestion: true, maximumItemsSpoken: 7 };
const metrics = (changes = {}) => ({ newMail: 0, unread: 0, pendingReplies: 0, pendingDrafts: 0, withoutClassification: 0, withoutStatus: 0, followUpsDueToday: 0, overdueFollowUps: 0, preparedMeetings: 0, openActions: 0, review: 0, urgent: 0, informational: 0, noAction: 0, unresolvedSessions: 0, totalPending: 0, ...changes });

test("zéro nouveau mail et zéro attente produit un vrai état à jour", () => {
  assert.equal(buildDeterministicBrief("up_to_date", metrics(), "Daniel", false, null, settings), "Bonjour Daniel. Aucun nouveau mail et aucun élément en attente. Votre boîte est à jour.");
});

test("les réponses, brouillons et mails sans statut sont annoncés sans nouveau mail", () => {
  const text = buildDeterministicBrief("pending_only", metrics({ pendingReplies: 2, pendingDrafts: 1, withoutStatus: 3, totalPending: 6 }), "Daniel", false, null, settings);
  assert.match(text, /aucun nouveau mail/); assert.match(text, /2 réponses à valider/); assert.match(text, /1 brouillon en attente/); assert.match(text, /3 mails sans statut/); assert.match(text, /commencer par les réponses/);
});

test("les nouveaux mails urgents sont prioritaires", () => {
  const text = buildDeterministicBrief("new_mail", metrics({ newMail: 8, urgent: 1, pendingReplies: 2, noAction: 5, totalPending: 2 }), "Daniel", false, null, settings);
  assert.match(text, /8 nouveaux mails/); assert.ok(text.indexOf("élément urgent") < text.indexOf("réponses à valider"));
});

test("Gmail indisponible annonce l'heure locale et les attentes", () => {
  const text = buildDeterministicBrief("synchronization_unavailable", metrics({ totalPending: 2 }), "Daniel", false, "2026-07-15T09:12:00+02:00", settings);
  assert.match(text, /pas pu actualiser/); assert.match(text, /09 h 12/); assert.match(text, /2 éléments restent à traiter/);
});

test("le mode démonstration est explicitement annoncé", () => {
  assert.match(buildDeterministicBrief("up_to_date", metrics(), "Daniel", true, null, settings), /Mode démonstration/);
});

test("une mémoire locale indisponible ne peut pas rendre l'assistant silencieux", async () => {
  const brief = await createMailSessionBrief({ repository: { list: async () => { throw new Error("IndexedDB indisponible"); } }, context: { accountId: "a", provider: "google", userId: "u", companyId: "c", mode: "oauth" }, session: null, firstName: "Daniel", isDemo: false, lastSyncAt: null, synchronizationAvailable: false, settings });
  assert.equal(brief.state, "synchronization_unavailable"); assert.match(brief.text, /Bonjour Daniel/); assert.ok(brief.text.length > 40);
});

test("le brief couvre les quatre états et reste déterministe", async () => {
  const source = await read("src/features/mail-assistant/services/mail-session-brief-service.ts");
  for (const state of ["new_mail", "pending_only", "up_to_date", "synchronization_unavailable"]) assert.match(source, new RegExp(state));
  for (const sourceName of ["mailMessages", "assistantSessions", "replyProposals", "draftReferences", "followUps", "meetingRequests", "internalActions"]) assert.match(source, new RegExp(sourceName));
  assert.match(source, /generation: "deterministic"/);
  assert.doesNotMatch(source, /openai|fetch\(|generateText|chat\.completions/i);
});

test("la voix native démarre automatiquement et propose pause arrêt relecture", async () => {
  const source = await read("src/features/mail-assistant/components/MailAssistantSpeechOutput.tsx");
  const provider = await read("src/features/mail-assistant/services/browser-tts-provider.ts");
  assert.match(provider, /SpeechSynthesisUtterance/); assert.match(provider, /engine\.speak/);
  assert.match(provider, /pause/); assert.match(provider, /cancel/); assert.match(source, /Écouter à nouveau/);
  assert.match(source, /synthèse vocale n’est pas disponible/);
});

test("le mode continu n'active le micro qu'avec le comportement configuré", async () => {
  const workspace = await read("src/features/mail-assistant/components/MailAssistantWorkspace.tsx");
  const voice = await read("src/features/mail-assistant/components/MailAssistantVoiceInput.tsx");
  assert.match(workspace, /continuousConversation.*setAutoListenToken/);
  assert.match(voice, /Prêt à écouter/); assert.match(voice, /autoStartToken/);
});

test("les statuts sont centralisés et Sans statut est visible", async () => {
  const defaults = await read("src/features/mail-assistant/config/mail-assistant-defaults.ts");
  const brief = await read("src/features/mail-assistant/components/MailSessionOpeningBrief.tsx");
  for (const label of ["Nouveau", "À analyser", "À vérifier", "Réponse nécessaire", "Brouillon prêt", "En attente de validation", "En attente de réponse", "Action créée", "Information", "Aucune action", "Traité", "Ignoré"]) assert.match(defaults, new RegExp(label));
  assert.match(brief, /Sans statut/);
});
