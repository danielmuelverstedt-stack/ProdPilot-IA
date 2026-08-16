import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("le compte rendu possède un document éditorial et des versions envoyées", async () => {
  const [types, migration] = await Promise.all([read("src/features/demo/types/demo.ts"), read("src/features/demo/services/demo-data-migration.ts")]);
  assert.match(types, /interface MeetingRecapDocument/);
  assert.match(types, /sentVersions: MeetingRecapSentVersion\[\]/);
  assert.match(migration, /recapDocument: meeting\.recapDocument \?\? null/);
});

test("l'espace de compte rendu propose aperçu, modification, PDF et envoi", async () => {
  const source = await read("src/features/meetings/components/MeetingRecapWorkspace.tsx");
  for (const label of ["Aperçu du document", "Modifier", "Générer", "Exporter PDF", "Envoyer", "Retour à la réunion", "Archiver"]) assert.match(source, new RegExp(label));
  assert.match(source, /<MailDraftSendPanel/);
  assert.match(source, /<ContactPickerDialog/);
});

test("le PDF et l'aperçu consomment le même documentBody", async () => {
  const source = await read("src/features/meetings/components/MeetingRecapWorkspace.tsx");
  assert.match(source, /buildMeetingRecapPdf\(document\.subject, document\.documentBody, recapBranding\)/);
  assert.match(source, /\{document\.documentBody\}<\/pre>/);
  assert.match(source, /bodyHtml=\{recapEmailHtml\}/);
  assert.match(source, /inlineImages=\{recapInlineImages\}/);
});

test("l'envoi conserve son instantané et ses métadonnées", async () => {
  const source = await read("src/features/meetings/services/meeting-recap-document-service.ts");
  for (const marker of ["recipientEmails", "subject: document.subject", "mailBody: document.mailBody", "documentBody: document.documentBody", "attachmentNames"]) assert.match(source, new RegExp(marker));
});

test("le compte rendu reste verrouillé avant la fin de la réunion", async () => {
  const source = await read("src/features/meetings/components/MeetingWorkflow.tsx");
  assert.match(source, /Le compte rendu sera disponible une fois la réunion terminée/);
  assert.match(source, /<MeetingRecapWorkspace/);
});
