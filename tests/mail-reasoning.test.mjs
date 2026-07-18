import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { reasonFromSnapshot, selectReasoningExecution } from "../src/features/mail-reasoning/services/mail-reasoning-engine.ts";

const now = new Date("2026-07-15T10:00:00.000Z");
const record = (values = {}) => ({ id: "one", sourceId: "source-one", title: "Dossier fournisseur", status: "open", dueAt: null, updatedAt: "2026-07-15T08:00:00.000Z", sourceLinkIds: [], type: "follow_up", ...values });

test("détecte une relance en retard comme risque local explicable", () => {
  const report = reasonFromSnapshot({ records: [record({ dueAt: "2026-07-14T08:00:00.000Z" })] }, now);
  assert.equal(report.objects[0].kind, "risk");
  assert.equal(report.objects[0].recommendedAction, "create_follow_up");
  assert.ok(report.objects[0].reason.length > 10);
  assert.equal(report.objects[0].supportingSources[0].recordId, "one");
  assert.equal(report.execution.mode, "local");
  assert.equal(report.execution.aiCalled, false);
  assert.equal(report.execution.tokenEstimate, 0);
});

test("conserve une réponse prête en attente de confirmation", () => {
  const report = reasonFromSnapshot({ records: [record({ type: "reply", status: "pending" })] }, now);
  assert.equal(report.objects[0].kind, "waiting_item");
  assert.equal(report.objects[0].recommendedAction, "ask_confirmation");
  assert.equal(report.objects[0].confidence, 0.99);
});

test("recommande sans créer une réunion", () => {
  const report = reasonFromSnapshot({ records: [record({ type: "meeting", status: "prepared" })] }, now);
  assert.equal(report.objects[0].kind, "recommendation");
  assert.equal(report.objects[0].recommendedAction, "schedule_meeting");
});

test("relie les objets qui partagent une source métier", () => {
  const records = [record({ id: "a", sourceLinkIds: ["mail:42"] }), record({ id: "b", type: "commitment", status: "confirmed", sourceLinkIds: ["mail:42"] })];
  const report = reasonFromSnapshot({ records }, now);
  assert.ok(report.dependencies.some((item) => item.relation === "impacts"));
});

test("signale les engagements contradictoires", () => {
  const common = { type: "commitment", status: "confirmed", dueAt: "2026-07-20T08:00:00.000Z", stakeholder: "client@example.com" };
  const report = reasonFromSnapshot({ records: [record({ ...common, id: "a" }), record({ ...common, id: "b", title: "Autre promesse" })] }, now);
  assert.ok(report.objects.some((item) => item.kind === "conflict" && item.supportingSources.length === 2));
});

test("regroupe les réponses d'une même conversation en opportunité", () => {
  const report = reasonFromSnapshot({ records: [record({ id: "a", type: "reply", status: "pending", threadId: "t1" }), record({ id: "b", type: "reply", status: "pending", threadId: "t1" })] }, now);
  assert.ok(report.objects.some((item) => item.kind === "opportunity"));
  assert.ok(report.dependencies.some((item) => item.relation === "duplicates"));
});

test("n'escalade vers l'IA qu'avec consentement explicite", () => {
  assert.equal(selectReasoningExecution({ deterministicSufficient: false, cacheAvailable: false, explicitAiConsent: false }).aiCalled, false);
  assert.equal(selectReasoningExecution({ deterministicSufficient: false, cacheAvailable: true, explicitAiConsent: false }).mode, "cached");
  assert.deepEqual(selectReasoningExecution({ deterministicSufficient: false, cacheAvailable: false, explicitAiConsent: true, estimatedTokens: 700 }), { mode: "ai", reason: "Synthèse complexe explicitement demandée", tokenEstimate: 700, aiCalled: true });
});

test("le service lit les magasins locaux et journalise sans fournisseur distant", async () => {
  const service = await readFile(new URL("../src/features/mail-reasoning/services/local-mail-reasoning-service.ts", import.meta.url), "utf8");
  for (const store of ["mailMessages", "replyProposals", "followUps", "commitments", "mailDecisions", "meetingRequests", "internalActions", "assistantSessions"]) assert.match(service, new RegExp(`"${store}"`));
  assert.match(service, /usageMetrics/);
  assert.match(service, /aiCalled: false/);
  assert.doesNotMatch(service, /fetch\(|openai|gmail/i);
});

test("l'interface affiche justification, confiance et sources", async () => {
  const component = await readFile(new URL("../src/features/mail-reasoning/components/MailReasoningRecommendations.tsx", import.meta.url), "utf8");
  assert.match(component, /Assistant Recommendations/);
  assert.match(component, /Pourquoi cette recommandation/);
  assert.match(component, /Confiance/);
  assert.match(component, /source/);
});
