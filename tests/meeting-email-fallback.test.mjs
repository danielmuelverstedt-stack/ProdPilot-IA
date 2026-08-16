import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("l'e-mail de réunion peut toujours être généré localement, sans Gmail", async () => {
  const source = await read("src/features/meetings/components/MailDraftSendPanel.tsx");
  assert.match(source, /function generateLocalDraft\(\)/);
  assert.match(source, />Générer l’e-mail</);
  assert.match(source, /draftId: null/);
  assert.match(source, /Aucun message n’a été envoyé automatiquement/);
});

test("un échec de détection du compte quitte l'état de chargement et conserve le repli local", async () => {
  const source = await read("src/features/meetings/components/MailDraftSendPanel.tsx");
  assert.match(source, /status: "unavailable"/);
  assert.match(source, /Aucun connecteur actif/);
  assert.match(source, /generateLocalDraft\(\)/);
});

test("le brouillon généré peut être copié ou ouvert dans la messagerie de l'utilisateur", async () => {
  const source = await read("src/features/meetings/components/MailDraftSendPanel.tsx");
  assert.match(source, /navigator\.clipboard\.writeText/);
  assert.match(source, /const mailto = `mailto:/);
  assert.match(source, /Copier l’e-mail/);
  assert.match(source, /Ouvrir dans ma messagerie/);
});

test("le parcours local télécharge un message EML complet lorsque le PDF doit rester joint", async () => {
  const source = await read("src/features/meetings/components/MailDraftSendPanel.tsx");
  assert.match(source, /X-Unsent: 1/);
  assert.match(source, /Content-Disposition: attachment/);
  assert.match(source, /message\/rfc822/);
  assert.match(source, /Télécharger le mail complet \(\.eml\)/);
});

test("Gmail reste un canal optionnel avec confirmation d'envoi séparée", async () => {
  const source = await read("src/features/meetings/components/MailDraftSendPanel.tsx");
  assert.match(source, /Créer le brouillon Gmail/);
  assert.match(source, /<MailDraftReviewCard/);
  assert.match(source, /onSent=\{\(\) => onSent\?\.\(\)\}/);
});

test("les réunions affichent un fil d'Ariane avec réunion, occurrence et étape", async () => {
  const [ui, workflow] = await Promise.all([read("src/components/ui/ModuleUi.tsx"), read("src/features/meetings/components/MeetingWorkflow.tsx")]);
  assert.match(ui, /aria-label="Fil d’Ariane"/);
  assert.match(workflow, /meeting\.id/);
  assert.match(workflow, /steps\[step\]/);
});

test("le brouillon de préparation transmet le HTML et le PDF joint à l'API Gmail", async () => {
  const [panel, route, mime] = await Promise.all([
    read("src/features/meetings/components/MailDraftSendPanel.tsx"),
    read("src/app/api/mail/drafts/route.ts"),
    read("src/features/mail/server/google/gmail-mime.ts"),
  ]);
  assert.match(panel, /bodyHtml, inlineImages, attachments/);
  assert.match(route, /parseRichContent\(body\.bodyHtml, body\.inlineImages, body\.attachments\)/);
  assert.match(mime, /multipart\/mixed/);
  assert.match(mime, /Content-Disposition: attachment/);
  assert.match(mime, /multipart\/related/);
  assert.match(mime, /Content-ID:/);
  assert.match(mime, /multipart\/alternative/);
});
