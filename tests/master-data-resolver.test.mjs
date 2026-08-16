import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { createMasterDataResolver, missingReferenceLabel } from "../src/features/master-data/services/master-data-resolver.ts";
import { auditMasterDataReferences } from "../src/features/master-data/services/master-data-integrity.ts";

test("le résolveur retourne l'objet détenu par le référentiel, sans en créer de copie", () => {
  const contact = { id: "contact-1", firstName: "Carmela" };
  const machine = { id: "DMU50", displayName: "DMU 50" };
  const resolver = createMasterDataResolver({ contacts: [contact], machines: [machine] });
  assert.equal(resolver.contact("contact-1").entity, contact);
  assert.equal(resolver.machine("DMU50").entity, machine);
  contact.firstName = "Carmen";
  assert.equal(resolver.contact("contact-1").entity.firstName, "Carmen");
});

test("une référence vide et une référence cassée sont distinguées explicitement", () => {
  const resolver = createMasterDataResolver({});
  assert.equal(resolver.contact(null).status, "unassigned");
  assert.deepEqual(resolver.machine("OLD-01"), { status: "missing", id: "OLD-01", entity: null });
  assert.equal(missingReferenceLabel("machine", "OLD-01"), "Machine introuvable (OLD-01)");
});

test("un OF ERP est prioritaire sur le repli de démonstration portant le même ID", () => {
  const demo = { id: "OF-1", customer: "Démo" };
  const erp = { id: "OF-1", customerName: "ERP" };
  const resolver = createMasterDataResolver({ demoWorkOrders: [demo], erpWorkOrders: [erp] });
  assert.equal(resolver.workOrder("OF-1").entity, erp);
});

test("les premiers écrans consommateurs utilisent la couche commune et le Parc Machines comme maître", async () => {
  const actionDetail = await readFile(new URL("../src/features/actions/components/ActionDetail.tsx", import.meta.url), "utf8");
  const actionLinks = await readFile(new URL("../src/features/actions/components/ActionLinkPickers.tsx", import.meta.url), "utf8");
  const maintenance = await readFile(new URL("../src/features/maintenance/components/MaintenanceProblemsWorkspace.tsx", import.meta.url), "utf8");
  assert.match(actionDetail, /references\.contact\(action\.responsableContactId\)/);
  assert.match(actionLinks, /machines: settings\.production\.machines/);
  assert.doesNotMatch(actionLinks, /data\.machines\.find/);
  assert.match(maintenance, /references\.machine\(problem\.machineId\)/);
  assert.match(maintenance, /Machine introuvable|missingReferenceLabel/);
});

test("l'audit signale les relations cassées sans modifier les données", () => {
  const resolver = createMasterDataResolver({ contacts: [{ id: "C-1" }], machines: [{ id: "M-1" }], demoWorkOrders: [{ id: "OF-1" }] });
  const action = { id: "A-1", responsableContactId: "C-X", contextLinks: [{ module: "machine", id: "M-1" }, { module: "workOrder", id: "OF-X" }] };
  const before = structuredClone(action);
  const issues = auditMasterDataReferences({ resolver, actions: [action] });
  assert.deepEqual(issues.map((item) => [item.kind, item.referenceId]), [["contact", "C-X"], ["of", "OF-X"]]);
  assert.deepEqual(action, before);
});
