import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

// action-grouping.ts importe action-status.ts via l'alias @/... : pas importable directement par
// node:test sans bundler, même limitation que action-service.ts — garde de texte source.
const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("sortWithOverdueFirst et endOfWeekIso sont exportées pour être réutilisées telles quelles par MeetingActionsTracker, sans réécrire la règle de tri/retard", async () => {
  const source = await read("src/features/actions/services/action-grouping.ts");
  assert.match(source, /export function sortWithOverdueFirst\(items: ProductionAction\[\], today: string\): ProductionAction\[\] \{/);
  assert.match(source, /export function endOfWeekIso\(today: string\): string \{/);
});
