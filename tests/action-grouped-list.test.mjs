import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

// ActionRow.tsx importe react/next.js et des modules alias `@/...` : pas importable directement par
// node:test (pas de bundler ici), même convention que le reste du dépôt pour ces fichiers — garde
// de texte source sur le mapping colonne → valeur comparable plutôt qu'un appel direct.
test("getActionSortValue mappe chacune des 9 colonnes existantes vers une valeur comparable, sans en inventer une nouvelle", async () => {
  const source = await readFile(new URL("../src/features/actions/components/ActionRow.tsx", import.meta.url), "utf8");
  assert.match(source, /export function getActionSortValue\(action: ProductionAction, columnId: string, origins: ActionOriginSettings\[\]\): string \| number \{/);
  assert.match(source, /if \(columnId === "dateEncodage"\) return action\.dateEncodage;/);
  assert.match(source, /if \(columnId === "introduitPar"\) return action\.introduitPar;/);
  assert.match(source, /if \(columnId === "origine"\) \{ const origin = origins\.find\(\(item\) => item\.value === action\.origine\); return origin\?\.label \?\? action\.origine; \}/, "résout le libellé de l'origine, pas sa valeur brute");
  assert.match(source, /if \(columnId === "description"\) return action\.description;/);
  assert.match(source, /if \(columnId === "responsable"\) return action\.responsable;/);
  assert.match(source, /if \(columnId === "echeance"\) return action\.echeance;/);
  assert.match(source, /if \(columnId === "statut"\) return action\.statut;/);
  assert.match(source, /if \(columnId === "remarque"\) return action\.remarque \?\? "";/, "une remarque absente retombe sur une chaîne vide plutôt que null, pour ne jamais faire couler la ligne au hasard");
  assert.match(source, /if \(columnId === "lienContexte"\) return action\.contextLinks\.map\(\(item\) => item\.label\)\.join\(", "\);/);
});

test("le tableau Actions (ActionGroupedList) trie chaque groupe au clic sur un en-tête, sans glisser-déposer de colonnes (l'ordre reste piloté par Réglages → Actions)", async () => {
  const list = await readFile(new URL("../src/features/actions/components/ActionGroupedList.tsx", import.meta.url), "utf8");
  assert.match(list, /from "@\/lib\/use-table-columns"/);
  assert.match(list, /from "@\/lib\/table-columns"/);
  assert.match(list, /const \{ sort, cycleSort \} = useTableColumns<string>\("actions-list", columns\.map\(\(column\) => column\.id\)\);/);
  assert.match(list, /const sortedItems = sortRows\(group\.items, sort, \(action, columnId\) => getActionSortValue\(action, columnId, origins\)\);/);
  assert.doesNotMatch(list, /createColumnDragHandlers/, "pas de glisser-déposer de colonnes ici, décision explicite de l'utilisateur");
  assert.doesNotMatch(list, /visibleColumns\.sort/, "l'ordre des colonnes reste celui configuré dans Réglages → Actions, jamais réécrit ici");
});
