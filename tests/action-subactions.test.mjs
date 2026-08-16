import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { isSubAction } from "../src/features/actions/services/action-status.ts";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

function action(overrides) {
  return { id: "ACT-900", dateEncodage: "2026-07-01", introduitPar: "Daniel", origine: "Manuel", contextLinks: [], responsableContactId: null, description: "Test", responsable: "", echeance: "2026-07-01", statut: "À faire", dateCloture: null, remarque: null, comments: [], history: [], priority: null, responsableId: null, estimatedHours: null, plannedWeek: null, planningOrder: null, parentActionId: null, ...overrides };
}

test("isSubAction distingue une action de premier niveau (parentActionId nul) d'une sous-action", () => {
  assert.equal(isSubAction(action({ parentActionId: null })), false);
  assert.equal(isSubAction(action({ parentActionId: "ACT-001" })), true);
});

// action-service.ts n'est pas importable directement par node:test (chaîne d'alias @/... via
// demo-repository.ts) — garde de texte source, même limitation/convention que le reste des tests
// de action-service.ts (voir action-backlog.test.mjs).
test("createAction accepte un parentActionId optionnel et le reporte sur la nouvelle action, null par défaut (aucun appelant existant n'a besoin de changer)", async () => {
  const source = await read("src/features/actions/services/action-service.ts");
  assert.match(source, /parentActionId\?: string \| null;/, "champ optionnel sur NewActionInput");
  assert.match(source, /parentActionId: input\.parentActionId \?\? null,/, "reporté sur l'action créée, avec repli explicite à null");
});

test("deleteAction supprime aussi les sous-actions de l'action supprimée : une sous-action n'a pas de sens sans son parent", async () => {
  const source = await read("src/features/actions/services/action-service.ts");
  assert.match(source, /draft\.actions = draft\.actions\.filter\(\(item\) => item\.id !== id && item\.parentActionId !== id\);/);
});

test("ActionFormDialog accepte parentActionId et l'utilise pour créer une sous-action, avec un titre/texte adaptés", async () => {
  const dialog = await read("src/features/actions/components/ActionFormDialog.tsx");
  assert.match(dialog, /parentActionId\?: string \| null;/);
  assert.match(dialog, /parentActionId,\s*\n\s*besoinType: showBesoinType \? besoinType : null,\s*\n\s*\}\);/, "parentActionId transmis à createAction");
  assert.match(dialog, /parentActionId \? "Nouvelle sous-action" : "Nouvelle action"/);
});

test("les listes de premier niveau du module Actions (registre, planification équipe) excluent les sous-actions, pour ne pas les afficher en double avec la fiche de leur parent", async () => {
  const view = await read("src/features/actions/components/ActionsModule.tsx");
  assert.match(view, /import \{ isSubAction \} from "@\/features\/actions\/services\/action-status"/);
  assert.match(view, /const topLevelActions = useMemo\(\(\) => data\.actions\.filter\(\(item\) => !isSubAction\(item\)\), \[data\.actions\]\);/);
  assert.match(view, /<TeamPlanningTab actions={topLevelActions} people={data\.people} \/>/, "la planification équipe ne doit pas non plus afficher les sous-actions comme des cartes détachées");
});

test("le suivi des actions en réunion exclut aussi les sous-actions, même règle que le module Actions", async () => {
  const source = await read("src/features/meetings/components/MeetingActionsTracker.tsx");
  assert.match(source, /import \{ actionStatusTone, isActionOverdue, isSubAction \} from "@\/features\/actions\/services\/action-status"/);
  assert.match(source, /item\.origine === origine && !isSubAction\(item\)/);
});

test("la fiche action permet d'ouvrir/créer des sous-actions, réutilisant le même tableau (ActionGroupedList) que le reste du module", async () => {
  const detail = await read("src/features/actions/components/ActionDetail.tsx");
  assert.match(detail, /const subActions = data\.actions\.filter\(\(item\) => item\.parentActionId === action\.id\);/);
  assert.match(detail, /onClick={\(\) => setCreatingSubAction\(true\)}>\+ Une sous-action<\/button>/);
  assert.match(detail, /<ActionFormDialog origine={action\.origine} parentActionId={action\.id} onClose={\(\) => setCreatingSubAction\(false\)} \/>/);
  assert.match(detail, /<ActionGroupedList actions={subActions} mode="personne" columns={settings\.actions\.columns} origins={settings\.actions\.origins} people={data\.people} variant="current" \/>/, "même composant que le registre Actions et la revue de réunion, pas une présentation ad hoc");
});

test("supprimer une action avec des sous-actions prévient explicitement qu'elles seront supprimées avec elle", async () => {
  const detail = await read("src/features/actions/components/ActionDetail.tsx");
  assert.match(detail, /const warning = subActions\.length \? ` Ses \$\{subActions\.length\} sous-action\(s\) seront supprimées avec elle\.` : "";/);
});

test("la fiche d'une sous-action affiche un lien vers son action parente", async () => {
  const detail = await read("src/features/actions/components/ActionDetail.tsx");
  assert.match(detail, /const parentAction = action\.parentActionId \? data\.actions\.find\(\(item\) => item\.id === action\.parentActionId\) : null;/);
  assert.match(detail, /Info label="Action parente"/);
});

test("la fiche permet de saisir plusieurs sous-actions dans un tableau puis de valider une fois", async () => {
  const [detail, dialog, service] = await Promise.all([read("src/features/actions/components/ActionDetail.tsx"), read("src/features/actions/components/BulkSubActionDialog.tsx"), read("src/features/actions/services/action-service.ts")]);
  assert.match(detail, /\+ Plusieurs sous-actions/);
  assert.match(detail, /<BulkSubActionDialog/);
  for (const label of ["Sous-action", "Responsable", "Échéance", "+ Ajouter une ligne", "Créer les sous-actions"]) assert.ok(dialog.includes(label));
  assert.match(dialog, /createSubActions\(parentActionId/);
  assert.match(service, /export function createSubActions/);
});
