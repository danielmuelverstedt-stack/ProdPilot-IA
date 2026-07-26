import assert from "node:assert/strict";
import test from "node:test";
import { groupMachinesByTaskCategory } from "../src/lib/task-category-grouping.ts";
import { UNCATEGORIZED_TASK_CATEGORY_VALUE } from "../src/lib/task-category-dictionary.ts";

function machine(id, taskCategoryCode) {
  return { id, taskCategoryCode };
}

test("groupMachinesByTaskCategory ne renvoie aucun groupe tant qu'aucune catégorie n'est activée (comportement par défaut, vide)", () => {
  const machines = [machine("TOU-01", "5"), machine("FRA-01", "27")];
  assert.deepEqual(groupMachinesByTaskCategory(machines, []), []);
});

test("groupMachinesByTaskCategory ne garde que les catégories explicitement activées, dans l'ordre canonique du dictionnaire", () => {
  const machines = [machine("FRA-01", "27"), machine("TOU-01", "5"), machine("TOU-02", "5")];
  const groups = groupMachinesByTaskCategory(machines, ["27", "5"]);
  assert.deepEqual(groups.map((group) => group.code), ["5", "27"], "l'ordre suit le dictionnaire (5 avant 27), pas l'ordre d'activation");
  assert.equal(groups[0].label, "Tournage");
  assert.deepEqual(groups[0].machines.map((m) => m.id), ["TOU-01", "TOU-02"]);
  assert.deepEqual(groups[1].machines.map((m) => m.id), ["FRA-01"]);
});

test("groupMachinesByTaskCategory ajoute un groupe « Non catégorisées » uniquement si le sentinel est activé", () => {
  const machines = [machine("POS-01", null), machine("POS-02", undefined)];
  assert.deepEqual(groupMachinesByTaskCategory(machines, []), [], "sans le sentinel, aucun groupe même pour des machines non catégorisées");
  const groups = groupMachinesByTaskCategory(machines, [UNCATEGORIZED_TASK_CATEGORY_VALUE]);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].code, null);
  assert.equal(groups[0].label, "Non catégorisées");
  assert.deepEqual(groups[0].machines.map((m) => m.id), ["POS-01", "POS-02"]);
});

test("groupMachinesByTaskCategory : un poste de travail sans machine physique se regroupe comme n'importe quelle machine, par sa catégorie", () => {
  const poste = { id: "EBA-01", kind: "poste", taskCategoryCode: "15" };
  const groups = groupMachinesByTaskCategory([poste], ["15"]);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].label, "Ebavurage");
  assert.deepEqual(groups[0].machines, [poste]);
});
