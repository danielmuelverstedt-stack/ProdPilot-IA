import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { departmentSettingsService } from "../src/features/settings/services/department-settings-service.ts";

function settings() {
  return {
    production: {
      halls: [
        { id: "hall-1", order: 0, active: true },
        { id: "hall-2", order: 1, active: true },
      ],
      departments: [
        { id: "turning", hallId: "hall-1", hallOrder: 0, order: 0 },
        { id: "milling", hallId: "hall-1", hallOrder: 1, order: 1 },
        { id: "quality", hallId: null, hallOrder: 0, order: 2 },
      ],
      machines: [
        { id: "TOU-01", departmentId: "turning", hallId: null },
        { id: "FRA-01", departmentId: "milling", hallId: null },
      ],
    },
  };
}

test("une catégorie se déplace verticalement dans son hall", () => {
  const value = settings();
  assert.equal(departmentSettingsService.moveDepartmentToHall(value, "milling", "hall-1", "turning"), true);
  assert.deepEqual(value.production.departments.filter((item) => item.hallId === "hall-1").map((item) => [item.id, item.hallOrder]), [["milling", 0], ["turning", 1]]);
  assert.equal(value.production.machines.find((item) => item.id === "FRA-01").hallId, "hall-1", "le Parc Machines reprend automatiquement le hall de la catégorie");
});

test("une catégorie se déplace dans un autre hall ou dans Non affectées", () => {
  const value = settings();
  assert.equal(departmentSettingsService.moveDepartmentToHall(value, "quality", "hall-2", null), true);
  assert.equal(value.production.departments.find((item) => item.id === "quality").hallId, "hall-2");
  assert.equal(departmentSettingsService.moveDepartmentToHall(value, "turning", null, null), true);
  assert.equal(value.production.departments.find((item) => item.id === "turning").hallId, null);
  assert.equal(value.production.machines.find((item) => item.id === "TOU-01").hallId, null);
  assert.deepEqual(value.production.departments.map((item) => item.order), [0, 1, 2], "l'ordre global partagé reste renuméroté");
});

test("un hall inconnu ou une cible d'un autre hall ne modifie rien", () => {
  const value = settings();
  const before = structuredClone(value);
  assert.equal(departmentSettingsService.moveDepartmentToHall(value, "turning", "unknown", null), false);
  assert.equal(departmentSettingsService.moveDepartmentToHall(value, "turning", "hall-2", "milling"), false);
  assert.deepEqual(value, before);
});

test("cinq halls sont créés par défaut et les anciennes catégories migrent sans affectation inventée", async () => {
  const defaults = await readFile(new URL("../src/features/settings/config/default-settings.ts", import.meta.url), "utf8");
  const repository = await readFile(new URL("../src/features/settings/services/settings-repository.ts", import.meta.url), "utf8");
  for (let index = 1; index <= 5; index += 1) assert.match(defaults, new RegExp(`standard\\("hall-${index}", "Hall ${index}"`));
  assert.match(repository, /hallId: typeof department\.hallId === "string"[\s\S]*?\? department\.hallId : null/);
  assert.match(repository, /const halls = migrateStandards\(saved\.halls, defaults\.halls\)/);
});

test("l'Atelier affiche les halls, Non affectées et accepte les dépôts dans une zone vide", async () => {
  const tabs = await readFile(new URL("../src/features/planning/components/WorkshopDepartmentTabs.tsx", import.meta.url), "utf8");
  const board = await readFile(new URL("../src/features/planning/components/HallAssignmentBoard.tsx", import.meta.url), "utf8");
  assert.match(board, /label: "Non affectées"/);
  assert.match(board, /role="tablist" aria-label="Halls"/);
  assert.match(board, /onClick=\{\(\) => setSelectedZoneId\(zone\.id\)\}/, "cliquer sur un hall affiche uniquement son contenu");
  assert.match(board, /onDrop=\{\(event\) => \{ drop\(event, zone\.hallId, null\); setSelectedZoneId\(zone\.id\); \}\}/, "déposer sur l'onglet d'un hall déplace l'élément et ouvre ce hall");
  assert.match(board, /max-h-64[^"]*overflow-y-auto/, "un seul hall compact et défilable remplace les six grandes colonnes");
  assert.match(tabs, /Glissez les catégories verticalement ou d’un hall vers un autre/);
  assert.match(tabs, /href="\/reglages"/);
});

test("les halls des machines sont gérés dans le Parc Machines et pas dans le Planning Atelier", async () => {
  const view = await readFile(new URL("../src/features/planning/components/PlanningWorkshopView.tsx", import.meta.url), "utf8");
  const list = await readFile(new URL("../src/features/machines/components/MachinesModule.tsx", import.meta.url), "utf8");
  const identity = await readFile(new URL("../src/features/machines/components/MachineIdentityPanel.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(view, /WorkshopMachineHallOrganizer|moveMachineToHall/);
  assert.match(identity, /<Field label="Hall de la catégorie">/);
  assert.match(identity, /Ce choix s’applique à toutes les machines de cette catégorie et au Planning Atelier/);
  assert.match(identity, /hallId: event\.target\.value \|\| null/);
  assert.match(list, /Tous les halls/);
  assert.match(list, /Toutes les catégories/);
  assert.match(list, /categoryMatches && hallMatches/);
  assert.match(list, /department\.id === machine\.departmentId\)\?\.hallId/);
});

test("une machine se déplace verticalement et entre halls sans changer son département", async () => {
  const { machineSettingsService } = await import("../src/features/settings/services/machine-settings-service.ts");
  const value = { production: { halls: [{ id: "hall-1" }, { id: "hall-2" }], machines: [{ id: "A", hallId: "hall-1", hallOrder: 0, departmentId: "turning" }, { id: "B", hallId: "hall-1", hallOrder: 1, departmentId: "milling" }] } };
  assert.equal(machineSettingsService.moveMachineToHall(value, "B", "hall-1", "A"), true);
  assert.deepEqual(value.production.machines.filter((item) => item.hallId === "hall-1").sort((a, b) => a.hallOrder - b.hallOrder).map((item) => item.id), ["B", "A"]);
  assert.equal(machineSettingsService.moveMachineToHall(value, "A", "hall-2", null), true);
  assert.equal(value.production.machines.find((item) => item.id === "A").departmentId, "turning", "le hall ne modifie jamais le rattachement métier");
});

test("la migration ajoute hallId/hallOrder aux machines existantes sans inventer de hall", async () => {
  const repository = await readFile(new URL("../src/features/settings/services/settings-repository.ts", import.meta.url), "utf8");
  assert.match(repository, /hallId: typeof machine\.hallId === "string" \? machine\.hallId : null/);
  assert.match(repository, /hallOrder: typeof machine\.hallOrder === "number" \? machine\.hallOrder : index/);
});

test("Réglages permet d'ajouter des halls mais bloque la suppression d'un hall utilisé", async () => {
  const settingsUi = await readFile(new URL("../src/features/settings/components/ProductionStandardsSettings.tsx", import.meta.url), "utf8");
  assert.match(settingsUi, /settingKey="halls" items=\{settings\.production\.halls\}/);
  assert.match(settingsUi, /!settings\.production\.departments\.some\(\(department\) => department\.hallId === hall\.id\) && !settings\.production\.machines\.some\(\(machine\) => machine\.hallId === hall\.id\)/);
  assert.match(settingsUi, /Déplacez d’abord les catégories et les machines de ce hall/);
});
