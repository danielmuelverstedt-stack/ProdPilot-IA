import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function read(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("la revue des actions de réunion réutilise le tableau du module Actions (ActionGroupedList), pas une présentation ad hoc", async () => {
  const source = await read("src/features/meetings/components/MeetingActionReview.tsx");
  assert.match(source, /import \{ ActionGroupedList \} from "@\/features\/actions\/components\/ActionGroupedList"/);
  assert.match(source, /<ActionGroupedList actions={items} mode={mode} columns={settings\.actions\.columns} origins={settings\.actions\.origins} people={data\.people} variant="current" \/>/, "mêmes colonnes/origines que Réglages → Actions, source unique avec le module Actions");
});

test("la revue des actions de réunion ne redéfinit plus ses propres mutations : Fait/Reporter/réassignation passent par ActionRow, comme dans le module Actions", async () => {
  const source = await read("src/features/meetings/components/MeetingActionReview.tsx");
  assert.doesNotMatch(source, /completeAction|postponeAction|reassignAction/, "aucune logique de mutation dupliquée : ActionGroupedList/ActionRow s'en chargent déjà");
});

test("la revue des actions de réunion garde le même filtre (origine + statut « À faire ») et son message d'état vide contextuel", async () => {
  const source = await read("src/features/meetings/components/MeetingActionReview.tsx");
  assert.match(source, /item\.origine === origine && item\.statut === "À faire"/);
  assert.match(source, /Aucune action « À faire » en attente pour cette origine\. Vous pouvez passer aux nouveaux sujets\./);
});

test("le regroupement proposé dans la revue de réunion exclut « Par origine » (toujours un seul groupe, l'origine étant déjà filtrée)", async () => {
  const source = await read("src/features/meetings/components/MeetingActionReview.tsx");
  assert.match(source, /\{ mode: "personne", label: "Par personne" \}/);
  assert.match(source, /\{ mode: "echeance", label: "Par échéance" \}/);
  assert.doesNotMatch(source, /mode: "origine"/, "grouper par origine n'a pas de sens ici : toutes les actions affichées partagent déjà la même origine");
});
