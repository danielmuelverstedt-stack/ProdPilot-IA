import assert from "node:assert/strict";
import test from "node:test";
import { cycleColumnSort, defaultColumnSort, moveColumnId, sortRows } from "../src/lib/table-columns.ts";

test("moveColumnId déplace une colonne juste à la place de la cible sans dupliquer ni perdre d'entrée", () => {
  assert.deepEqual(moveColumnId(["a", "b", "c", "d"], "a", "c"), ["b", "c", "a", "d"]);
  assert.deepEqual(moveColumnId(["a", "b", "c", "d"], "d", "b"), ["a", "d", "b", "c"]);
});

test("moveColumnId ignore un identifiant inconnu ou identique à la cible, sans planter", () => {
  const order = ["a", "b", "c"];
  assert.deepEqual(moveColumnId(order, "a", "a"), order);
  assert.deepEqual(moveColumnId(order, "x", "b"), order);
  assert.deepEqual(moveColumnId(order, "a", "x"), order);
});

test("cycleColumnSort suit décroissant → croissant → aucun tri, une seule colonne active à la fois", () => {
  const initial = defaultColumnSort();
  assert.deepEqual(initial, { column: null, direction: "desc" });
  const first = cycleColumnSort(initial, "name");
  assert.deepEqual(first, { column: "name", direction: "desc" });
  const second = cycleColumnSort(first, "name");
  assert.deepEqual(second, { column: "name", direction: "asc" });
  const third = cycleColumnSort(second, "name");
  assert.deepEqual(third, { column: null, direction: "desc" });
});

test("cycleColumnSort bascule directement sur une autre colonne en tri décroissant, sans passer par le cycle de la précédente", () => {
  const onName = { column: "name", direction: "asc" };
  assert.deepEqual(cycleColumnSort(onName, "date"), { column: "date", direction: "desc" });
});

test("sortRows ne change rien tant qu'aucune colonne n'est active", () => {
  const rows = [{ id: "b" }, { id: "a" }];
  assert.deepEqual(sortRows(rows, defaultColumnSort(), (row, column) => row[column]), rows);
});

test("sortRows compare numériquement quand les deux valeurs sont des number", () => {
  const rows = [{ value: 30 }, { value: 5 }, { value: 12 }];
  const sorted = sortRows(rows, { column: "value", direction: "asc" }, (row) => row.value);
  assert.deepEqual(sorted.map((row) => row.value), [5, 12, 30]);
  const desc = sortRows(rows, { column: "value", direction: "desc" }, (row) => row.value);
  assert.deepEqual(desc.map((row) => row.value), [30, 12, 5]);
});

test("sortRows compare le texte en locale française, accents et nombres inclus dans le texte triés naturellement", () => {
  const rows = [{ label: "Étau 10" }, { label: "Étau 2" }, { label: "Affûtage" }];
  const sorted = sortRows(rows, { column: "label", direction: "asc" }, (row) => row.label);
  assert.deepEqual(sorted.map((row) => row.label), ["Affûtage", "Étau 2", "Étau 10"]);
});

test("sortRows fait toujours couler les valeurs null/undefined en bas, quelle que soit la direction", () => {
  const rows = [{ id: "a", value: 5 }, { id: "b", value: null }, { id: "c", value: 1 }, { id: "d", value: undefined }];
  const asc = sortRows(rows, { column: "value", direction: "asc" }, (row) => row.value);
  assert.deepEqual(asc.map((row) => row.id).slice(0, 2), ["c", "a"]);
  assert.deepEqual(new Set(asc.map((row) => row.id).slice(2)), new Set(["b", "d"]));
  const desc = sortRows(rows, { column: "value", direction: "desc" }, (row) => row.value);
  assert.deepEqual(desc.map((row) => row.id).slice(0, 2), ["a", "c"]);
  assert.deepEqual(new Set(desc.map((row) => row.id).slice(2)), new Set(["b", "d"]));
});

test("sortRows ne modifie pas le tableau d'origine (retourne toujours une copie)", () => {
  const rows = [{ value: 2 }, { value: 1 }];
  const sorted = sortRows(rows, { column: "value", direction: "asc" }, (row) => row.value);
  assert.notEqual(sorted, rows);
  assert.deepEqual(rows.map((row) => row.value), [2, 1], "le tableau source n'est pas trié en place");
});
