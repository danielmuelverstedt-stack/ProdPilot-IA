import assert from "node:assert/strict";
import test from "node:test";
import { buildLabelFieldsFromDemoWorkOrder, buildLabelFieldsFromErpWorkOrder, deriveVisaInitials, emptyLabelFields } from "../src/features/pallet-label/services/pallet-label-lookup.ts";

test("emptyLabelFields ne renseigne que le n° d'OF, jamais les autres champs", () => {
  assert.deepEqual(emptyLabelFields("OF-500"), { ofNumber: "OF-500", client: "", quantity: "", articleCode: "", description: "", planNumber: "" });
});

test("buildLabelFieldsFromDemoWorkOrder reprend les champs de l'OF de démonstration trouvé", () => {
  const order = { id: "OF-500", customer: "EXAIL", article: "A100", description: "Bride", quantity: 24 };
  const fields = buildLabelFieldsFromDemoWorkOrder(order, "OF-500");
  assert.equal(fields.client, "EXAIL");
  assert.equal(fields.quantity, "24");
  assert.equal(fields.articleCode, "A100");
  assert.equal(fields.description, "Bride");
  assert.equal(fields.planNumber, "", "le n° de plan n'existe dans aucune source, jamais deviné");
});

test("buildLabelFieldsFromDemoWorkOrder retombe sur des champs vides quand l'OF est introuvable", () => {
  assert.deepEqual(buildLabelFieldsFromDemoWorkOrder(undefined, "OF-999"), emptyLabelFields("OF-999"));
});

test("buildLabelFieldsFromErpWorkOrder privilégie le work order complet sur la ligne d'opération de repli", () => {
  const workOrder = { customerName: "Safran", quantity: 24, articleCode: "AXE-TI-884", description: "Axe de commande en titane" };
  const fallbackRow = { workOrder: { customerName: "Autre client", quantity: 1 }, articleCode: "AUTRE", description: "Autre description" };
  const fields = buildLabelFieldsFromErpWorkOrder(workOrder, fallbackRow, "OF-240184");
  assert.equal(fields.client, "Safran");
  assert.equal(fields.quantity, "24");
  assert.equal(fields.articleCode, "AXE-TI-884");
  assert.equal(fields.description, "Axe de commande en titane");
});

test("buildLabelFieldsFromErpWorkOrder retombe sur la ligne d'opération pour une opération orpheline (sans ligne Top)", () => {
  const fallbackRow = { workOrder: { customerName: "Safran", quantity: 24 }, articleCode: "AXE-TI-884", description: "Axe de commande en titane" };
  const fields = buildLabelFieldsFromErpWorkOrder(null, fallbackRow, "OF-240184");
  assert.equal(fields.client, "Safran");
  assert.equal(fields.quantity, "24");
  assert.equal(fields.articleCode, "AXE-TI-884");
  assert.equal(fields.description, "Axe de commande en titane");
});

test("buildLabelFieldsFromErpWorkOrder retombe sur des champs vides quand ni le work order ni la ligne de repli n'apportent d'information", () => {
  assert.deepEqual(buildLabelFieldsFromErpWorkOrder(null, undefined, "OF-999"), emptyLabelFields("OF-999"));
});

test("deriveVisaInitials retourne les initiales prénom/nom de l'utilisateur actif, en majuscules", () => {
  const users = [
    { id: "1", active: false, firstName: "Sophie", lastName: "Planification" },
    { id: "2", active: true, firstName: "Daniel", lastName: "Mülverstedt" },
  ];
  assert.equal(deriveVisaInitials(users), "DM");
});

test("deriveVisaInitials renvoie une chaîne vide quand aucun utilisateur n'est actif", () => {
  assert.equal(deriveVisaInitials([{ id: "1", active: false, firstName: "Sophie", lastName: "Planification" }]), "");
});
