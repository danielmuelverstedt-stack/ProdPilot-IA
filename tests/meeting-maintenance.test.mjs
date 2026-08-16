import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("les problèmes maintenance ont une source durable distincte des interventions", async () => {
  const [types, migration] = await Promise.all([read("src/features/demo/types/demo.ts"), read("src/features/demo/services/demo-data-migration.ts")]);
  assert.match(types, /export interface MaintenanceProblem/);
  assert.match(types, /machineId: string/);
  assert.match(types, /maintenanceProblems: MaintenanceProblem\[\]/);
  assert.match(migration, /maintenanceProblems: Array\.isArray/);
});

test("la réunion ne conserve que les IDs des problèmes sélectionnés", async () => {
  const [types, service] = await Promise.all([read("src/features/demo/types/demo.ts"), read("src/features/maintenance/services/maintenance-problem-service.ts")]);
  assert.match(types, /maintenanceProblemIds: string\[\]/);
  assert.match(service, /meeting\.maintenanceProblemIds/);
  assert.match(service, /sourceMeetingId/);
});

test("le même espace maintenance est partagé par la réunion et la fiche machine", async () => {
  const [workflow, machine, workspace] = await Promise.all([read("src/features/meetings/components/MeetingWorkflow.tsx"), read("src/features/machines/components/MachineDetail.tsx"), read("src/features/maintenance/components/MaintenanceProblemsWorkspace.tsx")]);
  assert.match(workflow, /<MaintenanceProblemsWorkspace meetingId={meeting\.id}/);
  assert.match(machine, /<MaintenanceProblemsWorkspace machineId={id}/);
  assert.match(workspace, /Inclure dans la réunion/);
});

test("une action maintenance réutilise le formulaire Actions et les trois relations", async () => {
  const [workspace, dialog] = await Promise.all([read("src/features/maintenance/components/MaintenanceProblemsWorkspace.tsx"), read("src/features/actions/components/ActionFormDialog.tsx")]);
  assert.match(workspace, /<ActionFormDialog/);
  assert.match(workspace, /maintenanceProblem/);
  assert.match(workspace, /module: "machine"/);
  assert.match(workspace, /module: "meeting"/);
  assert.match(dialog, /additionalContextLinks/);
});

test("préparation et compte rendu ne reprennent que les problèmes sélectionnés", async () => {
  const [preparation, recap] = await Promise.all([read("src/features/meetings/services/meeting-preparation-document.ts"), read("src/features/meetings/services/meeting-recap-email.ts")]);
  assert.match(preparation, /meeting\.maintenanceProblemIds/);
  assert.match(preparation, /Aucun problème maintenance sélectionné/);
  assert.match(recap, /meeting\.maintenanceProblemIds/);
  assert.match(recap, /statut final/);
});

test("résoudre conserve les commentaires et l'historique", async () => {
  const service = await read("src/features/maintenance/services/maintenance-problem-service.ts");
  assert.match(service, /problem\.status = "Résolu"/);
  assert.match(service, /problem\.resolvedAt = now/);
  assert.match(service, /problem\.history\.push/);
  assert.doesNotMatch(service, /maintenanceProblems = .*filter/);
});
