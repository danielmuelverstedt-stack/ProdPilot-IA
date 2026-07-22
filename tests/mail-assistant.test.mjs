import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("la page initiale ne lance aucune analyse ni session", async () => {
  const page = await read("src/features/mail-assistant/components/MailAssistantWorkspace.tsx");
  const start = await read("src/features/mail-assistant/components/MailCommandCenterStandby.tsx");
  assert.match(page, /onStart={startSession}/);
  assert.match(start, /onClick={onStart}/);
  assert.match(page, /session: null/); assert.doesNotMatch(page.split("async function startSession")[0], /fetch\(/);
});

test("OK et l’intention explicite d’envoi restent distincts", async () => {
  const interpreter = await read("src/features/mail-assistant/services/mail-command-interpreter.ts");
  const approval = await read("src/features/mail-assistant/services/mail-approval-engine.ts");
  assert.match(interpreter, /isExplicitSend = \/\\b\(envoie\|envoyer\|expédie\|expédier\)\\b\//);
  assert.match(interpreter, /pendingIntent/);
  assert.match(approval, /level === 3 && !command\.isExplicitSend/);
});

test("aucun outil d’envoi externe n’est présent", async () => {
  const service = await read("src/features/mail-assistant/services/mail-assistant-session-service.ts");
  assert.match(service, /provider\.createDraft/);
  assert.match(service, /aucun message n’a été envoyé/i);
  assert.doesNotMatch(service, /provider\.send|gmail\.users\.messages\.send|messages\.send/);
});

test("le compte actif est vérifié avant et après les brouillons", async () => {
  const service = await read("src/features/mail-assistant/services/mail-assistant-session-service.ts");
  assert.match(service, /requireCurrentSession/);
  assert.match(service, /verified\.account\.id !== account\.id/);
  assert.match(service, /session\.draftsCreated\.includes\(messageId\)/);
});

test("les références ambiguës demandent une clarification", async () => {
  const resolver = await read("src/features/mail-assistant/services/mail-reference-resolver.ts");
  assert.match(resolver, /isAmbiguous: true/);
  assert.match(resolver, /Lequel souhaitez-vous traiter/);
});

test("la correction « pour le deuxième, dis plutôt » est reconnue", async () => {
  const interpreter = await read("src/features/mail-assistant/services/mail-command-interpreter.ts");
  const service = await read("src/features/mail-assistant/services/mail-assistant-session-service.ts");
  assert.match(interpreter, /dis plutôt/);
  assert.match(service, /dis plutôt/);
  assert.match(service, /currentVersion/);
});

test("la voix exige une action et prévoit un état non supporté", async () => {
  const voice = await read("src/features/mail-assistant/components/MailAssistantVoiceInput.tsx");
  assert.match(voice, /onClick=/);
  assert.match(voice, /Saisie vocale non disponible/);
  assert.match(voice, /continuous = settings\.inputMode !== "push_to_talk"/);
});

test("le parcours visuel reste conversationnel et centré sur les décisions", async () => {
  const workspace = await read("src/features/mail-assistant/components/MailAssistantWorkspace.tsx");
  const loading = await read("src/features/mail-assistant/components/MailSessionLoading.tsx");
  const decisionList = await read("src/features/mail-assistant/components/MailDecisionList.tsx");
  const noAction = await read("src/features/mail-assistant/components/MailNoActionGroup.tsx");
  assert.match(workspace, /"focused"/);
  assert.match(workspace, /MailAssistantInput/);
  assert.match(loading, /aria-busy="true"/);
  assert.match(decisionList, /À valider/);
  assert.match(noAction, /sans action recommandée/);
});

test("la session mail utilise le shell applicatif standard sans toucher à la liste traditionnelle", async () => {
  const page = await read("src/app/mails/assistant/page.tsx");
  const traditional = await read("src/app/mails/page.tsx");
  assert.match(page, /AppShell/);
  assert.match(page, /activeSection="mails"/);
  assert.match(traditional, /MailWorkspaceLoader/);
});

test("la validation simple et la validation des deux propositions sont reconnues", async () => {
  const interpreter = await read("src/features/mail-assistant/services/mail-command-interpreter.ts");
  const service = await read("src/features/mail-assistant/services/mail-assistant-session-service.ts");
  assert.match(interpreter, /pendingIntent \?\? "mark_processed"/);
  assert.match(interpreter, /\/les deux\//);
  assert.match(service, /approveReplies/);
});
