import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { machineSettingsService } from "../src/features/settings/services/machine-settings-service.ts";

function machine(id, overrides) {
  return { id, active: true, visible: true, deleted: false, favorite: false, order: 0, ...overrides };
}

test("moveMachine glisse une machine visible juste avant sa cible et réassigne un ordre séquentiel", () => {
  const settings = {
    production: {
      machines: [
        machine("A", { order: 0 }),
        machine("B", { order: 1 }),
        machine("C", { order: 2 }),
        machine("D", { order: 3 }),
      ],
    },
  };
  assert.equal(machineSettingsService.moveMachine(settings, "D", "B"), true);
  assert.deepEqual(settings.production.machines.map((entry) => entry.id), ["A", "D", "B", "C"]);
  assert.deepEqual(settings.production.machines.map((entry) => entry.order), [0, 1, 2, 3]);
});

test("moveMachine conserve la position relative des machines masquées, non concernées par le glisser-déposer visible", () => {
  const settings = {
    production: {
      machines: [
        machine("A", { order: 0 }),
        machine("HIDDEN-1", { order: 1, visible: false }),
        machine("B", { order: 2 }),
        machine("C", { order: 3 }),
        machine("HIDDEN-2", { order: 4, visible: false }),
      ],
    },
  };
  // Glisse C avant A : parmi les seules machines visibles [A, B, C] -> [C, A, B].
  machineSettingsService.moveMachine(settings, "C", "A");
  assert.deepEqual(settings.production.machines.map((entry) => entry.id), ["C", "HIDDEN-1", "A", "B", "HIDDEN-2"], "les machines masquées gardent leur emplacement d'origine dans la séquence globale");
  assert.deepEqual(settings.production.machines.map((entry) => entry.order), [0, 1, 2, 3, 4]);
});

test("moveMachine ne fait rien pour un identifiant identique, une machine masquée ou un identifiant inconnu", () => {
  const settings = { production: { machines: [machine("A", { order: 0 }), machine("B", { order: 1, visible: false })] } };
  assert.equal(machineSettingsService.moveMachine(settings, "A", "A"), false);
  assert.equal(machineSettingsService.moveMachine(settings, "A", "B"), false, "une machine masquée n'est pas une cible valide pour le glisser-déposer visible");
  assert.equal(machineSettingsService.moveMachine(settings, "A", "INCONNU"), false);
  assert.deepEqual(settings.production.machines.map((entry) => entry.order), [0, 1], "aucune mutation quand le déplacement est invalide");
});

test("le Parc Machines glisse-dépose les cartes via machineSettingsService.moveMachine et trie uniquement par ordre", async () => {
  const listModule = await readFile(new URL("../src/features/machines/components/MachinesModule.tsx", import.meta.url), "utf8");
  assert.match(listModule, /machineSettingsService\.moveMachine\(draft, draggedId, targetId\)/);
  assert.match(listModule, /draggable={!machine\.deleted}/);
  assert.match(listModule, /\.sort\(\(a, b\) => a\.order - b\.order\)/, "le tri ne doit plus épingler les favorites en tête, conformément au choix explicite de l'utilisateur");
  assert.doesNotMatch(listModule, /Number\(Boolean\(b\.favorite\)\)/, "l'ancien tri favorite-first doit avoir disparu de cette page");
});

function baseSettings(departmentOverrides) {
  return { production: { machines: [], departments: [{ id: "milling", label: "Fraisage", active: true, order: 0, color: "#000", ...departmentOverrides }] } };
}

test("createMachine crée une machine avec les valeurs par défaut et refuse un champ obligatoire manquant", () => {
  const settings = baseSettings();
  const result = machineSettingsService.createMachine(settings, { id: " CV5-500 ", name: " CV5 500 ", displayName: "", departmentId: "milling" });
  assert.equal(result.ok, true);
  assert.equal(settings.production.machines.length, 1);
  const created = settings.production.machines[0];
  assert.equal(created.id, "CV5-500", "l'identifiant est nettoyé (trim)");
  assert.equal(created.name, "CV5 500");
  assert.equal(created.displayName, "CV5 500", "le nom affiché retombe sur le nom technique si laissé vide");
  assert.equal(created.department, "Fraisage");
  assert.equal(created.departmentId, "milling");
  assert.equal(created.active, true);
  assert.equal(created.visible, true);
  assert.equal(created.deleted, false);
  assert.equal(created.order, 0);

  assert.equal(machineSettingsService.createMachine(settings, { id: "", name: "X", departmentId: "milling", displayName: "" }).ok, false, "identifiant obligatoire");
  assert.equal(machineSettingsService.createMachine(settings, { id: "Y", name: "", departmentId: "milling", displayName: "" }).ok, false, "nom technique obligatoire");
  assert.equal(machineSettingsService.createMachine(settings, { id: "Y", name: "Y", departmentId: "inconnu", displayName: "" }).ok, false, "département obligatoire et valide");
  assert.equal(settings.production.machines.length, 1, "aucune mutation quand la création est refusée");
});

