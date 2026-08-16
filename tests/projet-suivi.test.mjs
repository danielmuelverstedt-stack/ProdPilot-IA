import test from "node:test";
import assert from "node:assert/strict";
import { migrateDemoData } from "../src/features/demo/services/demo-data-migration.ts";

function meeting(overrides = {}) { return { id: "MEET-PROD-01", type: "Production", date: "2026-08-08T08:00:00.000Z", status: "Préparation", createdByUserId: null, sharedAt: null, preparationSentAt: null, preparationSentVia: null, startedAt: null, closedAt: null, archivedAt: null, responsableContactId: null, participants: [], notes: [], decisions: [], parkingLot: [], actionIds: [], criticalWorkOrderIds: [], ...overrides }; }
function payload(meetings) { return { version: 2, actions: [], workOrders: [], planning: [], machines: [], maintenance: [], meetings, requests: [], erpQuality: [], notifications: [], contacts: [] }; }

test("la migration transforme les anciens OF critiques en cinq dossiers référencés au maximum", () => {
  const migrated = migrateDemoData(payload([meeting({ criticalWorkOrderIds: ["OF-1", "OF-2", "OF-3", "OF-4", "OF-5", "OF-6"] })]));
  assert.equal(migrated.meetings[0].priorityDossiers.length, 5);
  assert.deepEqual(migrated.meetings[0].priorityDossiers.map((item) => item.referenceId), ["OF-1", "OF-2", "OF-3", "OF-4", "OF-5"]);
  assert.ok(migrated.meetings[0].priorityDossiers.every((item) => item.referenceKind === "workOrder" && item.status === "À discuter"));
});

test("la migration complète sans perte un dossier déjà enregistré", () => {
  const dossier = { id: "DOS-1", title: "Arbitrage", referenceKind: "free", referenceId: null };
  const migrated = migrateDemoData(payload([meeting({ priorityDossiers: [dossier] })]));
  assert.deepEqual(migrated.meetings[0].priorityDossiers[0], { ...dossier, description: "", preparationComment: "", meetingComment: "", decision: "", status: "À discuter", actionIds: [] });
});
