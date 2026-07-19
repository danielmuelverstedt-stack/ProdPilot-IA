import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("la veille est un centre de commande sans chat ni champ texte", async () => { const standby = await read("src/features/mail-assistant/components/MailCommandCenterStandby.tsx"); assert.match(standby, /Morning Brief/); assert.match(standby, /Situation du jour/); assert.match(standby, /Travail déjà préparé/); assert.match(standby, /En attente de vous/); assert.doesNotMatch(standby, /textarea|MailAssistantInput|Que voulez-vous/); });

test("le démarrage payant ou distant reste derrière l'action explicite", async () => { const workspace = await read("src/features/mail-assistant/components/MailAssistantWorkspace.tsx"); const beforeStart = workspace.split("async function startSession")[0]; assert.match(beforeStart, /createMailSessionBrief/); assert.match(beforeStart, /session: null/); assert.doesNotMatch(beforeStart, /fetch\(|openai/i); assert.match(workspace, /onStart={startSession}/); });

test("le travail actif donne la priorité aux résultats et à la timeline", async () => { const workspace = await read("src/features/mail-assistant/components/MailAssistantWorkspace.tsx"); const timeline = await read("src/features/mail-assistant/components/MailExecutionTimeline.tsx"); assert.match(workspace, /MailDecisionList/); assert.match(workspace, /MailExecutionTimeline/); assert.match(workspace, /Conversation · secondaire/); assert.match(timeline, /Prêt pour validation/); assert.match(timeline, /Travail en cours/); });

test("la fin de session retourne en veille", async () => { const workspace = await read("src/features/mail-assistant/components/MailAssistantWorkspace.tsx"); const completion = await read("src/features/mail-assistant/components/MailSessionCompletion.tsx"); assert.match(workspace, /setScreen\("standby"\)/); assert.match(completion, /Retour au centre de commande/); assert.match(completion, /brouillons préparés/); });

test("le style est clair, cohérent avec le reste de l'app et réduit ses animations", async () => { const standby = await read("src/features/mail-assistant/components/MailCommandCenterStandby.tsx"); const page = await read("src/app/mails/assistant/page.tsx"); assert.doesNotMatch(standby, /#0b0e0d|#d8f567|#1f5f49/); assert.match(standby, /var\(--app-primary\)/); assert.match(standby, /sm:text-7xl/); assert.match(standby, /motion-reduce/); assert.match(page, /AppShell/); });
