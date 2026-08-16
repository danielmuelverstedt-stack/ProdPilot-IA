import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { meetingSteps } from "../src/features/meetings/services/meeting-steps.ts";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Remontées terrain est placée après Maintenance dans la réunion Production", () => {
  const steps = meetingSteps("Production");
  assert.equal(steps[steps.indexOf("Maintenance") + 1], "Remontées terrain");
  assert.ok(steps.indexOf("Remontées terrain") < steps.indexOf("Compte rendu"));
});

test("le modèle conserve des références sans recopier Contacts, Machines ni OF", async () => {
  const [types, migration, lifecycle] = await Promise.all([read("src/features/demo/types/demo.ts"), read("src/features/demo/services/demo-data-migration.ts"), read("src/features/meetings/services/meeting-lifecycle.ts")]);
  for (const marker of ["participantContactId", "authorContactId", "machineIds", "workOrderIds", "priorityDossierIds", "actionIds"]) assert.match(types, new RegExp(marker));
  assert.match(migration, /fieldPoints: withMeetingFieldPoints/);
  assert.match(lifecycle, /fieldRoundCompletedContactIds: \[\]/);
});

test("le tour de table couvre progression, rien à signaler, saisie et liaisons", async () => {
  const source = await read("src/features/meetings/components/MeetingFieldRound.tsx");
  for (const marker of ["Quel est votre point ?", "Commentaires complémentaires", "Créer une action", "Lier à une machine", "Lier à un OF", "Lier à un dossier prioritaire", "Conserver uniquement comme information", "Rien à signaler", "Participant précédent", "Participant suivant", "Terminer le tour de table"]) assert.match(source, new RegExp(marker));
  assert.match(source, /meeting\.participants\.filter\(\(item\) => item\.present\)/);
  assert.match(source, /<ActionFormDialog/);
});

test("une remontée reste modifiable et supprimable après son enregistrement", async () => {
  const [component, service] = await Promise.all([read("src/features/meetings/components/MeetingFieldRound.tsx"), read("src/features/meetings/services/meeting-field-round-service.ts")]);
  assert.match(component, /Modifier/);
  assert.match(component, /Supprimer/);
  assert.match(service, /Object\.assign\(existing/);
  assert.match(service, /meeting\.fieldPoints = meeting\.fieldPoints\.filter/);
});

test("le compte rendu reprend les remontées mais omet une section vide", async () => {
  const [recap, email] = await Promise.all([read("src/features/meetings/components/MeetingRecap.tsx"), read("src/features/meetings/services/meeting-recap-email.ts")]);
  assert.match(recap, /\(meeting\.fieldPoints \?\? \[\]\)\.length/);
  assert.match(email, /fieldPointLines\.length \? \["Remontées terrain :"/);
  assert.match(email, /point\.machineIds/);
  assert.match(email, /point\.workOrderIds/);
});

test("les fiches Machine et OF relisent les remontées liées depuis les réunions", async () => {
  const [machine, workOrder] = await Promise.all([read("src/features/machines/components/MachineDetail.tsx"), read("src/features/work-orders/components/WorkOrderDetail.tsx")]);
  assert.match(machine, /point\.machineIds\.includes\(id\)/);
  assert.match(workOrder, /point\.workOrderIds\.includes\(id\)/);
});