test("createMachine retombe sur kind « machine » par défaut, et accepte kind « poste » pour un poste de travail sans machine physique", () => {
  const settings = baseSettings();
  const defaultResult = machineSettingsService.createMachine(settings, { id: "CV5-500", name: "CV5 500", displayName: "", departmentId: "milling" });
  assert.equal(defaultResult.ok, true);
  assert.equal(defaultResult.ok && defaultResult.machine.kind, "machine");

  const posteResult = machineSettingsService.createMachine(settings, { id: "EBA-01", name: "Ébavurage", displayName: "", departmentId: "milling", kind: "poste" });
  assert.equal(posteResult.ok, true);
  assert.equal(posteResult.ok && posteResult.machine.kind, "poste");
  assert.equal(settings.production.machines.find((machine) => machine.id === "EBA-01").kind, "poste");
});

test("createMachine refuse un identifiant déjà utilisé par une autre machine", () => {
  const settings = baseSettings();
  machineSettingsService.createMachine(settings, { id: "CV5-500", name: "CV5 500", displayName: "", departmentId: "milling" });
  const duplicate = machineSettingsService.createMachine(settings, { id: "CV5-500", name: "Autre", displayName: "", departmentId: "milling" });
  assert.equal(duplicate.ok, false);
  assert.match(duplicate.error, /CV5-500/);
  assert.equal(settings.production.machines.length, 1);
});

test("updateIdentity permet de renommer le nom technique en plus des autres champs, sans effacer la valeur si vide", () => {
  const settings = { production: { machines: [{ id: "A", name: "Ancien nom", displayName: "Ancien affiché", departmentId: "milling", department: "Fraisage", machineType: "", color: "", order: 0, technicalInformation: "", active: true, visible: true, deleted: false, favorite: false, futureCapacityHours: null, comments: "" }], departments: [{ id: "milling", label: "Fraisage", active: true, order: 0, color: "#000" }] } };
  const patch = { name: "Nouveau nom", displayName: "Nouveau affiché", departmentId: "milling", machineType: "Fraisage 5 axes", color: "#fff", futureCapacityHours: 8, comments: "RAS", favorite: true };
  assert.equal(machineSettingsService.updateIdentity(settings, "A", patch), true);
  const updated = settings.production.machines[0];
  assert.equal(updated.name, "Nouveau nom");
  assert.equal(updated.displayName, "Nouveau affiché");
  assert.equal(updated.favorite, true);

  assert.equal(machineSettingsService.updateIdentity(settings, "A", { ...patch, name: "   " }), true);
  assert.equal(settings.production.machines[0].name, "Nouveau nom", "un nom technique vide n'efface pas la valeur existante");
});

test("le Parc Machines et Réglages → Production → Machines partagent la même fenêtre et le même service de création", async () => {
  const listModule = await readFile(new URL("../src/features/machines/components/MachinesModule.tsx", import.meta.url), "utf8");
  const productionSettings = await readFile(new URL("../src/features/settings/components/ProductionSettings.tsx", import.meta.url), "utf8");
  const dialog = await readFile(new URL("../src/features/machines/components/MachineCreateDialog.tsx", import.meta.url), "utf8");
  for (const source of [listModule, productionSettings]) {
    assert.match(source, /<MachineCreateDialog settings={settings}/, "les deux points d'entrée utilisent la même fenêtre de création avec l'ensemble des réglages");
    assert.match(source, /machineSettingsService\.createMachine\(draft, input\)/, "les deux points d'entrée réutilisent le même service, sans dupliquer la validation");
  }
  assert.doesNotMatch(productionSettings, /draft\.production\.machines\.push\(saved\)/, "l'ancienne création inline dupliquée doit avoir disparu de Réglages");
  assert.match(dialog, /PlanningDialogShell/, "réutilise la fenêtre modale générique déjà utilisée par ActionFormDialog");
});

