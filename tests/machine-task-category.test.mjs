import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { machineSettingsService } from "../src/features/settings/services/machine-settings-service.ts";

function baseSettings(departmentOverrides) {
  return { production: { machines: [], departments: [{ id: "milling", label: "Fraisage", active: true, order: 0, color: "#000", ...departmentOverrides }] } };
}

test("createMachine laisse une nouvelle machine non catégorisée par défaut", () => {
  const settings = baseSettings();
  const result = machineSettingsService.createMachine(settings, { id: "CV5-500", name: "CV5 500", displayName: "", departmentId: "milling" });
  assert.equal(result.ok, true);
  assert.equal(result.machine.taskCategoryCode, null);
});

test("updateIdentity assigne ou retire la catégorie de tâche d'une machine", () => {
  const settings = { production: { machines: [{ id: "A", name: "A", displayName: "A", departmentId: "milling", department: "Fraisage", machineType: "", color: "", order: 0, technicalInformation: "", active: true, visible: true, deleted: false, favorite: false, futureCapacityHours: null, comments: "", taskCategoryCode: null }], departments: [{ id: "milling", label: "Fraisage", active: true, order: 0, color: "#000" }] } };
  const patch = { name: "A", displayName: "A", departmentId: "milling", machineType: "", color: "", futureCapacityHours: null, comments: "", favorite: false, taskCategoryCode: "27" };
  assert.equal(machineSettingsService.updateIdentity(settings, "A", patch), true);
  assert.equal(settings.production.machines[0].taskCategoryCode, "27");

  assert.equal(machineSettingsService.updateIdentity(settings, "A", { ...patch, taskCategoryCode: null }), true);
  assert.equal(settings.production.machines[0].taskCategoryCode, null, "peut redevenir non catégorisée");
});

test("les machines de démonstration livrées avec le référentiel sont pré-catégorisées selon leur département/type déjà curatés", async () => {
  const source = await readFile(new URL("../src/features/settings/config/default-settings.ts", import.meta.url), "utf8");
  assert.match(source, /if \(machineType === "Tournage \/ Fraisage"\) return "26";/, "type « Tournage / Fraisage » -> catégorie combinée");
  assert.match(source, /if \(departmentId === "turning"\) return "5";/, "Tournage");
  assert.match(source, /if \(departmentId === "milling"\) return "27";/, "Fraisage");
  assert.match(source, /if \(departmentId === "wire-cutting"\) return "39";/, "Découpe fil");
  assert.match(source, /taskCategoryCode: defaultTaskCategoryCode\(machine\.departmentId, machine\.machineType\)/, "chaque machine seedée reçoit bien une catégorie dérivée");
});

test("le dictionnaire des catégories vit dans src/lib/, partagé sans dépendance croisée entre l'import ERP et le Parc Machines", async () => {
  const control = await readFile(new URL("../src/features/erp-import/components/TaskCategoryVisibilityControl.tsx", import.meta.url), "utf8");
  const panel = await readFile(new URL("../src/features/machines/components/MachineIdentityPanel.tsx", import.meta.url), "utf8");
  const module_ = await readFile(new URL("../src/features/machines/components/MachinesModule.tsx", import.meta.url), "utf8");
  for (const source of [control, panel, module_]) {
    assert.match(source, /from "@\/lib\/task-category-dictionary"/, "réutilise le même dictionnaire partagé, jamais une copie locale");
  }
});

test("la fiche machine permet d'assigner une catégorie de tâche, avec « Non catégorisée » comme option explicite", async () => {
  const panel = await readFile(new URL("../src/features/machines/components/MachineIdentityPanel.tsx", import.meta.url), "utf8");
  assert.match(panel, /taskCategoryCode: machine\.taskCategoryCode \?\? null/, "toPatch reprend la catégorie existante");
  assert.match(panel, /<option value="">Non catégorisée<\/option>/);
  assert.match(panel, /TASK_CATEGORY_CODES\.map\(\(code\) => <option key=\{code\} value=\{code\}>\{TASK_CATEGORY_LABELS\[code\]\}<\/option>\)/);
});

test("le Parc Machines propose un filtre par catégorie (uniquement les catégories réellement utilisées, plus « Non catégorisées » si besoin) sans modifier les compteurs globaux", async () => {
  const module_ = await readFile(new URL("../src/features/machines/components/MachinesModule.tsx", import.meta.url), "utf8");
  assert.match(module_, /usedCategoryCodes = useMemo/, "seules les catégories effectivement utilisées apparaissent dans le filtre");
  assert.match(module_, /displayedMachines\.map\(\(machine\)/, "la grille de cartes utilise la liste filtrée");
  assert.match(module_, /MetricCard label="Machines actives" value=\{machines\.filter/, "les compteurs globaux restent basés sur le parc complet, pas sur le filtre actif");
});

test("le Parc Machines propose un onglet par département actif plus un onglet « Tous », en plus du filtre Catégorie qui affine ensuite l'onglet actif", async () => {
  const module_ = await readFile(new URL("../src/features/machines/components/MachinesModule.tsx", import.meta.url), "utf8");
  assert.match(module_, /const ALL_DEPARTMENTS_TAB = "all";/);
  assert.match(module_, /const activeDepartments = useMemo\(\(\) => \[\.\.\.settings\.production\.departments\]\.filter\(\(department\) => department\.active\)/, "mêmes départements actifs que l'Atelier, pas une nouvelle source de vérité");
  assert.match(module_, /const departmentFilteredMachines = useMemo\(\s*\(\) => departmentTab === ALL_DEPARTMENTS_TAB \? machines : machines\.filter\(\(machine\) => machine\.departmentId === departmentTab\),/, "filtre par département physique de la fiche machine");
  assert.match(module_, /const usedCategoryCodes = useMemo\(\(\) => \{[\s\S]*?const codes = new Set\(departmentFilteredMachines\.map/, "le filtre Catégorie ne propose que les catégories présentes dans l'onglet département actif, pas tout le parc");
  assert.match(module_, /function selectDepartmentTab\(departmentId: string\) \{[\s\S]*?setDepartmentTab\(departmentId\);[\s\S]*?setCategoryFilter\(""\);/, "changer d'onglet département réinitialise le filtre Catégorie, pour ne jamais garder un filtre invisible qui viderait la grille");
  assert.match(module_, /<MachineDepartmentTabs departments={activeDepartments} selectedId={departmentTab} totalCount={machines\.length} countsByDepartmentId={machineCountByDepartmentId} onSelect={selectDepartmentTab} \/>/);
});

test("le dictionnaire des catégories n'est plus dans erp-import/config : déplacé vers src/lib pour être partagé sans dépendance croisée", async () => {
  const files = await readFile(new URL("../src/features/erp-import/components/TaskCategoryVisibilityControl.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(files, /@\/features\/erp-import\/config\/task-category-dictionary/);
});
