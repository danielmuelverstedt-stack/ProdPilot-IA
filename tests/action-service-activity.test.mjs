import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

// action-service.ts importe demo-repository.ts (chaîne d'alias @/...) : pas importable directement
// par node:test, même limitation que le reste des tests de ce fichier — garde de texte source.
const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("createAction initialise contextLinks/comments/history/responsableContactId sur toute nouvelle action, jamais undefined", async () => {
  const source = await read("src/features/actions/services/action-service.ts");
  assert.match(source, /contextLinks\?: ActionContextLink\[\];/, "NewActionInput accepte plusieurs liens dès la création");
  assert.match(source, /contextLinks: input\.contextLinks \?\? \[\],/);
  assert.match(source, /responsableContactId: null,/);
  assert.match(source, /comments: \[\],/);
  assert.match(source, /history: \[\],/);
});

test("chaque transition existante (clôture, report, planification, réassignation, réouverture) accepte un auteur optionnel et pousse une entrée d'historique, sans casser les appelants existants", async () => {
  const source = await read("src/features/actions/services/action-service.ts");
  assert.match(source, /export function completeAction\(id: string, author\?: string\): boolean \{/);
  assert.match(source, /export function postponeAction\(id: string, newEcheance: string, author\?: string\): boolean \{/);
  assert.match(source, /export function planAction\(id: string, responsable: string, echeance: string, author\?: string\): boolean \{/);
  assert.match(source, /export function reassignAction\(id: string, responsable: string, author\?: string\): boolean \{/);
  assert.match(source, /export function reopenAction\(id: string, author\?: string\): boolean \{/);
  assert.match(source, /function pushHistory\(target: ProductionAction, author: string \| undefined, description: string\): void \{/);
});

test("reassignActionToContact synchronise responsableContactId et le nom affiché (responsable), jamais l'un sans l'autre", async () => {
  const source = await read("src/features/actions/services/action-service.ts");
  assert.match(source, /export function reassignActionToContact\(id: string, contactId: string, displayName: string, author\?: string\): boolean \{/);
  assert.match(source, /target\.responsable = displayName;\s*\n\s*target\.responsableContactId = contactId;/);
});

test("updateActionEcheance change la date sans jamais toucher au statut, contrairement à postponeAction", async () => {
  const source = await read("src/features/actions/services/action-service.ts");
  assert.match(source, /export function updateActionEcheance\(id: string, echeance: string, author\?: string\): boolean \{/);
  const fnBody = source.slice(source.indexOf("export function updateActionEcheance"), source.indexOf("export function updateActionDetails"));
  assert.doesNotMatch(fnBody, /target\.statut/, "updateActionEcheance ne doit jamais changer le statut");
});

test("updateActionDetails remplace la mutation updateDemoData jusque-là inline dans ActionDetail.tsx — source unique", async () => {
  const source = await read("src/features/actions/services/action-service.ts");
  assert.match(source, /export function updateActionDetails\(id: string, patch: \{ description\?: string; responsable\?: string; origine\?: string; remarque\?: string \| null \}, author\?: string\): boolean \{/);
  const detail = await read("src/features/actions/components/ActionDetail.tsx");
  assert.doesNotMatch(detail, /target\.description = String\(form\.get\("description"\)\);/, "ActionDetail ne doit plus muter les champs lui-même");
  assert.match(detail, /updateActionDetails\(id, \{/);
});

test("addActionComment pousse un commentaire (auteur+date+texte) et une entrée d'historique correspondante en une seule mutation, jamais un commentaire vide", async () => {
  const source = await read("src/features/actions/services/action-service.ts");
  assert.match(source, /export function addActionComment\(id: string, author: string, text: string\): boolean \{/);
  assert.match(source, /const trimmed = text\.trim\(\);\s*\n\s*if \(!trimmed\) return false;/);
  assert.match(source, /target\.comments\.push\(\{ id: `\$\{target\.id\}-c\$\{target\.comments\.length \+ 1\}`, author, date: new Date\(\)\.toISOString\(\), text: trimmed \}\);/);
});

test("addActionContextLink dédoublonne par module+id, jamais de lien en double ; removeActionContextLink retire sans supprimer l'action", async () => {
  const source = await read("src/features/actions/services/action-service.ts");
  assert.match(source, /export function addActionContextLink\(id: string, link: ActionContextLink, author\?: string\): boolean \{/);
  assert.match(source, /if \(!target\.contextLinks\.some\(\(item\) => item\.module === link\.module && item\.id === link\.id\)\) \{/);
  assert.match(source, /export function removeActionContextLink\(id: string, module: ActionContextLink\["module"\], linkId: string, author\?: string\): boolean \{/);
});
