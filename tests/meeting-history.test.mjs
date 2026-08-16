import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function read(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("l'historique des réunions trie du plus récent au plus ancien", async () => {
  const source = await read("src/features/meetings/components/MeetingHistory.tsx");
  assert.match(source, /\[\.\.\.data\.meetings\]\.sort\(\(a, b\) => b\.date\.localeCompare\(a\.date\)\)/);
});

test("l'historique délègue le détail dépliable (actions, déroulé par étape, parking lot) au compte rendu partagé, sans le redéfinir", async () => {
  const source = await read("src/features/meetings/components/MeetingHistory.tsx");
  assert.match(source, /import \{ MeetingRecap \} from "@\/features\/meetings\/components\/MeetingRecap"/);
  assert.match(source, /<MeetingRecap meeting={meeting} actions={actions} \/>/);
});
