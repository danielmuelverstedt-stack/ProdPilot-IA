import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("l’agenda du jour et la création d’événement sont deux intentions distinctes reconnues localement", async () => {
  const interpreter = await read("src/features/calendar/services/calendar-assistant-interpreter.ts");
  assert.match(interpreter, /AGENDA_QUERY_PATTERN/);
  assert.match(interpreter, /CREATE_EVENT_PATTERN = \/\\b\(planifie\|programme\|organise\)\\b/);
  assert.match(interpreter, /export function isCalendarAssistantRequest/);
});

test("aucune heure de réunion n’est inventée : une demande sans horaire explicite est refusée", async () => {
  const interpreter = await read("src/features/calendar/services/calendar-assistant-interpreter.ts");
  const createSection = interpreter.split("if (CREATE_EVENT_PATTERN.test(normalized)) {")[1].split("if (AGENDA_QUERY_PATTERN")[0];
  assert.match(createSection, /if \(!times\) return \{ reply: "À quelle heure/);
});

test("aucune adresse participant n’est inventée : l’e-mail n’est repris que s’il est littéralement présent dans le texte", async () => {
  const interpreter = await read("src/features/calendar/services/calendar-assistant-interpreter.ts");
  const extractor = interpreter.split("function extractAttendeeEmail")[1];
  assert.ok(extractor);
  assert.doesNotMatch(extractor, /@exemple|@client\.com|invente/i);
});

test("la création d’un événement exige une confirmation explicite avant tout appel réseau", async () => {
  const panel = await read("src/features/workspace/components/AssistantPanel.tsx");
  const calendarBranch = panel.split("if (pendingCalendarProposal) {")[1].split("if (pendingActionProposal)")[0];
  assert.match(calendarBranch, /isConfirmation\(text\)/);
  assert.match(calendarBranch, /applyCalendarProposal/);
  assert.match(calendarBranch, /isCancellation\(text\)/);
});

test("la route de création d’événement exige confirmed=true et ne fait jamais confiance au client seul", async () => {
  const route = await read("src/app/api/calendar/events/create/route.ts");
  assert.match(route, /body\.confirmed !== true/);
  assert.match(route, /isTrustedSameOriginRequest/);
});

test("le scope OAuth Calendrier respecte le moindre privilège et ne réutilise pas le jeton Mail", async () => {
  const config = await read("src/features/calendar/server/google/google-calendar-config.ts");
  assert.match(config, /calendar\.events/);
  assert.doesNotMatch(config, /gmail\./);
  const auth = await read("src/features/calendar/server/google/google-calendar-auth.ts");
  assert.doesNotMatch(auth, /mail\/server\/google/);
});

test("le module Calendrier ne modifie aucun fichier du module Mail existant", async () => {
  const mailAuth = await read("src/features/mail/server/google/google-auth.ts");
  assert.doesNotMatch(mailAuth, /calendar/i);
  const mailConfig = await read("src/features/mail/server/google/google-config.ts");
  assert.doesNotMatch(mailConfig, /calendar/i);
});
