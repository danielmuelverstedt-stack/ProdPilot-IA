import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("la boîte de réception Gmail est paginée sans filtre temporel", async () => {
  const provider = await read("src/features/mail/providers/google/google-mail-provider.ts");
  assert.match(provider, /labelIds: \["INBOX"\]/);
  assert.match(provider, /includeSpamTrash: false/);
  assert.match(provider, /page\.data\.nextPageToken/);
  assert.match(provider, /while \(pageToken/);
  assert.doesNotMatch(provider, /after:yesterday/);
});

test("la route et le chargeur demandent la synchronisation complète et exposent sa mesure", async () => {
  const route = await read("src/app/api/mail/messages/route.ts");
  const loader = await read("src/features/mail/components/MailWorkspaceLoader.tsx");
  const context = await read("src/features/mail/services/mail-account-context.ts");
  assert.match(route, /searchParams\.get\("all"\) === "true"/);
  assert.match(route, /searchParams\.get\("refresh"\) === "true"/);
  assert.match(loader, /\/api\/mail\/messages\?all=true/);
  assert.match(context, /getMailboxStatistics/);
  assert.match(context, /synchronizedMessages/);
  assert.match(context, /detectedMessages/);
});

test("la conversation naturelle utilise le fournisseur IA et conserve une session serveur partagée", async () => {
  const service = await read("src/features/mail-assistant/services/mail-assistant-session-service.ts");
  const ai = await read("src/features/mail-assistant/services/mail-assistant-ai-service.ts");
  const repository = await read("src/features/mail-assistant/server/mail-assistant-session-repository.ts");
  const workspace = await read("src/features/mail-assistant/components/MailAssistantWorkspace.tsx");
  assert.match(service, /continueMailAssistantConversation/);
  assert.match(ai, /mail_conversation/);
  assert.match(repository, /globalThis/);
  assert.match(workspace, /AbortController/);
  assert.doesNotMatch(workspace, /pause\(240\)/);
});

test("les canaux écrit et vocal sont indépendants et Plaud ne peut jamais être déclaré connecté", async () => {
  const settings = await read("src/features/settings/components/MailVoiceSettingsPanel.tsx");
  const speech = await read("src/features/mail-assistant/components/MailAssistantSpeechOutput.tsx");
  const diagnostic = await read("src/features/mail-diagnostics/components/MailDiagnosticsScreen.tsx");
  assert.match(settings, /Réponse écrite/);
  assert.match(settings, /Lecture automatique des réponses/);
  assert.match(speech, /La conversation continue en texte/);
  assert.match(diagnostic, /"plaud", "Plaud", "warning"/);
  assert.match(diagnostic, /aucun connecteur ni session Plaud n’existe/);
});

test("une conversation longue conserve les anciens tours sous forme condensée", async () => {
  const conversation = await read("src/features/mail-assistant/services/mail-assistant-ai-service.ts");
  assert.match(conversation, /buildConversationHistory/);
  assert.match(conversation, /Contexte antérieur conservé sous forme condensée/);
  assert.match(conversation, /session\.conversation\.slice\(0, -10\)/);
});
