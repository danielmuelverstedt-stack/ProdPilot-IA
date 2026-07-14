import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { mailAiEvaluationFixtures } from "./fixtures/mail-ai-evaluation.mjs";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("les fixtures sont synthétiques et couvrent neuf scénarios", () => {
  assert.equal(mailAiEvaluationFixtures.length, 9);
  assert.equal(new Set(mailAiEvaluationFixtures.map((item) => item.id)).size, 9);
  assert.ok(mailAiEvaluationFixtures.every((item) => !item.body.includes("@tkmi.be")));
});

test("aucun appel IA ne part du chargement de la page Mail", async () => {
  const workspace = await read("src/features/mail/components/MailWorkspace.tsx");
  const loader = await read("src/features/mail/components/MailWorkspaceLoader.tsx");
  assert.doesNotMatch(workspace, /\/api\/ai\//);
  assert.doesNotMatch(loader, /\/api\/ai\//);
});

test("les appels IA restent attachés à des actions explicites", async () => {
  const panel = await read("src/features/ai/components/MailAiPanel.tsx");
  const editor = await read("src/features/ai/components/MailAiReplyEditor.tsx");
  assert.match(panel, /onClick=\{\(\) => void analyze\(false\)\}/);
  assert.match(editor, /onClick=\{\(\) => void generate\(\)\}/);
  assert.match(editor, /onClick=\{\(\) => void rewrite/);
  assert.doesNotMatch(panel, /useEffect/);
  assert.doesNotMatch(editor, /useEffect/);
});

test("les versions de prompts sont stables et sans valeur aléatoire", async () => {
  const prompts = await read("src/features/ai/prompts/mail-ai-prompts.ts");
  assert.match(prompts, /mail-analysis-v1/);
  assert.match(prompts, /mail-reply-v1/);
  assert.match(prompts, /mail-rewrite-v1/);
  assert.doesNotMatch(prompts, /Date\.now|Math\.random|new Date/);
});

test("la réécriture utilise le budget le plus compact", async () => {
  const budgets = await read("src/features/ai/config/ai-token-budget.ts");
  assert.match(budgets, /mail_analysis:[\s\S]*maximumOutputTokens: 1_200/);
  assert.match(budgets, /mail_reply:[\s\S]*maximumOutputTokens: 900/);
  assert.match(budgets, /mail_rewrite:[\s\S]*maximumOutputTokens: 500/);
  assert.match(budgets, /mail_rewrite:[\s\S]*maximumThreadMessages: 1/);
});

test("les journaux d’usage n’enregistrent pas le corps du message", async () => {
  const repository = await read("src/features/ai/server/repositories/local-ai-usage-repository.ts");
  assert.doesNotMatch(repository, /bodyText|messageBody|prompt:/);
});

test("aucune opération d’envoi Gmail n’est implémentée", async () => {
  const provider = await read("src/features/mail/providers/google/google-mail-provider.ts");
  assert.doesNotMatch(provider, /messages\.send|drafts\.send/);
  assert.match(provider, /drafts\.create/);
});

test("la clé de cache varie avec le contenu, le compte, le modèle, le prompt et les réglages", async () => {
  const service = await read("src/features/ai/services/mail-ai-service.ts");
  assert.match(service, /companyId:[\s\S]*userId:[\s\S]*accountId:[\s\S]*messageId:[\s\S]*content:[\s\S]*provider,[\s\S]*model,[\s\S]*promptVersion,[\s\S]*configuration/);
  assert.match(service, /!input\.forceRefresh && input\.configuration\.allowCachedResults/);
});

test("le contexte long est réduit avant l’appel et sa troncature est signalée", async () => {
  const reducer = await read("src/features/ai/services/mail-context-reducer.ts");
  assert.match(reducer, /while \(estimateTokens\(serialized\) > input\.budget\.maximumInputTokens/);
  assert.match(reducer, /wasTruncated: notes\.length > 0/);
  assert.match(reducer, /includesBinaryAttachments: false/);
});

test("les doublons en vol et les limites précèdent l’appel fournisseur", async () => {
  const service = await read("src/features/ai/services/mail-ai-service.ts");
  const guard = service.indexOf("await enforceAiUsageLimit");
  const coordinator = service.indexOf("return aiRequestCoordinator.run");
  const providerCall = service.indexOf("const result = await execute()", coordinator);
  assert.ok(guard >= 0 && coordinator > guard && providerCall > coordinator);
});

test("le changement de compte écarte le résultat", async () => {
  const service = await read("src/features/ai/services/mail-ai-service.ts");
  assert.match(service, /currentContext\.account\.id !== prepared\.account\.id/);
  assert.match(service, /account_changed/);
});
