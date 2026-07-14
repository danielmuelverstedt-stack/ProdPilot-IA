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
  const recorder = await read("src/features/ai/services/ai-usage-recorder.ts");
  assert.doesNotMatch(repository, /bodyText|messageBody|prompt:/);
  assert.match(recorder, /providerRequestAttempted/);
  assert.doesNotMatch(recorder, /bodyText|messageBody|fullReply|prompt:/);
});

test("aucune opération d’envoi Gmail n’est implémentée", async () => {
  const provider = await read("src/features/mail/providers/google/google-mail-provider.ts");
  assert.doesNotMatch(provider, /messages\.send|drafts\.send/);
  assert.match(provider, /drafts\.create/);
});

test("le transport Gmail utilise le fetch serveur sans cache pendant le rendu RSC", async () => {
  const provider = await read("src/features/mail/providers/google/google-mail-provider.ts");
  assert.match(provider, /fetchImplementation: globalThis\.fetch/);
  assert.match(provider, /cache: "no-store"/);
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

test("le plafond mensuel projeté précède aussi tout appel fournisseur", async () => {
  const guard = await read("src/features/ai/server/ai-usage-guard.ts");
  const service = await read("src/features/ai/services/mail-ai-service.ts");
  assert.match(guard, /estimatedMonthCost \+ projectedCost >= input\.budgetPolicy\.monthlyHardStopAmount/);
  assert.match(guard, /allowAdministratorOverride && input\.budgetPolicy\.administratorOverrideActive/);
  assert.match(service, /await enforceAiUsageLimit[\s\S]*const result = await execute\(\)/);
});

test("le dépassement administrateur et les automatismes sont désactivés par défaut", async () => {
  const policy = await read("src/features/ai/config/ai-budget-policy.ts");
  const defaults = await read("src/features/settings/config/default-settings.ts");
  assert.match(policy, /allowAdministratorOverride: false/);
  assert.match(policy, /administratorOverrideActive: false/);
  assert.match(defaults, /automaticAnalysis: false/);
  assert.match(defaults, /automaticDraftCreation: false/);
  assert.match(defaults, /allowSending: false/);
});

test("le test OpenAI est minimal, serveur et sans contenu Mail", async () => {
  const provider = await read("src/features/ai/providers/openai/openai-ai-provider.ts");
  const route = await read("src/app/api/ai/test-connection/route.ts");
  const method = provider.slice(provider.indexOf("async testConnection"), provider.indexOf("private async createReply"));
  assert.match(method, /input: "Réponds uniquement par OK\."/);
  assert.match(method, /store: false/);
  assert.doesNotMatch(method, /bodyText|selectedMessage|thread/);
  assert.match(route, /isTrustedSameOriginRequest/);
});

test("les erreurs OpenAI sensibles sont converties en messages français sûrs", async () => {
  const provider = await read("src/features/ai/providers/openai/openai-ai-provider.ts");
  assert.match(provider, /AuthenticationError[\s\S]*La clé OpenAI est invalide/);
  assert.match(provider, /insufficient_quota[\s\S]*facturation ou le quota OpenAI/);
  assert.match(provider, /NotFoundError[\s\S]*modèle OpenAI configuré n’est pas disponible/);
  assert.doesNotMatch(provider, /console\.(log|error|warn)/);
});

test("les secrets et fichiers locaux restent hors du client et de Git", async () => {
  const settingsPanel = await read("src/features/settings/components/AiConfigurationPanel.tsx");
  const statusRoute = await read("src/app/api/ai/mail/status/route.ts");
  const gitignore = await read(".gitignore");
  assert.doesNotMatch(settingsPanel, /OPENAI_API_KEY|apiKeyValue|secretFragment/);
  assert.match(statusRoute, /apiKeyPresent: Boolean\(process\.env\.OPENAI_API_KEY\?\.trim\(\)\)/);
  assert.doesNotMatch(statusRoute, /apiKeyValue|secretFragment|apiKey:\s*process\.env|OPENAI_API_KEY\?\.slice/);
  assert.match(gitignore, /\.env\*/);
  assert.match(gitignore, /!\.env\.example/);
});

test("la création du brouillon Gmail exige toujours une confirmation", async () => {
  const editor = await read("src/features/ai/components/MailAiReplyEditor.tsx");
  assert.match(editor, /if \(!reply \|\| !confirmed\) return/);
  assert.match(editor, /confirmed: true/);
  assert.match(editor, /Aucun e-mail ne sera envoyé/);
});

test("le changement de compte écarte le résultat", async () => {
  const service = await read("src/features/ai/services/mail-ai-service.ts");
  assert.match(service, /currentContext\.account\.id !== prepared\.account\.id/);
  assert.match(service, /account_changed/);
});
