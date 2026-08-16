import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("ActionActivity est partagé par la fiche action et le panneau rapide de réunion — un seul endroit qui compose commentaires/historique", async () => {
  const detail = await read("src/features/actions/components/ActionDetail.tsx");
  const panel = await read("src/features/actions/components/ActionQuickEditPanel.tsx");
  assert.match(detail, /import \{ ActionActivity \} from "@\/features\/actions\/components\/ActionActivity"/);
  assert.match(panel, /import \{ ActionActivity \} from "@\/features\/actions\/components\/ActionActivity"/);
});

test("chaque commentaire affiche l'auteur et la date, le plus récent en premier", async () => {
  const source = await read("src/features/actions/components/ActionActivity.tsx");
  assert.match(source, /const comments = \[\.\.\.action\.comments\]\.reverse\(\);/);
  assert.match(source, /<strong className="font-semibold text-\[var\(--app-text\)\]">{item\.author}<\/strong>{formatEuropeanDate\(item\.date, true\)}/);
});

test("l'historique complet est replié par défaut (accessible via <details>), pas affiché en permanence", async () => {
  const source = await read("src/features/actions/components/ActionActivity.tsx");
  assert.match(source, /<details>/);
  assert.match(source, /Voir l’historique complet/);
});