test("l'identifiant n'est plus saisi à la main dans la fenêtre de création : il est calculé et affiché en lecture seule", async () => {
  const dialog = await readFile(new URL("../src/features/machines/components/MachineCreateDialog.tsx", import.meta.url), "utf8");
  assert.match(dialog, /machineSettingsService\.suggestMachineId\(settings, departmentId\)/);
  assert.match(dialog, /readOnly disabled/, "le champ Identifiant n'est plus modifiable par l'utilisateur");
  assert.doesNotMatch(dialog, /onChange=\{\(event\) => setId/, "il ne doit plus y avoir de saisie manuelle de l'identifiant");
});

test("suggestMachineId reprend le préfixe et la largeur de numérotation déjà en place, puis incrémente le plus grand numéro", () => {
  const settings = {
    production: {
      departments: [{ id: "turning", label: "Tournage", active: true, order: 0, color: "#000" }],
      machines: [
        machine("TOU-01", { departmentId: "turning" }),
        machine("TOU-02", { departmentId: "turning" }),
        machine("TOU-09", { departmentId: "turning" }),
        machine("FRA-01", { departmentId: "milling" }),
      ],
    },
  };
  assert.equal(machineSettingsService.suggestMachineId(settings, "turning"), "TOU-10");
});

test("suggestMachineId dérive un préfixe du libellé du département quand aucune machine n'existe encore", () => {
  const settings = { production: { departments: [{ id: "quality", label: "Qualité", active: true, order: 0, color: "#000" }], machines: [] } };
  assert.equal(machineSettingsService.suggestMachineId(settings, "quality"), "QUA-01");
});

test("suggestMachineId évite toute collision avec un identifiant déjà utilisé, y compris hors du département", () => {
  const settings = {
    production: {
      departments: [{ id: "turning", label: "Tournage", active: true, order: 0, color: "#000" }],
      machines: [
        machine("TOU-01", { departmentId: "turning" }),
        // Identifiant TOU-02 déjà pris par une machine renommée ou déplacée manuellement dans un autre département.
        machine("TOU-02", { departmentId: "milling" }),
      ],
    },
  };
  assert.equal(machineSettingsService.suggestMachineId(settings, "turning"), "TOU-03", "TOU-02 est déjà utilisé ailleurs, il ne doit pas être reproposé");
});

test("la fiche machine (MachineIdentityPanel) permet de modifier le nom technique, en plus des autres paramètres déjà éditables", async () => {
  const panel = await readFile(new URL("../src/features/machines/components/MachineIdentityPanel.tsx", import.meta.url), "utf8");
  assert.match(panel, /name: machine\.name/, "toPatch reprend le nom technique existant");
  assert.match(panel, /value=\{draft\.name\}/, "le champ Nom technique est éditable en mode édition");
  assert.match(panel, /Info label="Nom technique" value=\{machine\.name\}/, "le nom technique est visible en mode lecture");
});

test("le faux champ « Code ERP » (texte libre, jamais relié à l'import ERP) a été retiré de toute la chaîne Réglages", async () => {
  const files = [
    "../src/features/settings/types/settings.ts",
    "../src/features/settings/services/machine-settings-service.ts",
    "../src/features/settings/services/settings-repository.ts",
    "../src/features/settings/components/ProductionSettings.tsx",
    "../src/features/machines/components/MachinesModule.tsx",
    "../src/features/machines/services/machine-csv-service.ts",
    "../src/features/machines/components/MachineCsvTools.tsx",
  ];
  for (const path of files) {
    const source = await readFile(new URL(path, import.meta.url), "utf8");
    assert.doesNotMatch(source, /erpCode/, `${path} ne doit plus référencer le champ erpCode retiré`);
  }
});

test("la fiche machine affiche désormais les vrais codes ERP mappés (lecture seule) avec un lien vers les correspondances ERP, au lieu du champ texte libre", async () => {
  const panel = await readFile(new URL("../src/features/machines/components/MachineIdentityPanel.tsx", import.meta.url), "utf8");
  assert.match(panel, /mappedErpCodes/, "le panneau reçoit les codes ERP réellement mappés à cette machine");
  assert.match(panel, /Gérer les correspondances ERP/, "un lien renvoie vers le panneau Correspondances ERP existant plutôt que de dupliquer l'édition ici");
  assert.doesNotMatch(panel, /Field label="Code ERP"/, "le champ texte libre déconnecté de l'import réel a été supprimé");

  const detail = await readFile(new URL("../src/features/machines/components/MachineDetail.tsx", import.meta.url), "utf8");
  assert.match(detail, /machineCodes\.filter\(\(entry\) => entry\.machineId === machine\.id\)/, "les codes ERP affichés proviennent du même mapping réel que le Parc Machines, pas d'une saisie manuelle");
});

test("le tableau Parc Machines (Réglages) permet de trier et de glisser-déposer ses colonnes, sur la base partagée générique", async () => {
  const panel = await readFile(new URL("../src/features/settings/components/ProductionSettings.tsx", import.meta.url), "utf8");
  assert.match(panel, /from "@\/lib\/use-table-columns"/, "réutilise le hook partagé plutôt qu'une préférence bricolée localement");
  assert.match(panel, /from "@\/lib\/table-columns"/, "réutilise sortRows plutôt qu'un comparateur dupliqué");
  assert.match(panel, /useTableColumns<MachineColumnId>\("production-machines", MACHINE_COLUMN_IDS\)/);
  assert.match(panel, /createColumnDragHandlers\(column, moveColumn\)/, "les en-têtes sont glissables via le même mécanisme que l'Atelier/le Cockpit ERP");
  assert.match(panel, /<ColumnSortButton id=\{column\} sort=\{sort\} onSort=\{cycleSort\} \/>/);
});

test("pendant qu'un tri d'affichage est actif sur le Parc Machines, les boutons ↑/↓ (qui modifient le vrai ordre métier) sont désactivés plutôt que de mélanger deux mécanismes d'ordre différents", async () => {
  const panel = await readFile(new URL("../src/features/settings/components/ProductionSettings.tsx", import.meta.url), "utf8");
  assert.match(panel, /const isDisplaySorted = sort\.column !== null;/);
  assert.match(panel, /disabled=\{isDisplaySorted \|\| index === 0 \|\| machine\.deleted\}/);
  assert.match(panel, /disabled=\{isDisplaySorted \|\| index === machines\.length - 1 \|\| machine\.deleted\}/);
});

test("le tri d'affichage du Parc Machines ne réécrit jamais le champ métier machine.order : reorderMachine continue d'agir sur l'ordre réel, indépendamment du tri actif", async () => {
  const panel = await readFile(new URL("../src/features/settings/components/ProductionSettings.tsx", import.meta.url), "utf8");
  assert.match(panel, /const sortedMachines = sortRows\(machines, sort, \(machine, column\) => machineSortValue\(machine, column, departments\)\);/);
  assert.match(panel, /const index = machines\.indexOf\(machine\);/, "l'index utilisé par reorderMachine reste calculé sur l'ordre métier, pas sur l'ordre d'affichage trié");
});

test("le tableau Correspondances ERP (ErpMachineMappingsPanel) permet de trier et de glisser-déposer ses colonnes", async () => {
  const panel = await readFile(new URL("../src/features/erp-import/components/ErpMachineMappingsPanel.tsx", import.meta.url), "utf8");
  assert.match(panel, /from "@\/lib\/use-table-columns"/);
  assert.match(panel, /useTableColumns<MappingColumnId>\("erp-machine-mappings", MAPPING_COLUMN_IDS\)/);
  assert.match(panel, /createColumnDragHandlers\(column, moveColumn\)/);
  assert.match(panel, /const sortedEntries = sortRows\(visibleEntries, sort, /, "le tri s'applique après le filtrage déjà en place");
});

test("la fenêtre de création de machine permet de créer un poste de travail sans machine physique", async () => {
  const dialog = await readFile(new URL("../src/features/machines/components/MachineCreateDialog.tsx", import.meta.url), "utf8");
  assert.match(dialog, /Poste de travail \(sans machine physique\)/);
  assert.match(dialog, /kind: isWorkstation \? "poste" : "machine"/, "le choix est transmis à onSubmit, donc à machineSettingsService.createMachine");
});

test("le Parc Machines distingue visuellement un poste de travail d'une machine physique", async () => {
  const listModule = await readFile(new URL("../src/features/machines/components/MachinesModule.tsx", import.meta.url), "utf8");
  assert.match(listModule, /machine\.kind === "poste"/, "un badge distingue les postes de travail sur leur carte");
});
