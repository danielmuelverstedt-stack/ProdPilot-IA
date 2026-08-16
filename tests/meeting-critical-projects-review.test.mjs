import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("la catégorie 3 devient Dossiers prioritaires et applique une limite de cinq", async () => {
  const [steps, lifecycle, workflow] = await Promise.all([read("src/features/meetings/services/meeting-steps.ts"), read("src/features/meetings/services/meeting-lifecycle.ts"), read("src/features/meetings/components/MeetingWorkflow.tsx")]);
  assert.match(steps, /"Dossiers prioritaires"/);
  assert.match(lifecycle, /MAX_MEETING_PRIORITY_DOSSIERS = 5/);
  assert.match(workflow, /target\.priorityDossiers\.length >= MAX_MEETING_PRIORITY_DOSSIERS/);
});

test("un dossier OF référence la source propriétaire sans recopier ses données", async () => {
  const [types, component] = await Promise.all([read("src/features/demo/types/demo.ts"), read("src/features/meetings/components/MeetingCriticalProjectsReview.tsx")]);
  assert.match(types, /referenceKind: MeetingPriorityDossierReferenceKind/);
  assert.match(types, /referenceId: string \| null/);
  for (const kind of ["workOrder", "free"]) assert.match(component, new RegExp(kind));
  assert.match(component, /useWorkshopOperations/);
  assert.match(component, /useErpImportActive/);
  assert.match(component, /workOrderById/);
});

test("l'interface couvre ordre, statuts, commentaires, décision et mise en page maître-détail", async () => {
  const source = await read("src/features/meetings/components/MeetingCriticalProjectsReview.tsx");
  for (const label of ["À discuter", "En cours de discussion", "Décision prise", "Reporté", "Pourquoi ce dossier est prioritaire", "Notes de réunion", "Décision / Conclusion"]) assert.match(source, new RegExp(label));
  assert.match(source, /onMove\(dossier\.id, -1\)/);
  assert.match(source, /onMove\(dossier\.id, 1\)/);
  assert.match(source, /lg:grid-cols-\[minmax\(0,0\.8fr\)_minmax\(0,1\.5fr\)\]/);
});

test("le sélecteur recherche les OF réels avec debounce, aperçu et états UX", async () => {
  const source = await read("src/features/meetings/components/MeetingCriticalProjectsReview.tsx");
  for (const marker of ["Rechercher un OF ou une action…", "customerOrderNumber", "Recherche des OF…", "Aucun OF trouvé.", "Impossible de charger les OF.", "Ajouter aux priorités"]) assert.match(source, new RegExp(marker));
  assert.match(source, /setTimeout\(\(\) => setDebouncedQuery/);
  assert.match(source, /debouncedQuery\.length < 2/);
  assert.match(source, /existingIds\.has\(item\.id\)/);
});

test("une action créée depuis un dossier rejoint Actions, la réunion et le dossier", async () => {
  const [component, workflow] = await Promise.all([read("src/features/meetings/components/MeetingCriticalProjectsReview.tsx"), read("src/features/meetings/components/MeetingWorkflow.tsx")]);
  assert.match(component, /<ActionFormDialog/);
  assert.match(component, /allowLinkPicker/);
  assert.match(workflow, /linkActionToMeeting\(actionId, responsable\)/);
  assert.match(workflow, /dossier\.actionIds\.push\(actionId\)/);
  assert.match(workflow, /action\.contextLinks\.push\(contextLink\)/);
});

test("préparation et compte rendu reprennent les dossiers", async () => {
  const [recap, email, preparation] = await Promise.all([read("src/features/meetings/components/MeetingRecap.tsx"), read("src/features/meetings/services/meeting-recap-email.ts"), read("src/features/meetings/services/meeting-preparation-document.ts")]);
  assert.match(recap, /Dossiers prioritaires/);
  assert.match(email, /dossier\.meetingComment/);
  assert.match(email, /dossier\.decision/);
  assert.match(preparation, /dossier\.preparationComment/);
});

test("plusieurs actions existantes peuvent être liées à un dossier sans être dupliquées", async () => {
  const [component, workflow] = await Promise.all([read("src/features/meetings/components/MeetingCriticalProjectsReview.tsx"), read("src/features/meetings/components/MeetingWorkflow.tsx")]);
  assert.match(component, /Lier des actions existantes/);
  assert.match(component, /excludedIds\.includes\(action\.id\)/);
  assert.match(component, /onConfirm\(selectedIds\)/);
  assert.match(workflow, /linkExistingActionsToDossier/);
  assert.match(workflow, /for \(const actionId of actionIds\)/);
  assert.match(workflow, /linkActionToDossier\(dossierId, action\.id, action\.responsable\)/);
});

test("la recherche Ajouter un dossier propose aussi les actions existantes", async () => {
  const [component, workflow] = await Promise.all([read("src/features/meetings/components/MeetingCriticalProjectsReview.tsx"), read("src/features/meetings/components/MeetingWorkflow.tsx")]);
  assert.match(component, /Rechercher un OF ou une action/);
  assert.match(component, /actionResults/);
  assert.match(component, /ActionSearchResult/);
  assert.match(component, /Ajouter l’action aux priorités/);
  assert.match(workflow, /addPriorityDossierFromAction/);
  assert.match(workflow, /actionIds: \[action\.id\]/);
});
