import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("ActionLinkPickers est partagé par ActionFormDialog et ActionQuickEditPanel, jamais une logique de sélection dupliquée", async () => {
  const dialog = await read("src/features/actions/components/ActionFormDialog.tsx");
  const panel = await read("src/features/actions/components/ActionQuickEditPanel.tsx");
  assert.match(dialog, /import \{ ActionLinkPickers \} from "@\/features\/actions\/components\/ActionLinkPickers"/);
  assert.match(panel, /import \{ ActionLinkPickers \} from "@\/features\/actions\/components\/ActionLinkPickers"/);
});

test("la case « Aussi comme Maintenance » ajoute un second lien module=\"maintenance\" sur la même machine, jamais un second sélecteur machine", async () => {
  const source = await read("src/features/actions/components/ActionLinkPickers.tsx");
  assert.match(source, /if \(alsoMaintenance\) onAdd\(\{ module: "maintenance", id: machine\.id,/);
});

test("ActionFormDialog affiche les sélecteurs de liens uniquement quand allowLinkPicker est activé (pas pour les 8 appelants existants, qui n'ont pas besoin de la surcharge)", async () => {
  const source = await read("src/features/actions/components/ActionFormDialog.tsx");
  assert.match(source, /allowLinkPicker\?: boolean;/);
  assert.match(source, /\{allowLinkPicker \? <div>/);
  assert.match(source, /contextLinks: \[contextLink, \.\.\.additionalContextLinks, \.\.\.extraLinks\]\.filter\(\(item\): item is ActionContextLink => item !== null\),/, "fusionne les liens programmatiques de l'appelant avec ceux choisis dans le formulaire");
});

test("le catalogue de canaux couvre Machine, OF et Qualité — jamais une entité Projet distincte (aucune n'existe dans ce codebase)", async () => {
  const source = await read("src/features/actions/components/ActionLinkPickers.tsx");
  assert.match(source, /Machine liée/);
  assert.match(source, /OF \/ Projet lié/);
  assert.match(source, /Qualité liée/);
});
