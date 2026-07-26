import assert from "node:assert/strict";
import test from "node:test";
import { computeVirtualRowRange } from "../src/features/planning/services/virtual-rows.ts";

test("computeVirtualRowRange ne monte qu'une fenêtre bornée de lignes autour du défilement, quelle que soit la taille totale", () => {
  // 5000 opérations, cadre de 10 lignes (520px de hauteur visible), tout en haut du défilement.
  const range = computeVirtualRowRange(0, 520, 52, 5000);
  assert.equal(range.startIndex, 0);
  assert.ok(range.endIndex < 30, "seule une petite fenêtre autour de ce qui est visible doit être montée, pas les 5000 lignes");
  assert.equal(range.topSpacerPx, 0);
  assert.ok(range.bottomSpacerPx > 0, "les lignes non montées restent représentées par un espacement, pas perdues");
});

test("computeVirtualRowRange déplace la fenêtre en fonction du défilement, sans jamais dépasser le total de lignes", () => {
  const range = computeVirtualRowRange(52 * 4990, 520, 52, 5000);
  assert.ok(range.endIndex <= 5000);
  assert.equal(range.bottomSpacerPx, 0, "en bas de la liste, plus aucune ligne restante après la fenêtre");
  assert.ok(range.startIndex > 4900, "la fenêtre a bien avancé près de la fin de la liste");
});

test("computeVirtualRowRange couvre l'intégralité des lignes quand la fenêtre est aussi grande que le contenu (réglage « Toutes »)", () => {
  const totalRows = 250;
  const range = computeVirtualRowRange(0, totalRows * 52, 52, totalRows);
  assert.equal(range.startIndex, 0);
  assert.equal(range.endIndex, totalRows, "aucune opération n'est masquée quand le cadre n'est pas borné");
  assert.equal(range.topSpacerPx, 0);
  assert.equal(range.bottomSpacerPx, 0);
});

test("computeVirtualRowRange retombe proprement sur une plage vide sans liste", () => {
  const range = computeVirtualRowRange(0, 520, 52, 0);
  assert.deepEqual(range, { startIndex: 0, endIndex: 0, topSpacerPx: 0, bottomSpacerPx: 0 });
});
