import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { MACHINE_CSV_HEADERS, parseMachinesCsv, serializeMachinesToCsv } from "../src/features/machines/services/machine-csv-service.ts";

const departments = [
  { id: "milling", label: "Fraisage", value: "Fraisage", color: "#000", textColor: "#fff", active: true, order: 0 },
  { id: "turning", label: "Tournage", value: "Tournage", color: "#000", textColor: "#fff", active: true, order: 1 },
];

function machine(overrides) {
  return {
    id: "FRA-01", active: true, visible: true, name: "Fraiseuse 1", displayName: "Fraiseuse 1",
    department: "Fraisage", departmentId: "milling", machineType: "Fraisage 5 axes", color: "", order: 0,
    technicalInformation: "", deleted: false, favorite: false, futureCapacityHours: 8,
    comments: "RAS", ...overrides,
  };
}

function demoMachine(overrides) {
  return { id: "FRA-01", name: "Fraiseuse 1", displayName: "Fraiseuse 1", department: "Fraisage", type: "Fraisage 5 axes", status: "Disponible", manufacturer: "Mazak", model: "VTC-200", year: 2015, serialNumber: "SN-1", robot: null, comments: "", ...overrides };
}

test("serializeMachinesToCsv puis parseMachinesCsv restituent les mêmes valeurs (aller-retour)", () => {
  const csv = serializeMachinesToCsv([machine()], departments, [demoMachine()]);
  assert.match(csv, /^﻿/, "le fichier commence par un BOM UTF-8 pour Excel");
  const { rows, parseErrors } = parseMachinesCsv(csv);
  assert.deepEqual(parseErrors, []);
  assert.equal(rows.length, 1);
  const row = rows[0];
  assert.equal(row.id, "FRA-01");
  assert.equal(row.name, "Fraiseuse 1");
  assert.equal(row.departmentLabel, "Fraisage");
  assert.equal(row.active, true);
  assert.equal(row.visible, true);
  assert.equal(row.favorite, false);
  assert.equal(row.futureCapacityHours, 8);
  assert.equal(row.comments, "RAS");
  assert.equal(row.manufacturer, "Mazak");
  assert.equal(row.model, "VTC-200");
  assert.equal(row.year, 2015);
  assert.equal(row.serialNumber, "SN-1");
  assert.equal(row.robot, null);
  assert.equal(row.status, "Disponible");
});

test("parseMachinesCsv gère les champs contenant le délimiteur, des guillemets et des accents", () => {
  const csv = serializeMachinesToCsv([machine({ comments: "Attention; capacité réduite le week-end", displayName: "Fraiseuse \"5 axes\"" })], departments, []);
  const { rows } = parseMachinesCsv(csv);
  assert.equal(rows[0].comments, "Attention; capacité réduite le week-end");
  assert.equal(rows[0].displayName, "Fraiseuse \"5 axes\"");
});

test("les champs numériques/optionnels vides ou absents s'exportent et se relisent comme vides, jamais fabriqués", () => {
  const csv = serializeMachinesToCsv([machine({ futureCapacityHours: null, comments: undefined })], departments, []);
  const { rows } = parseMachinesCsv(csv);
  assert.equal(rows[0].futureCapacityHours, null);
  assert.equal(rows[0].comments, "");
  assert.equal(rows[0].manufacturer, "", "aucune fiche technique démo n'existe pour cette machine");
  assert.equal(rows[0].status, "");
});

test("Actif/Visible/Favori s'exportent en Oui/Non et se reconvertissent en booléens à l'import", () => {
  const csv = serializeMachinesToCsv([machine({ active: false, visible: false, favorite: true })], departments, []);
  assert.match(csv, /;Non;Non;Oui;/, "Actif=Non, Visible=Non, Favori=Oui dans cet ordre");
  const { rows } = parseMachinesCsv(csv);
  assert.equal(rows[0].active, false);
  assert.equal(rows[0].visible, false);
  assert.equal(rows[0].favorite, true);
});

test("un statut opérationnel non reconnu retombe sur une valeur vide plutôt que d'être inventé", () => {
  const csv = `${MACHINE_CSV_HEADERS.join(";")}\r\nFRA-03;Fraiseuse 3;Fraiseuse 3;Fraisage;;Oui;Oui;Non;Non;3;;;;;;;;Statut inconnu\r\n`;
  const { rows } = parseMachinesCsv(csv);
  assert.equal(rows[0].status, "");
});

