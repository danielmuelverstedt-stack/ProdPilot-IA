import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { machineTechnicalService } from "../src/features/machines/services/machine-technical-service.ts";
import { machineSavContactService } from "../src/features/machines/services/machine-sav-contact-service.ts";
import { machineConsumableService, CONSUMABLE_CATEGORIES } from "../src/features/machines/services/machine-consumable-service.ts";

function baseMachineSettings(overrides) {
  return { id: "TOU-01", name: "MAZAK", displayName: "Mazak", department: "Tournage", machineType: "Tournage", technicalInformation: "", ...overrides };
}

function baseDemoData(overrides) {
  return { version: 2, actions: [], workOrders: [], planning: [], machines: [], maintenance: [], meetings: [], requests: [], erpQuality: [], notifications: [], savContacts: [], consumables: [], ...overrides };
}

function technicalPatch(overrides) {
  return {
    manufacturer: "Mazak", model: "Integrex 300", year: 2018, serialNumber: "MZ-1", robot: null, status: "Disponible",
    workshopLocation: "", commissioningDate: null, warrantyEndDate: null,
    machiningType: "Tournage-fraisage", cncControl: "Mazatrol",
    spindleSpeedRpm: null, spindlePowerKw: null, toolSpindleOrCone: "", travelXMm: null, travelYMm: null, travelZMm: null,
    toolMagazineCapacity: null, barCapacityDiameterMm: null, throughSpindleCoolant: false,
    electricalVoltage: "", electricalKva: null, electricalCableSection: "",
    compressedAirBar: null, compressedAirFlowNlMin: null,
    ...overrides,
  };
}

test("updateTechnicalDetails conserve les champs marqués « à vérifier » tant que leur valeur n'a pas changé", () => {
  const draft = baseDemoData({ machines: [{ id: "TOU-01", name: "MAZAK", displayName: "Mazak", department: "Tournage", type: "Tournage", comments: "", manufacturer: "Mazak", model: "Integrex 300", year: 2018, serialNumber: "MZ-1", robot: null, status: "Disponible", machiningType: "Tournage-fraisage", cncControl: "Mazatrol", unverifiedFields: ["machiningType", "cncControl"] }] });
  machineTechnicalService.updateTechnicalDetails(draft, baseMachineSettings(), technicalPatch());
  const updated = draft.machines[0];
  assert.deepEqual(updated.unverifiedFields, ["machiningType", "cncControl"], "aucun champ n'a été modifié par l'utilisateur, le marquage doit rester");
});

test("updateTechnicalDetails retire un champ de la liste « à vérifier » dès que sa valeur change réellement", () => {
  const draft = baseDemoData({ machines: [{ id: "TOU-01", name: "MAZAK", displayName: "Mazak", department: "Tournage", type: "Tournage", comments: "", manufacturer: "Mazak", model: "Integrex 300", year: 2018, serialNumber: "MZ-1", robot: null, status: "Disponible", machiningType: "Tournage-fraisage", cncControl: "Mazatrol", unverifiedFields: ["machiningType", "cncControl"] }] });
  machineTechnicalService.updateTechnicalDetails(draft, baseMachineSettings(), technicalPatch({ cncControl: "Mazatrol Smooth" }));
  const updated = draft.machines[0];
  assert.deepEqual(updated.unverifiedFields, ["machiningType"], "cncControl a été modifié manuellement, il ne doit plus être marqué à vérifier");
  assert.equal(updated.cncControl, "Mazatrol Smooth");
});

test("updateTechnicalDetails crée la machine si elle n'existe pas encore dans les données de démonstration", () => {
  const draft = baseDemoData();
  machineTechnicalService.updateTechnicalDetails(draft, baseMachineSettings({ id: "FRA-99", name: "Nouvelle", displayName: "Nouvelle" }), technicalPatch());
  assert.equal(draft.machines.length, 1);
  assert.equal(draft.machines[0].id, "FRA-99");
});

test("machineSavContactService crée, modifie et supprime un contact SAV rattaché à la machine", () => {
  const draft = baseDemoData();
  machineSavContactService.create(draft, "TOU-01", { company: "SAV Mazak", contactName: "Jean Dupont", phone: "0123456789", email: "jean@sav.fr", contractReference: "CT-1", contractExpiry: "2027-01-01", notes: "" });
  assert.equal(draft.savContacts.length, 1);
  const created = draft.savContacts[0];
  assert.equal(created.machineId, "TOU-01");

  machineSavContactService.update(draft, created.id, { ...created, company: "SAV Mazak Europe" });
  assert.equal(draft.savContacts[0].company, "SAV Mazak Europe");

  machineSavContactService.remove(draft, created.id);
  assert.equal(draft.savContacts.length, 0);
});

test("machineConsumableService crée, modifie (en levant isExample) et supprime un consommable rattaché à la machine", () => {
  const draft = baseDemoData({ consumables: [{ id: "CONS-01", machineId: "TOU-01", category: "Filtre", designation: "Filtre exemple", manufacturerReference: "REF-1", supplier: "Fournisseur", replacementFrequency: "Annuelle", storageLocation: "Armoire", notes: "", isExample: true }] });
  machineConsumableService.update(draft, "CONS-01", { category: "Filtre", designation: "Filtre modifié", manufacturerReference: "REF-1", supplier: "Fournisseur", replacementFrequency: "Annuelle", storageLocation: "Armoire", notes: "" });
  assert.equal(draft.consumables[0].designation, "Filtre modifié");
  assert.equal(draft.consumables[0].isExample, false, "une modification manuelle retire le marquage exemple");

  machineConsumableService.create(draft, "TOU-01", { category: "Huile", designation: "Huile X", manufacturerReference: "", supplier: "", replacementFrequency: "", storageLocation: "", notes: "" });
  assert.equal(draft.consumables.length, 2);

  machineConsumableService.remove(draft, "CONS-01");
  assert.equal(draft.consumables.length, 1);
  assert.equal(draft.consumables[0].category, "Huile");
});

test("CONSUMABLE_CATEGORIES couvre exactement les catégories demandées", () => {
  assert.deepEqual(CONSUMABLE_CATEGORIES, ["Filtre", "Huile", "Graisse", "Liquide de coupe", "Autre"]);
});

test("le nouvel onglet Maintenance de la fiche machine affiche les contacts SAV et les consommables sans supprimer le contenu maintenance existant", async () => {
  const detail = await readFile(new URL("../src/features/machines/components/MachineDetail.tsx", import.meta.url), "utf8");
  assert.match(detail, /events\.map\(\(event\)/, "le rendu des événements de maintenance existants est conservé");
  assert.match(detail, /<MachineSavContactsPanel machineId={id} \/>/);
  assert.match(detail, /<MachineConsumablesPanel machineId={id} \/>/);
});

test("aucun nouvel onglet n'a été créé : la liste des onglets de la fiche machine reste inchangée", async () => {
  const detail = await readFile(new URL("../src/features/machines/components/MachineDetail.tsx", import.meta.url), "utf8");
  assert.match(detail, /const tabs = \["Vue générale", "Fiche technique", "Maintenance", "Historique", "Documents"\] as const;/);
});

test("le bouton d'impression de la fiche machine bascule vers MachinePrintView", async () => {
  const detail = await readFile(new URL("../src/features/machines/components/MachineDetail.tsx", import.meta.url), "utf8");
  assert.match(detail, /Imprimer la fiche machine/);
  assert.match(detail, /if \(printing\) return <MachinePrintView/);
});
