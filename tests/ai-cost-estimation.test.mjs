import assert from "node:assert/strict";
import test from "node:test";
import { estimateAiUsageCost, hasValidatedPricing } from "../src/features/ai/services/ai-cost-estimation.ts";

const usage = { inputTokens: 1_000, cachedInputTokens: 200, outputTokens: 500, totalTokens: 1_500 };
const pricing = [{
  id: "official-example",
  provider: "openai",
  model: "test-model",
  inputPricePerMillionTokens: 1,
  cachedInputPricePerMillionTokens: 0.5,
  outputPricePerMillionTokens: 2,
  currency: "EUR",
  effectiveDate: "2026-01-01",
  sourceNote: "Valeurs synthétiques de test, pas un tarif réel",
  enabled: true,
}];

test("aucun registre ne produit aucune estimation inventée", () => {
  assert.equal(hasValidatedPricing([], "EUR"), false);
  assert.equal(estimateAiUsageCost({ model: "test-model", usage, pricingRegistry: [], currency: "EUR", occurredAt: "2026-07-14T12:00:00.000Z" }), null);
});

test("un tarif exact calcule séparément entrée, cache et sortie", () => {
  assert.equal(hasValidatedPricing(pricing, "EUR"), true);
  assert.equal(estimateAiUsageCost({ model: "test-model", usage, pricingRegistry: pricing, currency: "EUR", occurredAt: "2026-07-14T12:00:00.000Z" }), 0.0019);
});

test("un modèle, une devise ou une date sans tarif exact reste non estimé", () => {
  assert.equal(estimateAiUsageCost({ model: "another-model", usage, pricingRegistry: pricing, currency: "EUR", occurredAt: "2026-07-14T12:00:00.000Z" }), null);
  assert.equal(estimateAiUsageCost({ model: "test-model", usage, pricingRegistry: pricing, currency: "USD", occurredAt: "2026-07-14T12:00:00.000Z" }), null);
  assert.equal(estimateAiUsageCost({ model: "test-model", usage, pricingRegistry: pricing, currency: "EUR", occurredAt: "2025-12-31T12:00:00.000Z" }), null);
});
