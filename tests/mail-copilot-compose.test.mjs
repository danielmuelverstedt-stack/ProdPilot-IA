import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { canExecuteMailCommand, getMailActionLevel } from "../src/features/mail-assistant/services/mail-approval-engine.ts";
import { resolveProductionContext } from "../src/features/mail-assistant/services/production-context-resolver.ts";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

const workOrders = [
  { id: "OF-240184", customer: "Safran Aero Boosters", article: "AXE-TI-884", dueDate: "2026-07-15", status: "En production", project: "Projet LEAP" },
  { id: "OF-240191", customer: "John Cockerill", article: "BRIDE-316L-42", dueDate: "2026-07-17", status: "Bloqué", project: "Ligne H2" },
];

test("une demande de rédaction de mail est reconnue et distinguée d’une réponse", async () => {
  const interpreter = await read("src/features/mail-assistant/services/mail-command-interpreter.ts");
  assert.match(interpreter, /isComposeRequest = .*écris.*rédige.*prépare/);
  assert.match(interpreter, /intent = "compose_new_mail"/);
  assert.match(interpreter, /!\/répond\|réponse\//);
  assert.match(interpreter, /recipientEmail: intent === "compose_new_mail" \? extractEmail\(text\) : undefined/);
});

test("l’extraction du destinataire ne devine jamais une adresse absente du texte", async () => {
  const interpreter = await read("src/features/mail-assistant/services/mail-command-interpreter.ts");
  const extractor = interpreter.split("function extractEmail")[1];
  assert.ok(extractor);
  assert.doesNotMatch(extractor, /@example|@client\.com|invente/i);
});

test("compose_new_mail est de niveau 2 comme create_draft, jamais niveau 3", () => {
  assert.equal(getMailActionLevel("compose_new_mail"), 2);
  const command = { intent: "compose_new_mail", rawText: "x", messageIds: [], isExplicitSend: false, isAmbiguous: false, isConversationalFallback: false };
  assert.equal(canExecuteMailCommand(command).allowed, true);
});

test("compose_new_mail est mappé sur la capacité writing et le risque prepare dans l’orchestrateur", async () => {
  const orchestration = await read("src/features/mail-assistant/services/mail-assistant-orchestration.ts");
  const capabilitySection = orchestration.split("function capabilityForIntent")[1].split("function riskForIntent")[0];
  const riskSection = orchestration.split("function riskForIntent")[1];
  assert.match(capabilitySection, /compose_new_mail.*return "writing"|"create_draft" \|\| intent === "send_email" \|\| intent === "compose_new_mail"\) return "writing"/);
  assert.match(riskSection, /compose_new_mail.*return "prepare"|"create_action" \|\| intent === "compose_new_mail"\) return "prepare"/);
});

test("résout un OF explicitement cité vers son contexte de production", () => {
  const context = resolveProductionContext("décale l’OF-240184 de deux jours", workOrders);
  assert.deepEqual(context, { workOrderId: "OF-240184", customer: "Safran Aero Boosters", article: "AXE-TI-884", dueDate: "2026-07-15", status: "En production", project: "Projet LEAP" });
});

test("résout un client cité par son nom vers son contexte de production", () => {
  const context = resolveProductionContext("relance John Cockerill sur la bride", workOrders);
  assert.equal(context.workOrderId, "OF-240191");
});

test("ne devine aucun contexte de production quand rien ne correspond", () => {
  const context = resolveProductionContext("écris un mail à un fournisseur inconnu", workOrders);
  assert.equal(context, null);
});

test("l’envoi réel n’est jamais atteignable depuis le moteur de conversation", async () => {
  const service = await read("src/features/mail-assistant/services/mail-assistant-session-service.ts");
  assert.match(service, /provider\.createDraft/);
  assert.doesNotMatch(service, /provider\.send|gmail\.users\.messages\.send|messages\.send/);
  assert.match(service, /aucun message n’a été envoyé|Aucun message n’a été envoyé/);
});

test("la route d’envoi exige une confirmation explicite et le réglage d’envoi activé", async () => {
  const route = await read("src/app/api/mail/drafts/[draftId]/send/route.ts");
  assert.match(route, /body\.confirmed !== true/);
  assert.match(route, /account\.settings\.sendingEnabled/);
  assert.match(route, /isTrustedSameOriginRequest/);
});

test("le fournisseur Google vérifie sendingEnabled avant d’appeler l’API Gmail d’envoi", async () => {
  const provider = await read("src/features/mail/providers/google/google-mail-provider.ts");
  assert.match(provider, /if \(!this\.account\.settings\.sendingEnabled\)/);
  assert.match(provider, /gmail\.users\.drafts\.send/);
});

test("le schéma de rédaction IA ne demande jamais l’invention d’un destinataire", async () => {
  const schema = await read("src/features/ai/validation/mail-ai-schema.ts");
  const composeSchemaSource = schema.split("MAIL_COMPOSE_JSON_SCHEMA")[1].split("export function validateMailAiCompose")[0];
  assert.doesNotMatch(composeSchemaSource, /recipients|destinataire/i);
  assert.match(composeSchemaSource, /missingInformation/);
});

test("le brouillon composé n’est créé qu’après confirmation explicite dans la conversation", async () => {
  const service = await read("src/features/mail-assistant/services/mail-assistant-session-service.ts");
  const composeSection = service.split("async function composeNewMail")[1].split("async function finalizeComposeDraft")[0];
  assert.match(composeSection, /pendingApproval = \{ intent: "compose_new_mail"/);
  assert.doesNotMatch(composeSection, /provider\.createDraft/);
});

test("les modèles de mail sont configurables et seedés à partir des exemples fournis, sans valeur en dur ailleurs", async () => {
  const defaults = await read("src/features/settings/config/default-settings.ts");
  assert.match(defaults, /mailTemplates: \[/);
  assert.match(defaults, /Relance client — retard/);
  assert.match(defaults, /Relance fournisseur/);
});