test("parseMachinesCsv signale une ligne au mauvais nombre de colonnes sans faire échouer les autres lignes", () => {
  const csv = serializeMachinesToCsv([machine()], departments, []);
  const withBadLine = `${csv}FRA-02;Fraiseuse 2;Fraiseuse 2\r\n`;
  const { rows, parseErrors } = parseMachinesCsv(withBadLine);
  assert.equal(rows.length, 1, "la ligne valide précédente reste analysée malgré la ligne suivante invalide");
  assert.equal(parseErrors.length, 1);
  assert.match(parseErrors[0], /Ligne 3/);
});

test("une ligne sans identifiant est rejetée avec une erreur explicite", () => {
  const csv = `${MACHINE_CSV_HEADERS.join(";")}\r\n;Fraiseuse;Fraiseuse;Fraisage;;Oui;Oui;Non;Non;1;;;;;;;;\r\n`;
  const { rows, parseErrors } = parseMachinesCsv(csv);
  assert.equal(rows.length, 0);
  assert.match(parseErrors[0], /identifiant manquant/);
});

test("MACHINE_CSV_HEADERS ignore Supprimée/Ordre à l'import : ce sont des colonnes d'export uniquement", async () => {
  const service = await readFile(new URL("../src/features/machines/services/machine-csv-service.ts", import.meta.url), "utf8");
  assert.match(service, /cells\[8\] = Supprimée, cells\[9\] = Ordre/);
});

test("l'import réutilise machineSettingsService.createMachine/updateIdentity et machineTechnicalService.updateTechnicalDetails, sans dupliquer de logique de création", async () => {
  const tools = await readFile(new URL("../src/features/machines/components/MachineCsvTools.tsx", import.meta.url), "utf8");
  assert.match(tools, /machineSettingsService\.createMachine\(draft, \{ id: row\.id/);
  assert.match(tools, /machineSettingsService\.updateIdentity\(draft, created\.machine\.id/);
  assert.match(tools, /machineTechnicalService\.updateTechnicalDetails\(draft, machine, \{/);
  assert.match(tools, /draft\.production\.machines\.some\(\(machine\) => machine\.id === row\.id\)/, "un identifiant déjà existant est ignoré, jamais mis à jour");
  assert.match(tools, /entry\.label === row\.departmentLabel \|\| entry\.id === row\.departmentLabel/, "le département se résout par libellé ou par identifiant");
});

test("l'import/export CSV et l'import de photos en masse sont regroupés derrière un bouton « Options » du Parc Machines, plutôt qu'affichés en permanence sur la page", async () => {
  const listModule = await readFile(new URL("../src/features/machines/components/MachinesModule.tsx", import.meta.url), "utf8");
  assert.match(listModule, /const \[optionsOpen, setOptionsOpen\] = useState\(false\);/);
  assert.match(listModule, /<Button variant="secondary" onClick={\(\) => setOptionsOpen\(true\)}>Options<\/Button>/);
  assert.match(listModule, /\{optionsOpen \? <MachineOptionsDialog onClose={\(\) => setOptionsOpen\(false\)} \/> : null\}/);
  assert.doesNotMatch(listModule, /<MachineCsvTools \/>/, "l'outil CSV n'est plus affiché directement sur la page, seulement dans la fenêtre Options");
  assert.doesNotMatch(listModule, /<MachinePhotoBulkImport \/>/, "l'import de photos n'est plus affiché directement sur la page, seulement dans la fenêtre Options");

  const dialog = await readFile(new URL("../src/features/machines/components/MachineOptionsDialog.tsx", import.meta.url), "utf8");
  assert.match(dialog, /<MachineCsvTools \/>/, "l'outil CSV existant est réutilisé tel quel dans la fenêtre Options, sans dupliquer sa logique");
  assert.match(dialog, /<MachinePhotoBulkImport \/>/, "l'import de photos existant est réutilisé tel quel");
  assert.match(dialog, /PlanningDialogShell/, "réutilise la même fenêtre modale générique que les autres dialogues de l'application");
});
