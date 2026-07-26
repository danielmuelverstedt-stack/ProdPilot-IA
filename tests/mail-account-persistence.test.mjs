import assert from "node:assert/strict";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { SerializedAtomicJsonFile } from "../src/features/mail/server/accounts/serialized-atomic-json-file.ts";

const initial = { version: 1, count: 0, labels: [] };
const parse = (value) => value && value.version === 1 && Number.isInteger(value.count) && Array.isArray(value.labels) ? value : null;

async function fixture(options = {}) {
  const directory = await mkdtemp(path.join(os.tmpdir(), "prodpilot-mail-accounts-"));
  const storageFile = path.join(directory, "mail-accounts.json");
  const storage = new SerializedAtomicJsonFile({
    storageFile,
    parse,
    createDefault: () => structuredClone(initial),
    normalize: (value) => value,
    readErrorMessage: "registre illisible",
    ...options,
  });
  return { directory, storageFile, storage };
}

test("lit normalement un registre JSON valide", async (t) => {
  const current = await fixture();
  t.after(() => rm(current.directory, { recursive: true, force: true }));
  await writeFile(current.storageFile, JSON.stringify({ version: 1, count: 4, labels: ["gmail"] }), "utf8");
  assert.deepEqual(await current.storage.read(), { version: 1, count: 4, labels: ["gmail"] });
});

test("sérialise les écritures concurrentes sans perdre de mise à jour", async (t) => {
  const current = await fixture();
  t.after(() => rm(current.directory, { recursive: true, force: true }));
  await Promise.all(Array.from({ length: 40 }, (_, index) => current.storage.update((value) => ({
    value: { ...value, count: value.count + 1, labels: [...value.labels, String(index)] },
    result: undefined,
  }))));
  const value = await current.storage.read();
  assert.equal(value.count, 40);
  assert.equal(new Set(value.labels).size, 40);
});

test("bloque une lecture demandée pendant le remplacement", async (t) => {
  let releaseReplace;
  let replacementStarted;
  const replaceStarted = new Promise((resolve) => { replacementStarted = resolve; });
  const replaceReleased = new Promise((resolve) => { releaseReplace = resolve; });
  const current = await fixture({ beforeReplace: async () => { replacementStarted(); await replaceReleased; } });
  t.after(() => rm(current.directory, { recursive: true, force: true }));
  const update = current.storage.update((value) => ({ value: { ...value, count: 1 }, result: undefined }));
  await replaceStarted;
  let readCompleted = false;
  const read = current.storage.read().then((value) => { readCompleted = true; return value; });
  await new Promise((resolve) => setTimeout(resolve, 20));
  assert.equal(readCompleted, false);
  releaseReplace();
  await update;
  assert.equal((await read).count, 1);
});

test("ne rend jamais un JSON partiel observable pendant les remplacements", async (t) => {
  const current = await fixture();
  t.after(() => rm(current.directory, { recursive: true, force: true }));
  await current.storage.update((value) => ({ value, result: undefined }));
  const writes = Array.from({ length: 25 }, () => current.storage.update((value) => ({
    value: { ...value, count: value.count + 1 },
    result: undefined,
  })));
  for (let index = 0; index < 100; index += 1) {
    JSON.parse(await readFile(current.storageFile, "utf8"));
  }
  await Promise.all(writes);
});

test("nettoie le fichier temporaire lorsqu’un remplacement échoue", async (t) => {
  const current = await fixture({ beforeReplace: async () => { throw new Error("échec simulé"); } });
  t.after(() => rm(current.directory, { recursive: true, force: true }));
  await assert.rejects(() => current.storage.update((value) => ({ value, result: undefined })), /échec simulé/);
  assert.deepEqual((await readdir(current.directory)).filter((name) => name.endsWith(".tmp")), []);
});

test("remplace atomiquement un fichier existant sur la plateforme courante", async (t) => {
  const current = await fixture();
  t.after(() => rm(current.directory, { recursive: true, force: true }));
  await writeFile(current.storageFile, JSON.stringify(initial), "utf8");
  await current.storage.update((value) => ({ value: { ...value, count: 2 }, result: undefined }));
  assert.equal(JSON.parse(await readFile(current.storageFile, "utf8")).count, 2);
});

test("read() met en cache la valeur : une lecture suivante ne retape pas le disque", async (t) => {
  const current = await fixture();
  t.after(() => rm(current.directory, { recursive: true, force: true }));
  await writeFile(current.storageFile, JSON.stringify({ version: 1, count: 1, labels: ["premier"] }), "utf8");
  assert.deepEqual(await current.storage.read(), { version: 1, count: 1, labels: ["premier"] });
  // Modifie le fichier directement sur disque, en contournant l'instance : si la lecture suivante
  // relisait vraiment le disque, elle verrait cette nouvelle valeur ; le cache doit l'empêcher.
  await writeFile(current.storageFile, JSON.stringify({ version: 1, count: 99, labels: ["modifié-hors-instance"] }), "utf8");
  assert.deepEqual(await current.storage.read(), { version: 1, count: 1, labels: ["premier"] }, "la deuxième lecture sert la valeur mise en cache, pas le contenu modifié sur disque");
});

test("update() invalide le cache avant d'écrire puis recache la valeur écrite, sans relire le disque", async (t) => {
  const current = await fixture();
  t.after(() => rm(current.directory, { recursive: true, force: true }));
  await current.storage.update((value) => ({ value: { ...value, count: 5 }, result: undefined }));
  // Modifie le fichier directement sur disque après l'écriture : si le cache post-écriture était
  // absent (ou périmé), la lecture suivante verrait cette valeur externe plutôt que celle écrite.
  await writeFile(current.storageFile, JSON.stringify({ version: 1, count: 777, labels: ["externe"] }), "utf8");
  assert.deepEqual(await current.storage.read(), { version: 1, count: 5, labels: [] }, "la lecture après écriture sert la valeur venant d'être écrite, mise en cache directement");
});

test("le dépôt répare le statut et la callback conserve le compte existant", async () => {
  const repository = await readFile(new URL("../src/features/mail/server/accounts/local-mail-account-repository.ts", import.meta.url), "utf8");
  const callback = await readFile(new URL("../src/app/api/auth/google/callback/route.ts", import.meta.url), "utf8");
  assert.match(repository, /markSynchronization[\s\S]*status: "connected"[\s\S]*error: null/);
  assert.match(repository, /existingIndex[\s\S]*stored\.accounts\[existingIndex\] = account/);
  assert.doesNotMatch(repository, /refreshToken|google-mail-tokens\.json/);
  assert.doesNotMatch(callback, /delete\(|google-mail-tokens/);
});

test("la route messages propage une erreur structurée au lieu d’une liste vide", async () => {
  const context = await readFile(new URL("../src/features/mail/services/mail-account-context.ts", import.meta.url), "utf8");
  const loader = await readFile(new URL("../src/features/mail/components/MailWorkspaceLoader.tsx", import.meta.url), "utf8");
  const route = await readFile(new URL("../src/app/api/mail/messages/route.ts", import.meta.url), "utf8");
  const responses = await readFile(new URL("../src/features/mail/server/mail-api-response.ts", import.meta.url), "utf8");
  assert.match(context, /account\.status !== "connected" && account\.mode !== "oauth"/);
  assert.match(loader, /connectionResult\.account\.status !== "connected" && connectionResult\.account\.mode !== "oauth"/);
  assert.match(context, /provider\.listMessages/);
  assert.match(route, /apiError\(safe\.message, safe\.status, safe\.code\)/);
  assert.match(responses, /error: \{ code, message \}/);
});
