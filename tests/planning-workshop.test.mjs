import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { WORKSHOP_COLUMN_IDS } from "../src/features/planning/types/workshop-view.ts";
import { clampColumnWidth, createDefaultWorkshopColumns, createDefaultWorkshopFilters, createDefaultWorkshopSort, createDefaultWorkshopViewState, moveWorkshopColumn, nextSortState, parseWorkshopViewState, resetWorkshopView } from "../src/features/planning/services/workshop-view-preferences.ts";
import { buildWorkshopCategories, buildWorkshopDepartments, reorderOperationIds, sortOperations } from "../src/features/planning/services/workshop-view-service.ts";
import { buildPlanningView, countUnknownDurationBlocks, sumDurationHours } from "../src/features/planning/services/planning-view.ts";

const NO_SORT = { column: null, direction: "desc" };

const departments = [
  { id: "dept-fraisage", value: "fraisage", label: "Fraisage 5 axes", color: "", textColor: "", active: true, order: 0 },
  { id: "dept-tournage", value: "tournage", label: "Tournage", color: "", textColor: "", active: true, order: 1 },
];

const machineBase = { active: true, visible: true, deleted: false, name: "Machine", displayName: "Machine", department: "Fraisage 5 axes", departmentId: "dept-fraisage", machineType: "Fraisage", color: "", order: 0, photoDataUrl: "", technicalInformation: "" };

const machines = [
  { ...machineBase, id: "cv5-500", displayName: "CV5-500", order: 0 },
  { ...machineBase, id: "dmu50", displayName: "DMU50", order: 1 },
  { ...machineBase, id: "dmu60", displayName: "DMU60", order: 2, active: false },
  { ...machineBase, id: "masked-machine", displayName: "Masquée", order: 3, visible: false },
  { ...machineBase, id: "nexus410", displayName: "Nexus410", departmentId: "dept-tournage", department: "Tournage", order: 0 },
];

const opBase = { isRemoved: false, isVisible: true, isWithoutMachine: false, articleWorkOrderCount: 1, department: null, resourceGroup: null, sourcePriority: 1, userPriority: null, sourceOperationStatusId: 1, sourceOrderStatus: "OUVERT", effectivePriority: 5, effectiveStatus: "not-started", plannedDate: null, dueDate: null, comment: null, operationNumber: 10, taskCode: "T1" };

const operations = [
  { ...opBase, id: "op-1", workOrderId: "OF-100", articleCode: "A100", description: "Bride", machine: "CV5-500", machineId: "cv5-500", workOrder: { customerName: "EXAIL" } },
  { ...opBase, id: "op-2", workOrderId: "OF-101", articleCode: "B200", description: "Axe", machine: "DMU50", machineId: "dmu50", workOrder: { customerName: "SAB" } },
  { ...opBase, id: "op-3", workOrderId: "OF-102", articleCode: "C300", description: "Support", machine: "Non définie", machineId: null, isWithoutMachine: true, workOrder: { customerName: "FNH" } },
];

function findDepartment(sections, id) { return sections.find((section) => section.id === id); }
function findMachine(section, machineId) { return section?.machines.find((group) => group.machine?.id === machineId); }

test("buildWorkshopDepartments regroupe par département puis par machine, en gardant les machines sans OF", () => {
  const sections = buildWorkshopDepartments(operations, machines, departments, createDefaultWorkshopFilters(), NO_SORT);
  const milling = findDepartment(sections, "dept-fraisage");
  assert.ok(milling, "le département Fraisage doit apparaître");
  assert.equal(findMachine(milling, "cv5-500")?.operationCount, 1);
  assert.equal(findMachine(milling, "dmu50")?.operationCount, 1);
  assert.equal(findMachine(milling, "dmu60"), undefined, "machine inactive masquée par défaut");
  assert.equal(findMachine(milling, "masked-machine"), undefined, "machine masquée exclue par défaut");

  const turning = findDepartment(sections, "dept-tournage");
  assert.ok(turning, "le département Tournage doit apparaître même sans opération affectée");
  assert.equal(findMachine(turning, "nexus410")?.operationCount, 0, "une machine sans OF reste visible par défaut");

  const unassigned = findDepartment(sections, "unassigned");
  assert.ok(unassigned, "les opérations sans machine doivent rester visibles");
  assert.equal(unassigned.machines[0].operationCount, 1);
});

test("buildWorkshopCategories regroupe par catégorie de tâche assignée à la machine, sur le réglage partagé visibleTaskCategoryCodes", () => {
  const categorized = machines.map((machine) => machine.id === "cv5-500" || machine.id === "dmu50" ? { ...machine, taskCategoryCode: "27" } : machine.id === "nexus410" ? { ...machine, taskCategoryCode: "5" } : machine);
  const sections = buildWorkshopCategories(operations, categorized, createDefaultWorkshopFilters(), NO_SORT, ["27"]);
  assert.equal(sections.length, 1, "seule la catégorie explicitement activée (27, Fraisage) doit apparaître");
  assert.equal(sections[0].label, "Fraisage");
  assert.deepEqual(sections[0].machines.map((group) => group.machine?.id).sort(), ["cv5-500", "dmu50"]);
});

test("buildWorkshopCategories affiche aussi une machine dont la fiche n'est pas taguée sur la catégorie visible, si elle porte déjà une opération de cette catégorie (mapping ERP fait mais fiche machine pas mise à jour)", () => {
  const untaggedMachine = { ...machineBase, id: "cv5-500", taskCategoryCode: null };
  const opsCategory27 = [{ ...opBase, id: "op-untagged", workOrderId: "OF-800", articleCode: "Y800", description: "Découpe", machine: "CV5-500", machineId: "cv5-500", taskCode: "27", workOrder: { customerName: "EXAIL" } }];
  const sections = buildWorkshopCategories(opsCategory27, [untaggedMachine], createDefaultWorkshopFilters(), NO_SORT, ["27"]);
  assert.equal(sections.length, 1);
  assert.equal(sections[0].id, "27");
  assert.deepEqual(sections[0].machines.map((group) => group.machine?.id), ["cv5-500"]);
  assert.equal(sections[0].machines[0].operationCount, 1, "l'OF ne doit pas disparaître même si la fiche machine n'a pas été taguée");
});

test("buildWorkshopCategories : une machine non taguée avec des opérations de deux catégories visibles différentes apparaît dans chacune des deux sections (index construit une seule fois, pas par catégorie)", () => {
  const untaggedMachine = { ...machineBase, id: "cv5-500", taskCategoryCode: null };
  const mixedOps = [
    { ...opBase, id: "op-27", workOrderId: "OF-801", articleCode: "Y801", machine: "CV5-500", machineId: "cv5-500", taskCode: "27", workOrder: { customerName: "EXAIL" } },
    { ...opBase, id: "op-5", workOrderId: "OF-802", articleCode: "Y802", machine: "CV5-500", machineId: "cv5-500", taskCode: "5", workOrder: { customerName: "EXAIL" } },
  ];
  const sections = buildWorkshopCategories(mixedOps, [untaggedMachine], createDefaultWorkshopFilters(), NO_SORT, ["5", "27"]);
  assert.deepEqual(sections.map((section) => section.id).sort(), ["27", "5"]);
  sections.forEach((section) => assert.deepEqual(section.machines.map((group) => group.machine?.id), ["cv5-500"]));
});

test("buildWorkshopCategories : aucune catégorie activée (réglage vide par défaut) n'affiche rien, comme le filtre de visibilité des opérations", () => {
  const categorized = machines.map((machine) => ({ ...machine, taskCategoryCode: "27" }));
  assert.deepEqual(buildWorkshopCategories(operations, categorized, createDefaultWorkshopFilters(), NO_SORT, []), []);
});

test("buildWorkshopCategories : un poste de travail sans machine physique et sans opération ERP reste affiché (planifiable dès sa création)", () => {
  const poste = { ...machineBase, id: "eba-01", displayName: "Ébavurage poste 1", kind: "poste", taskCategoryCode: "15" };
  const sections = buildWorkshopCategories(operations, [poste], createDefaultWorkshopFilters(), NO_SORT, ["15"]);
  assert.equal(sections.length, 1);
  assert.equal(sections[0].label, "Ebavurage");
  assert.equal(sections[0].machines[0].machine?.id, "eba-01");
  assert.equal(sections[0].machines[0].operationCount, 0);
});

test("buildWorkshopCategories respecte le filtre « machines sans OF » comme le regroupement par département", () => {
  const poste = { ...machineBase, id: "eba-01", displayName: "Ébavurage poste 1", kind: "poste", taskCategoryCode: "15" };
  const filters = { ...createDefaultWorkshopFilters(), showMachinesWithoutOperations: false };
  assert.deepEqual(buildWorkshopCategories(operations, [poste], filters, NO_SORT, ["15"]), [], "le poste sans opération doit disparaître quand ce filtre est actif");
});

test("buildWorkshopCategories ajoute une section « Machines liées directement » pour les machines rattachées individuellement, sans dupliquer celles déjà couvertes par une catégorie visible", () => {
  const categorized = [
    { ...machineBase, id: "cv5-500", taskCategoryCode: "27" }, // déjà couverte par la catégorie 27 visible
    { ...machineBase, id: "eba-01", displayName: "Ébavurage poste 1", kind: "poste", taskCategoryCode: null }, // non catégorisée, liée directement
  ];
  const sections = buildWorkshopCategories(operations, categorized, createDefaultWorkshopFilters(), NO_SORT, ["27"], ["cv5-500", "eba-01"]);
  const directSection = sections.find((section) => section.id === "direct");
  assert.ok(directSection, "une section « Machines liées directement » doit apparaître");
  assert.deepEqual(directSection.machines.map((group) => group.machine?.id), ["eba-01"], "cv5-500 est déjà affichée via la catégorie 27, elle ne doit pas être dupliquée dans la section directe");
  assert.equal(directSection.label, "Machines liées directement");

  const withoutDirectLinks = buildWorkshopCategories(operations, categorized, createDefaultWorkshopFilters(), NO_SORT, ["27"]);
  assert.ok(!withoutDirectLinks.some((section) => section.id === "direct"), "sans machine liée directement, aucune section « direct » n'apparaît");
});

test("buildWorkshopCategories affiche les OF sans machine assignée à l'intérieur de la section de leur propre catégorie, pas dans un panier partagé par toutes les catégories", () => {
  // op-3 (catégorie « decoupe ») n'a pas de machine assignée (machineId: null) ; les deux autres appartiennent à une autre catégorie.
  const opsWithUnassignedCategory39 = operations.map((operation) => operation.id === "op-3" ? { ...operation, taskCode: "39" } : operation);
  const sections = buildWorkshopCategories(opsWithUnassignedCategory39, machines, createDefaultWorkshopFilters(), NO_SORT, ["39"]);
  assert.equal(sections.length, 1);
  assert.equal(sections[0].id, "39", "la section porte le code de sa catégorie, pas un id générique « unassigned »");
  assert.equal(sections[0].machines[0].machine, null);
  assert.deepEqual(sections[0].machines[0].operations.map((operation) => operation.id), ["op-3"]);

  // Si la catégorie visible ne correspond pas au code de l'opération orpheline, elle ne doit pas apparaître (elle appartient à une autre catégorie).
  const otherCategoryVisible = buildWorkshopCategories(opsWithUnassignedCategory39, machines, createDefaultWorkshopFilters(), NO_SORT, ["27"]);
  assert.deepEqual(otherCategoryVisible, []);
});

test("buildWorkshopCategories : plusieurs catégories visibles sans aucune machine rattachée restent des plannings séparés, au lieu de se mélanger dans un panier commun", () => {
  // Aucune des deux catégories (27 et 39) n'a de machine/poste rattaché : sans le correctif, leurs OF se retrouvaient mélangés dans un seul panier « Opérations sans machine ».
  const opsAcrossTwoUncategorizedCategories = [
    { ...opBase, id: "op-cat27", workOrderId: "OF-910", articleCode: "Z910", machine: "Non définie", machineId: null, isWithoutMachine: true, taskCode: "27", workOrder: { customerName: "ACME" } },
    { ...opBase, id: "op-cat39", workOrderId: "OF-911", articleCode: "Z911", machine: "Non définie", machineId: null, isWithoutMachine: true, taskCode: "39", workOrder: { customerName: "ACME" } },
  ];
  const sections = buildWorkshopCategories(opsAcrossTwoUncategorizedCategories, [], createDefaultWorkshopFilters(), NO_SORT, ["27", "39"]);
  assert.deepEqual(sections.map((section) => section.id).sort(), ["27", "39"], "chaque catégorie garde sa propre section, même sans aucune machine");
  const section27 = sections.find((section) => section.id === "27");
  const section39 = sections.find((section) => section.id === "39");
  assert.deepEqual(section27.machines[0].operations.map((operation) => operation.id), ["op-cat27"]);
  assert.deepEqual(section39.machines[0].operations.map((operation) => operation.id), ["op-cat39"]);
});

test("buildWorkshopCategories place les OF sans machine en premier à l'intérieur de leur section de catégorie, avant les machines de cette même catégorie", () => {
  // Deux machines candidates pour la catégorie 27 (pas une seule) : avec un seul candidat, elles
  // absorberaient directement les OF sans machine assignée (voir test dédié plus bas) au lieu de
  // laisser une ligne « Machine non définie » séparée — ce test porte spécifiquement sur l'ordre
  // quand une telle ligne séparée existe bel et bien.
  const categorized = [
    { ...machineBase, id: "cv5-500", taskCategoryCode: "27" },
    { ...machineBase, id: "dmu50", taskCategoryCode: "27" },
    { ...machineBase, id: "eba-01", displayName: "Ébavurage poste 1", kind: "poste", taskCategoryCode: null },
  ];
  const opsWithUnassignedCategory27 = [...operations, { ...opBase, id: "op-orphan", workOrderId: "OF-900", articleCode: "Z900", description: "Sans machine", machine: "Non définie", machineId: null, isWithoutMachine: true, taskCode: "27", workOrder: { customerName: "ACME" } }];
  const sections = buildWorkshopCategories(opsWithUnassignedCategory27, categorized, createDefaultWorkshopFilters(), NO_SORT, ["27"], ["eba-01"]);
  assert.deepEqual(sections.map((section) => section.id), ["27", "direct"], "une seule section par catégorie visible (les OF sans machine y sont désormais inclus), puis les liens directs");
  const categorySection = sections.find((section) => section.id === "27");
  assert.equal(categorySection.machines[0].machine, null, "les OF sans machine de cette catégorie apparaissent en premier dans sa section");
  assert.equal(categorySection.machines[1].machine?.id, "cv5-500");
  assert.equal(categorySection.machines[2].machine?.id, "dmu50");
});

test("buildWorkshopCategories : une catégorie n'ayant qu'une seule machine/poste candidate absorbe directement ses OF sans machine assignée, au lieu de les laisser dans une ligne « Machine non définie » séparée", () => {
  // Demandé par l'utilisateur : « si il y a que une machine toutes les opérations se mettent à la
  // machine et ne restent pas dans machine à définir ». Affichage uniquement : l'OF reste sans
  // machine assignée dans les données (son propre sélecteur Machine le montre toujours) ; seule sa
  // place dans la liste change, puisqu'aucune autre machine ne pourrait de toute façon la recevoir.
  const soleMachine = { ...machineBase, id: "eba-01", displayName: "Ébavurage poste 1", kind: "poste", taskCategoryCode: "15" };
  const opsWithUnassignedCategory15 = [{ ...opBase, id: "op-orphan-15", workOrderId: "OF-950", articleCode: "Z950", description: "Ebavurage sans machine", machine: "Non définie", machineId: null, isWithoutMachine: true, taskCode: "15", workOrder: { customerName: "ACME" } }];
  const sections = buildWorkshopCategories(opsWithUnassignedCategory15, [soleMachine], createDefaultWorkshopFilters(), NO_SORT, ["15"]);
  assert.equal(sections.length, 1);
  assert.equal(sections[0].machines.length, 1, "aucune ligne « Machine non définie » séparée : une seule ligne, celle du poste");
  assert.equal(sections[0].machines[0].machine?.id, "eba-01");
  assert.deepEqual(sections[0].machines[0].operations.map((operation) => operation.id), ["op-orphan-15"], "l'OF sans machine assignée rejoint directement le seul poste candidat de sa catégorie");
});

test("buildWorkshopCategories : dès qu'une deuxième machine devient candidate pour la catégorie, les OF sans machine assignée redeviennent une ligne « Machine non définie » séparée (impossible de deviner laquelle des deux devrait les recevoir)", () => {
  const machineA = { ...machineBase, id: "eba-01", displayName: "Ébavurage poste 1", kind: "poste", taskCategoryCode: "15" };
  const machineB = { ...machineBase, id: "eba-02", displayName: "Ébavurage poste 2", kind: "poste", taskCategoryCode: "15" };
  const opsWithUnassignedCategory15 = [{ ...opBase, id: "op-orphan-15b", workOrderId: "OF-951", articleCode: "Z951", machine: "Non définie", machineId: null, isWithoutMachine: true, taskCode: "15", workOrder: { customerName: "ACME" } }];
  const sections = buildWorkshopCategories(opsWithUnassignedCategory15, [machineA, machineB], createDefaultWorkshopFilters(), NO_SORT, ["15"]);
  assert.equal(sections[0].machines[0].machine, null, "avec deux candidats, impossible de deviner laquelle doit recevoir l'OF : reste une ligne Machine non définie séparée");
  assert.deepEqual(sections[0].machines[0].operations.map((operation) => operation.id), ["op-orphan-15b"]);
});

test("parseWorkshopViewState valide selectedDepartmentId (absent/vide ⇒ null, repli sur le premier département actif au rendu)", () => {
  assert.equal(parseWorkshopViewState({}).selectedDepartmentId, null);
  assert.equal(parseWorkshopViewState({ version: 1, selectedDepartmentId: "dept-fraisage" }).selectedDepartmentId, "dept-fraisage");
  assert.equal(parseWorkshopViewState({ version: 1, selectedDepartmentId: 42 }).selectedDepartmentId, null, "une valeur non textuelle retombe sur null plutôt que de planter");
  assert.equal(createDefaultWorkshopViewState().selectedDepartmentId, null);
});

test("resetWorkshopView conserve le département sélectionné, comme les sections repliées, plutôt que de ramener sur le premier onglet", () => {
  const current = { ...createDefaultWorkshopViewState(), selectedDepartmentId: "dept-tournage", collapsedMachineIds: ["cv5-500"] };
  const reset = resetWorkshopView(current);
  assert.equal(reset.selectedDepartmentId, "dept-tournage");
  assert.deepEqual(reset.collapsedMachineIds, ["cv5-500"]);
});

test("Planning capacité reprend directement les départements et machines de l'Atelier", async () => {
  const planningModule = await readFile(new URL("../src/features/planning/components/PlanningModule.tsx", import.meta.url), "utf8");
  assert.match(planningModule, /buildDepartmentOperationIndex, resolveDepartmentMachineIds/);
  assert.match(planningModule, /resolveDepartmentMachineIds\(departmentOperationIndex, settings\.production\.machines, department\)/);
  assert.match(planningModule, /from "@\/lib\/visible-task-categories-store"/, "le sélecteur reste le même réglage partagé que l'Atelier");
  const grid = await readFile(new URL("../src/features/planning/components/PlanningGrid.tsx", import.meta.url), "utf8");
  assert.match(grid, /groups: TaskCategoryMachineGroup<PlanningMachine>\[\]/, "la grille conserve son contrat de sections pour recevoir les départements partagés");
});

test("l'Atelier navigue par onglets de département dont le contenu vient uniquement des catégories/machines liées, indépendamment du département physique de la machine", async () => {
  const view = await readFile(new URL("../src/features/planning/components/PlanningWorkshopView.tsx", import.meta.url), "utf8");
  assert.match(view, /<WorkshopDepartmentTabs halls={halls} departments={activeDepartments} selectedDepartmentId={selectedDepartmentId} operationCountByDepartmentId={operationCountByDepartmentId} onSelect={handleSelectDepartment} onCreate={\(\) => setCreatingDepartment\(true\)} onEdit={setEditingDepartmentId} onMove={handleMoveDepartment} \/>/);
  assert.match(view, /buildWorkshopCategories\(rows, machines, preferences\.state\.filters, preferences\.state\.sort, visibleTaskCategoryCodes, selectedDepartment\?\.linkedMachineIds \?\? \[\]\)/, "le calcul ne filtre plus par machine.departmentId, seulement par les liens configurés");
  assert.match(view, /updateVisibleTaskCategoryCodes\(department\?\.linkedCategoryCodes \?\? \[\]\)/, "sélectionner un onglet écrase le réglage partagé Catégories avec les catégories liées du département");
  assert.doesNotMatch(view, /groupBy/, "l'ancien sélecteur Département/Catégorie a bien été remplacé par les onglets, pas gardé en plus");
  assert.match(view, /from "@\/lib\/visible-task-categories-store"/, "le changement d'onglet ne doit plus passer par updateSettings pour les catégories : store dédié, pas de clone/réécriture de tous les Réglages à chaque clic");

  const tabs = await readFile(new URL("../src/features/planning/components/WorkshopDepartmentTabs.tsx", import.meta.url), "utf8");
  const board = await readFile(new URL("../src/features/planning/components/HallAssignmentBoard.tsx", import.meta.url), "utf8");
  assert.match(tabs, /<HallAssignmentBoard[\s\S]*?onSelect=\{onSelect\}/);
  assert.match(board, /draggable onDragStart=/, "les éléments peuvent être déplacés directement");
  assert.match(board, /onMove\(draggedId, hallId, targetId\)/, "le dépôt transmet l'élément déplacé, son hall et sa cible verticale");
  assert.match(tabs, /onCreate/, "un onglet « ＋ » permet de créer un département");
  assert.match(board, /item\.selected && onEdit/, "l'icône d'édition n'apparaît que sur la catégorie active");

  const filtersComponent = await readFile(new URL("../src/features/planning/components/WorkshopFilters.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(filtersComponent, /Départements/, "le filtre départements par cases à cocher a disparu, remplacé par les onglets");
});

test("un département en mode « physical » (Tournage/Fraisage/Découpe fil) bascule sur buildWorkshopDepartments à partir de allRows, sans écraser le réglage partagé Catégories au clic d'onglet", async () => {
  const view = await readFile(new URL("../src/features/planning/components/PlanningWorkshopView.tsx", import.meta.url), "utf8");
  assert.match(view, /const isPhysicalDepartment = selectedDepartment\?\.membershipMode === "physical";/);
  assert.match(view, /buildWorkshopDepartments\(allRows, machines, \[selectedDepartment\], physicalFilters, preferences\.state\.sort\)\.filter\(\(section\) => section\.id === selectedDepartment\.id\)/, "réutilise le regroupement par département physique existant, pas une nouvelle implémentation");
  assert.match(view, /const physicalFilters = \{ \.\.\.preferences\.state\.filters, departments: \[\] \};/, "neutralise l'ancien filtre « départements » à cases à cocher (retiré de l'interface) qui, laissé à une valeur figée dans les préférences enregistrées, ferait disparaître silencieusement toutes les machines d'un département physique");
  assert.match(view, /if \(department\?\.membershipMode !== "physical"\) updateVisibleTaskCategoryCodes\(department\?\.linkedCategoryCodes \?\? \[\]\);/, "cliquer sur un onglet physique ne doit plus écraser le réglage partagé Catégories, devenu sans effet sur ce département");

  const dialog = await readFile(new URL("../src/features/planning/components/DepartmentLinksDialog.tsx", import.meta.url), "utf8");
  assert.match(dialog, /const isPhysical = department\?\.membershipMode === "physical";/);
  assert.match(dialog, /quelle machine apparaît ici vient du champ « Département » de sa fiche/, "la fenêtre d'édition explique que l'appartenance des machines vient de leur fiche, pas des catégories cochées");
  assert.match(dialog, /physicalMachines\.map\(\(machine\)/, "liste en lecture seule des machines actuellement rattachées, pour la transparence");
});

test("un département en mode « physical » garde un choix de catégories (✎) : elles ne pilotent plus les machines mais restent nécessaires pour retrouver les OF sans machine assignée, sinon invisibles partout dans l'Atelier", async () => {
  const dialog = await readFile(new URL("../src/features/planning/components/DepartmentLinksDialog.tsx", import.meta.url), "utf8");
  assert.match(dialog, /<p className="text-sm font-medium">Catégories liées\{isPhysical \? " \(pour les OF sans machine assignée\)" : ""\}<\/p>/, "la liste des catégories est désormais commune aux deux modes, pas enfermée dans la branche isPhysical");

  const service = await readFile(new URL("../src/features/planning/services/workshop-view-service.ts", import.meta.url), "utf8");
  assert.match(service, /export function buildUnassignedOperationsSection\(rows: OperationView\[\], machines: MachineSettings\[\], department: DepartmentLinks, filters: WorkshopFilterState, sort: WorkshopSortState\): WorkshopDepartmentGroup \| null \{/);
  assert.match(service, /const operations = unassigned\.filter\(\(operation\) => linkedCategoryCodes\.includes\(operation\.taskCode\)\);/);
  assert.doesNotMatch(service, /membershipMode !== "physical"\) \(department\.linkedCategoryCodes/, "les OF sans machine comptent désormais dans les deux modes, pas seulement en mode lié");

  const view = await readFile(new URL("../src/features/planning/components/PlanningWorkshopView.tsx", import.meta.url), "utf8");
  assert.match(view, /const unassignedSection = buildUnassignedOperationsSection\(allRows, machines, selectedDepartment, physicalFilters, preferences\.state\.sort\);/);
  assert.match(view, /return unassignedSection \? \[unassignedSection, \.\.\.machineSections\] : machineSections;/, "la section « Opérations sans machine » reste toujours en premier, comme pour les départements en mode lié");
});

test("un département en mode lié resynchronise le réglage partagé Catégories dès qu'il est affiché, même sans clic d'onglet (ex. sélection déjà restaurée au chargement de la page)", async () => {
  const view = await readFile(new URL("../src/features/planning/components/PlanningWorkshopView.tsx", import.meta.url), "utf8");
  assert.match(view, /useEffect\(\(\) => \{\s*\n\s*if \(!selectedDepartment \|\| isPhysicalDepartment\) return;\s*\n\s*setVisibleTaskCategoryCodes\(selectedDepartment\.linkedCategoryCodes \?\? \[\]\);\s*\n\s*\}, \[selectedDepartment, isPhysicalDepartment\]\);/, "sans cet effet, un onglet en mode lié déjà sélectionné au premier rendu (préférence restaurée) garde l'ancienne valeur du réglage partagé au lieu des catégories réellement liées au département — ses opérations restent invisibles partout sans message d'erreur");
  assert.match(view, /import \{ useEffect, useMemo, useState \} from "react";/);
});

test("la recherche de l'Atelier est débouncée : taper met à jour l'affichage immédiatement mais ne redéclenche le filtrage/re-rendu réel qu'après une pause, pour rester fluide sur un département chargé", async () => {
  const filtersComponent = await readFile(new URL("../src/features/planning/components/WorkshopFilters.tsx", import.meta.url), "utf8");
  assert.match(filtersComponent, /const \[searchInput, setSearchInput\] = useState\(filters\.search\);/);
  assert.match(filtersComponent, /searchTimerRef\.current = window\.setTimeout\(\(\) => patch\({ search: value }\), SEARCH_DEBOUNCE_MS\);/);
  assert.match(filtersComponent, /value={searchInput}/, "le champ affiche la saisie locale instantanée, pas directement filters.search");
});

test("les compteurs d'OF par onglet de l'Atelier utilisent allRows (toutes catégories), pas rows (filtrées sur la catégorie du département actif) — sinon les autres onglets restent à 0 tant qu'on n'a pas cliqué dessus", async () => {
  const view = await readFile(new URL("../src/features/planning/components/PlanningWorkshopView.tsx", import.meta.url), "utf8");
  assert.match(view, /buildDepartmentOperationIndex\(allRows\)/);
  assert.doesNotMatch(view, /buildDepartmentOperationIndex\(rows\)/);

  const hook = await readFile(new URL("../src/features/planning/hooks/useWorkshopOperations.ts", import.meta.url), "utf8");
  assert.match(hook, /return { rows, allRows, /, "le hook expose allRows en plus de rows");
});

test("reconcileOperationViewMachineCatalog indexe les machines par id (Map) plutôt qu'un .find() par opération, sensible sur ~23 000 lignes", async () => {
  const source = await readFile(new URL("../src/features/erp-import/services/erp-machine-mapping-status.ts", import.meta.url), "utf8");
  assert.match(source, /const machineById = new Map\(machines\.map\(\(machine\) => \[machine\.id, machine\]\)\);/);
});

test("créer un département active immédiatement ses catégories liées, sans dépendre d'une relecture de activeDepartments qui n'a pas encore le nouveau département (fermeture obsolète juste après updateSettings)", async () => {
  const view = await readFile(new URL("../src/features/planning/components/PlanningWorkshopView.tsx", import.meta.url), "utf8");
  const body = view.slice(view.indexOf("function handleCreateDepartment"), view.indexOf("function handleUpdateDepartment"));
  assert.match(body, /updateVisibleTaskCategoryCodes\(input\.linkedCategoryCodes\)/, "handleCreateDepartment applique directement input.linkedCategoryCodes");
  assert.doesNotMatch(body, /activeDepartments\.find/, "ne doit plus chercher le département tout juste créé dans activeDepartments, pas encore à jour dans cette fermeture");
});

test("department-settings-service : créer, modifier les liens et supprimer un département, avec garde de suppression si des machines y sont encore physiquement rattachées", async () => {
  const { departmentSettingsService } = await import("../src/features/settings/services/department-settings-service.ts");
  const settings = {
    theme: { information: "#000", card: "#fff" },
    production: {
      departments: [{ id: "quality", value: "Qualité", label: "Qualité", color: "#000", textColor: "#fff", active: true, order: 0, linkedCategoryCodes: ["20"], linkedMachineIds: [] }],
      machines: [{ id: "TOU-01", departmentId: "turning", active: true, visible: true, name: "T1", displayName: "T1", department: "Tournage", machineType: "", color: "", order: 0, technicalInformation: "" }],
    },
  };

  const created = departmentSettingsService.createDepartment(settings, { name: "Ébavurage", linkedCategoryCodes: ["15"], linkedMachineIds: [] });
  assert.equal(created.ok, true);
  assert.equal(settings.production.departments.length, 2);

  assert.equal(departmentSettingsService.createDepartment(settings, { name: "   ", linkedCategoryCodes: [], linkedMachineIds: [] }).ok, false, "nom obligatoire");

  const updated = departmentSettingsService.updateDepartmentLinks(settings, "quality", { name: "Qualité", linkedCategoryCodes: ["20", "32"], linkedMachineIds: ["TOU-01"] });
  assert.equal(updated, true);
  assert.deepEqual(settings.production.departments[0].linkedCategoryCodes, ["20", "32"]);
  assert.deepEqual(settings.production.departments[0].linkedMachineIds, ["TOU-01"]);

  assert.equal(departmentSettingsService.deleteDepartment(settings, "inconnu").ok, true, "supprimer un identifiant déjà absent ne plante pas (aucune machine ne peut y être rattachée)");
  assert.equal(settings.production.departments.length, 2);

  const departmentWithPhysicalMachine = { id: "turning", value: "Tournage", label: "Tournage", color: "#000", textColor: "#fff", active: true, order: 1, linkedCategoryCodes: [], linkedMachineIds: [] };
  settings.production.departments.push(departmentWithPhysicalMachine);
  const guarded = departmentSettingsService.deleteDepartment(settings, "turning");
  assert.equal(guarded.ok, false, "un département encore physiquement rattaché à une machine ne doit pas être supprimable");
  assert.match(guarded.ok ? "" : guarded.error, /machine/i);
  assert.equal(settings.production.departments.length, 3, "aucune mutation quand la suppression est refusée");

  const safeDelete = departmentSettingsService.deleteDepartment(settings, "quality");
  assert.equal(safeDelete.ok, true, "aucune machine n'est physiquement rattachée à quality : suppression autorisée");
  assert.equal(settings.production.departments.length, 2);
});

test("countDepartmentOperations compte les OF d'un département via ses machines liées (catégorie, lien direct, machine non taguée mais porteuse d'une opération, OF sans machine), sans reparcourir toutes les opérations", async () => {
  const { buildDepartmentOperationIndex, countDepartmentOperations, resolveDepartmentMachineIds } = await import("../src/features/planning/services/workshop-view-service.ts");
  const rows = [
    { machineId: "cv5-500", taskCode: "27" }, { machineId: "cv5-500", taskCode: "27" }, // machine taguée 27
    { machineId: "eba-01", taskCode: "15" }, // machine liée directement (peu importe sa catégorie)
    { machineId: "dmu50", taskCode: "5" }, // machine taguée 5, catégorie non liée : exclue
    { machineId: "untagged-01", taskCode: "27" }, // machine non taguée mais porteuse d'une opération catégorie 27 : doit compter
    { machineId: null, taskCode: "27" }, // OF catégorie 27 sans machine assignée : doit compter
    { machineId: null, taskCode: "5" }, // catégorie non liée : exclue
  ];
  const index = buildDepartmentOperationIndex(rows);
  const department = { id: "quality", value: "Qualité", label: "Qualité", color: "#000", textColor: "#fff", active: true, order: 0, linkedCategoryCodes: ["27"], linkedMachineIds: ["eba-01"] };
  const departmentMachines = [
    { id: "cv5-500", taskCategoryCode: "27" },
    { id: "eba-01", taskCategoryCode: null },
    { id: "dmu50", taskCategoryCode: "5" },
    { id: "untagged-01", taskCategoryCode: null },
  ];
  assert.equal(countDepartmentOperations(index, departmentMachines, department), 5, "2 (cv5-500 taguée) + 1 (eba-01 lien direct) + 1 (untagged-01, non taguée mais porteuse d'une opération 27) + 1 (OF catégorie 27 sans machine) = 5 ; dmu50 et l'OF catégorie 5 sans machine sont exclus");
  assert.deepEqual([...resolveDepartmentMachineIds(index, departmentMachines, department)].sort(), ["cv5-500", "eba-01", "untagged-01"]);
});

test("buildDepartmentOperationIndex exclut les opérations terminées, pour que le compteur d'un onglet reste cohérent avec ce qui y est réellement affiché", async () => {
  const { buildDepartmentOperationIndex, countDepartmentOperations } = await import("../src/features/planning/services/workshop-view-service.ts");
  const rows = [
    { machineId: "cv5-500", taskCode: "27", effectiveStatus: "in-progress" },
    { machineId: "cv5-500", taskCode: "27", effectiveStatus: "completed" },
    { machineId: null, taskCode: "27", effectiveStatus: "completed" },
  ];
  const index = buildDepartmentOperationIndex(rows);
  const department = { id: "milling", value: "Fraisage", label: "Fraisage", color: "#000", textColor: "#fff", active: true, order: 0, linkedCategoryCodes: ["27"], linkedMachineIds: [] };
  const machines = [{ id: "cv5-500", taskCategoryCode: "27" }];
  assert.equal(countDepartmentOperations(index, machines, department), 1, "seule l'opération en cours compte, les deux terminées (assignée et sans machine) sont exclues");
});

test("groupOperationsByMachineId (Atelier) exclut les opérations terminées de l'affichage courant", async () => {
  const { groupOperationsByMachineId } = await import("../src/features/planning/services/workshop-view-service.ts");
  const rows = [
    { ...opBase, id: "op-actif", workOrderId: "OF-500", articleCode: "A500", machine: "CV5-500", machineId: "cv5-500", effectiveStatus: "in-progress" },
    { ...opBase, id: "op-fini", workOrderId: "OF-501", articleCode: "A501", machine: "CV5-500", machineId: "cv5-500", effectiveStatus: "completed" },
    { ...opBase, id: "op-fini-sans-machine", workOrderId: "OF-502", articleCode: "A502", machine: "Non définie", machineId: null, isWithoutMachine: true, effectiveStatus: "completed" },
  ];
  const { byMachineId, unassigned } = groupOperationsByMachineId(rows, machines, createDefaultWorkshopFilters());
  assert.deepEqual((byMachineId.get("cv5-500") ?? []).map((operation) => operation.id), ["op-actif"], "l'opération terminée assignée à cv5-500 disparaît du planning");
  assert.deepEqual(unassigned.map((operation) => operation.id), [], "l'opération terminée sans machine disparaît aussi, plutôt que de rester visible en « Machine non définie »");
});

test("resolveDepartmentMachineIds/countDepartmentOperations en mode « physical » : uniquement le département physique de la fiche machine, jamais une catégorie/opération portée ponctuellement", async () => {
  const { buildDepartmentOperationIndex, countDepartmentOperations, resolveDepartmentMachineIds } = await import("../src/features/planning/services/workshop-view-service.ts");
  // Intègre-300 : machine tourno-fraiseuse, physiquement en Tournage, taguée catégorie 26 (Tournage/Fraisage), mais qui porte aussi des opérations codées Fraisage (27).
  const rows = [
    { machineId: "integrex-01", taskCode: "5" },
    { machineId: "integrex-01", taskCode: "27" },
    { machineId: "fra-01", taskCode: "27" }, // machine physiquement en Fraisage, taguée 27
  ];
  const index = buildDepartmentOperationIndex(rows);
  const machines = [
    { id: "integrex-01", departmentId: "turning", taskCategoryCode: "26" },
    { id: "fra-01", departmentId: "milling", taskCategoryCode: "27" },
  ];
  const turning = { id: "turning", membershipMode: "physical", linkedCategoryCodes: ["5"], linkedMachineIds: [] };
  const milling = { id: "milling", membershipMode: "physical", linkedCategoryCodes: ["27"], linkedMachineIds: [] };

  assert.deepEqual([...resolveDepartmentMachineIds(index, machines, turning)], ["integrex-01"], "l'Integrex reste dans Tournage même si elle porte aussi des opérations codées Fraisage");
  assert.equal(countDepartmentOperations(index, machines, turning), 2, "les 2 opérations de l'Integrex (catégories 5 ET 27) comptent pour Tournage, son département physique — pas seulement celles codées 5");
  assert.deepEqual([...resolveDepartmentMachineIds(index, machines, milling)], ["fra-01"], "l'Integrex n'apparaît jamais dans Fraisage malgré ses opérations codées 27 : ce n'est pas son département physique");
  assert.equal(countDepartmentOperations(index, machines, milling), 1, "seule l'opération de fra-01 compte pour Fraisage, pas celle de l'Integrex");
});

test("buildUnassignedOperationsSection route les OF sans machine assignée vers un département physique selon leur catégorie liée, faute de departmentId à lire sur une opération sans machine", async () => {
  const { buildUnassignedOperationsSection } = await import("../src/features/planning/services/workshop-view-service.ts");
  // op-3 (catégorie « 39 », sans machine) doit rejoindre Découpe fil si la catégorie 39 lui est liée, mais pas Fraisage (catégorie 27).
  const opsWithUnassignedCategory39 = operations.map((operation) => operation.id === "op-3" ? { ...operation, taskCode: "39" } : operation);
  const wireCutting = { id: "wire-cutting", membershipMode: "physical", linkedCategoryCodes: ["39"], linkedMachineIds: [] };
  const milling = { id: "milling", membershipMode: "physical", linkedCategoryCodes: ["27"], linkedMachineIds: [] };

  const wireCuttingSection = buildUnassignedOperationsSection(opsWithUnassignedCategory39, machines, wireCutting, createDefaultWorkshopFilters(), NO_SORT);
  assert.ok(wireCuttingSection, "l'OF sans machine de catégorie 39 doit apparaître pour Découpe fil, dont la catégorie 39 est liée");
  assert.equal(wireCuttingSection.label, "Opérations sans machine");
  assert.deepEqual(wireCuttingSection.machines[0].operations.map((operation) => operation.id), ["op-3"]);

  assert.equal(buildUnassignedOperationsSection(opsWithUnassignedCategory39, machines, milling, createDefaultWorkshopFilters(), NO_SORT), null, "aucune catégorie liée à Fraisage ne correspond à l'OF orphelin : pas de section");

  const noLinkedCategory = { id: "wire-cutting", membershipMode: "physical", linkedCategoryCodes: [], linkedMachineIds: [] };
  assert.equal(buildUnassignedOperationsSection(opsWithUnassignedCategory39, machines, noLinkedCategory, createDefaultWorkshopFilters(), NO_SORT), null, "sans aucune catégorie liée, rien à router");
});

test("findMachinesWithMismatchedDepartmentLabel détecte les machines dont la fiche affiche encore le bon libellé mais dont le lien réel (departmentId) a été rompu (ex. département supprimé puis recréé)", async () => {
  const { findMachinesWithMismatchedDepartmentLabel } = await import("../src/features/planning/services/workshop-view-service.ts");
  const department = { id: "milling-v2", label: "Fraisage" };
  const machines = [
    { id: "FRA-01", department: "Fraisage", departmentId: "milling-v2", deleted: false }, // toujours correctement rattachée : pas un cas orphelin
    { id: "FRA-02", department: "Fraisage", departmentId: "milling", deleted: false }, // affiche « Fraisage » mais pointe vers l'ancien identifiant du département, disparu
    { id: "FRA-03", department: "fraisage", departmentId: "autre-id", deleted: false }, // casse différente, doit tout de même être détectée
    { id: "TOU-01", department: "Tournage", departmentId: "turning", deleted: false }, // autre département : non concernée
    { id: "FRA-04", department: "Fraisage", departmentId: "milling", deleted: true }, // machine supprimée : hors périmètre
  ];
  const mismatched = findMachinesWithMismatchedDepartmentLabel(machines, department);
  assert.deepEqual(mismatched.map((machine) => machine.id).sort(), ["FRA-02", "FRA-03"]);
});

test("PlanningWorkshopView affiche un diagnostic explicite (avec les identifiants des machines concernées) dès qu'un département physique a un lien machine rompu, même si d'autres machines du même département s'affichent normalement (pas seulement quand l'onglet est totalement vide)", async () => {
  const view = await readFile(new URL("../src/features/planning/components/PlanningWorkshopView.tsx", import.meta.url), "utf8");
  assert.match(view, /const mismatchedDepartmentLabelMachines = useMemo\(\s*\(\) => isPhysicalDepartment && selectedDepartment \? findMachinesWithMismatchedDepartmentLabel\(machines, selectedDepartment\) : \[\],/, "calculé pour tout l'onglet, plus seulement quand categoryGroups est vide — une seule machine orpheline au milieu d'autres correctement rattachées doit rester détectée");
  assert.match(view, /\{mismatchedDepartmentLabelMachines\.length \? <p role="alert"[\s\S]*?\{mismatchedDepartmentLabelMachines\.length\} machine\(s\) affichent «/, "bandeau toujours affiché au-dessus des sections, indépendamment de categoryGroups");
});

test("les 5 départements de démonstration portent par défaut la catégorie correspondante, pour que Qualité/Maintenance ne soient plus des onglets vides", async () => {
  const source = await readFile(new URL("../src/features/settings/config/default-settings.ts", import.meta.url), "utf8");
  assert.match(source, /standard\("turning", "Tournage", "Tournage", "#2563eb", "#ffffff", 0\), membershipMode: "physical", linkedCategoryCodes: \["5"\]/, "Tournage est un département de production : basé sur le département physique de la machine, pas sur un lien par catégorie");
  assert.match(source, /standard\("milling", "Fraisage", "Fraisage", "#7c3aed", "#ffffff", 1\), membershipMode: "physical", linkedCategoryCodes: \["27"\]/);
  assert.match(source, /standard\("wire-cutting", "Découpe fil", "Découpe fil", "#0d9488", "#ffffff", 2\), membershipMode: "physical", linkedCategoryCodes: \["39"\]/);
  assert.match(source, /standard\("quality", "Qualité", "Qualité", "#0891b2", "#ffffff", 3\), linkedCategoryCodes: \["20"\]/, "Qualité n'a aucune machine physiquement rattachée : c'est ce lien qui fait vivre l'onglet");
  assert.doesNotMatch(source, /standard\("quality"[^)]*\), membershipMode: "physical"/, "Qualité doit rester en mode lié : elle n'a structurellement aucune machine physiquement rattachée");
  assert.match(source, /standard\("maintenance", "Maintenance", "Maintenance", "#d97706", "#ffffff", 4\), linkedCategoryCodes: \["23"\]/, "Maintenance n'a aucune machine physiquement rattachée : c'est ce lien qui fait vivre l'onglet");
  assert.doesNotMatch(source, /standard\("maintenance"[^)]*\), membershipMode: "physical"/, "Maintenance doit rester en mode lié : elle n'a structurellement aucune machine physiquement rattachée");
});

test("le filtre « machines sans OF » masque les machines vides", () => {
  const filters = { ...createDefaultWorkshopFilters(), showMachinesWithoutOperations: false };
  const sections = buildWorkshopDepartments(operations, machines, departments, filters, NO_SORT);
  assert.equal(findDepartment(sections, "dept-tournage"), undefined, "Tournage n'a que des machines vides");
  assert.ok(findMachine(findDepartment(sections, "dept-fraisage"), "cv5-500"), "les machines avec OF restent visibles");
});

test("les filtres actives/inactives/masquées reflètent MachineSettings", () => {
  const onlyInactive = buildWorkshopDepartments(operations, machines, departments, { ...createDefaultWorkshopFilters(), showActiveMachines: false, showInactiveMachines: true }, NO_SORT);
  const millingInactive = findDepartment(onlyInactive, "dept-fraisage");
  assert.ok(findMachine(millingInactive, "dmu60"), "la machine inactive doit apparaître");
  assert.equal(findMachine(millingInactive, "cv5-500"), undefined, "les machines actives doivent être exclues");

  const withMasked = buildWorkshopDepartments(operations, machines, departments, { ...createDefaultWorkshopFilters(), showMaskedMachines: true }, NO_SORT);
  assert.ok(findMachine(findDepartment(withMasked, "dept-fraisage"), "masked-machine"), "la machine masquée doit apparaître quand demandé");
});

test("le filtre département restreint les sections et masque le lot non affecté", () => {
  const sections = buildWorkshopDepartments(operations, machines, departments, { ...createDefaultWorkshopFilters(), departments: ["dept-tournage"] }, NO_SORT);
  assert.equal(sections.length, 1);
  assert.equal(sections[0].id, "dept-tournage");
});

test("une valeur figée de l'ancien filtre départements (retiré de l'interface, mais toujours dans les préférences déjà enregistrées d'un utilisateur) fait disparaître silencieusement toutes les machines d'un département physique si elle n'est pas neutralisée", () => {
  // Reproduit le cas signalé par l'utilisateur : Fraisage a bien des machines rattachées (departmentId correct), mais preferences.state.filters.departments contient encore une ancienne sélection (« dept-tournage ») qui ne correspond plus à Fraisage.
  const staleFilters = { ...createDefaultWorkshopFilters(), departments: ["dept-tournage"] };
  const sections = buildWorkshopDepartments(operations, machines, [departments[0]], staleFilters, NO_SORT); // departments[0] = dept-fraisage
  assert.deepEqual(sections, [], "avec la valeur figée, Fraisage disparaît entièrement — c'est le bug signalé par l'utilisateur (« je trouve uniquement le planning sans machine »)");

  const neutralizedFilters = { ...staleFilters, departments: [] };
  const fixedSections = buildWorkshopDepartments(operations, machines, [departments[0]], neutralizedFilters, NO_SORT);
  assert.ok(findDepartment(fixedSections, "dept-fraisage"), "une fois le filtre neutralisé (departments: []), les machines de Fraisage réapparaissent normalement");
});

test("le filtre Articles isole les opérations dont l'article est partagé par plusieurs OF, ou au contraire unique", () => {
  const sharedArticleOps = [
    { ...opBase, id: "op-shared-1", workOrderId: "OF-300", articleCode: "SHARED", description: "Pièce commune", machine: "CV5-500", machineId: "cv5-500", articleWorkOrderCount: 2, workOrder: { customerName: "EXAIL" } },
    { ...opBase, id: "op-shared-2", workOrderId: "OF-301", articleCode: "SHARED", description: "Pièce commune", machine: "DMU50", machineId: "dmu50", articleWorkOrderCount: 2, workOrder: { customerName: "SAB" } },
    { ...opBase, id: "op-unique", workOrderId: "OF-302", articleCode: "SOLO", description: "Pièce unique", machine: "CV5-500", machineId: "cv5-500", articleWorkOrderCount: 1, workOrder: { customerName: "FNH" } },
  ];
  const multipleOnly = buildWorkshopDepartments(sharedArticleOps, machines, departments, { ...createDefaultWorkshopFilters(), articleMultiplicity: "multiple" }, NO_SORT);
  const millingMultiple = findDepartment(multipleOnly, "dept-fraisage");
  assert.deepEqual(findMachine(millingMultiple, "cv5-500")?.operations.map((o) => o.id), ["op-shared-1"], "seule l'opération à article partagé doit rester sur CV5-500");
  assert.equal(findMachine(millingMultiple, "dmu50")?.operations.length, 1);

  const uniqueOnly = buildWorkshopDepartments(sharedArticleOps, machines, departments, { ...createDefaultWorkshopFilters(), articleMultiplicity: "unique" }, NO_SORT);
  const millingUnique = findDepartment(uniqueOnly, "dept-fraisage");
  assert.deepEqual(findMachine(millingUnique, "cv5-500")?.operations.map((o) => o.id), ["op-unique"]);
});

test("createDefaultWorkshopFilters et parseWorkshopViewState valident articleMultiplicity et retombent sur « all » si invalide", () => {
  assert.equal(createDefaultWorkshopFilters().articleMultiplicity, "all");
  assert.equal(parseWorkshopViewState(null).filters.articleMultiplicity, "all");
  assert.equal(parseWorkshopViewState({ version: 1, filters: { articleMultiplicity: "multiple" } }).filters.articleMultiplicity, "multiple");
  assert.equal(parseWorkshopViewState({ version: 1, filters: { articleMultiplicity: "valeur-inconnue" } }).filters.articleMultiplicity, "all");
});

test("la colonne Article affiche un badge « N OF » réutilisant la même couleur que le Cockpit ERP, sans dupliquer la règle", async () => {
  const row = await readFile(new URL("../src/features/planning/components/WorkshopOperationRow.tsx", import.meta.url), "utf8");
  assert.match(row, /import { articleColor } from "@\/features\/erp-import\/services\/erp-planning-grouping"/);
  assert.match(row, /operation\.articleWorkOrderCount > 1 \? articleColor\(operation\.articleCode\) : null/);
  assert.match(row, /title="Cet article est présent dans plusieurs OF en cours">\{operation\.articleWorkOrderCount\}<\/span>/);
});

test("le filtre Articles de l'Atelier reprend les mêmes libellés que le Cockpit ERP", async () => {
  const workshopFilters = await readFile(new URL("../src/features/planning/components/WorkshopFilters.tsx", import.meta.url), "utf8");
  const erpToolbar = await readFile(new URL("../src/features/erp-import/components/ErpPlanningViewToolbar.tsx", import.meta.url), "utf8");
  assert.match(workshopFilters, /Présents dans plusieurs OF/);
  assert.match(workshopFilters, /Présents dans un seul OF/);
  assert.match(erpToolbar, /Présents dans plusieurs OF/, "référence : mêmes libellés que le Cockpit ERP");
});

test("la recherche filtre les opérations affichées sans faire disparaître les machines actives", () => {
  const sections = buildWorkshopDepartments(operations, machines, departments, { ...createDefaultWorkshopFilters(), search: "axe" }, NO_SORT);
  const milling = findDepartment(sections, "dept-fraisage");
  assert.equal(findMachine(milling, "dmu50")?.operations.length, 1);
  assert.equal(findMachine(milling, "cv5-500")?.operations.length, 0, "l'opération Bride ne correspond pas à la recherche");
});

test("les colonnes par défaut couvrent les colonnes demandées, toutes visibles, dont le Retard", () => {
  const columns = createDefaultWorkshopColumns();
  assert.equal(columns.length, WORKSHOP_COLUMN_IDS.length);
  assert.ok(columns.every((column) => column.visible));
  ["priority", "work-order", "operation", "article", "client", "quantity", "description", "time", "status", "start-date", "end-date", "delay", "machine"].forEach((id) => {
    assert.ok(columns.some((column) => column.id === id), `colonne manquante : ${id}`);
  });
});

test("les colonnes Client et Quantité affichent le nom du client et la quantité commandée (fichier Top de l'ERP), à l'écran comme à l'impression, sans tomber dans le sélecteur de machine par défaut", async () => {
  const row = await readFile(new URL("../src/features/planning/components/WorkshopOperationRow.tsx", import.meta.url), "utf8");
  assert.match(row, /if \(columnId === "client"\) return <span className="block truncate">\{operation\.workOrder\?\.customerName \|\| "—"\}<\/span>;/);
  assert.match(row, /if \(columnId === "quantity"\) return <span>\{operation\.workOrder\?\.quantity != null \? operation\.workOrder\.quantity\.toLocaleString\("fr-BE"\) : "—"\}<\/span>;/);

  const printView = await readFile(new URL("../src/features/planning/components/WorkshopMachinePrintView.tsx", import.meta.url), "utf8");
  assert.match(printView, /NUMERIC_COLUMN_IDS = new Set<WorkshopColumnId>\(\["priority", "delay", "quantity"\]\);/, "la quantité s'aligne à droite à l'impression, comme Priorité/Retard");
  assert.match(printView, /if \(columnId === "client"\) return operation\.workOrder\?\.customerName \|\| "—";/);
  assert.match(printView, /if \(columnId === "quantity"\) return operation\.workOrder\?\.quantity != null \? operation\.workOrder\.quantity\.toLocaleString\("fr-BE"\) : "—";/);

  const types = await readFile(new URL("../src/features/erp-import/types/erp-import.ts", import.meta.url), "utf8");
  assert.match(types, /Pick<ErpWorkOrder, "id" \| "articleCode" \| "articleId" \| "articleGroupId" \| "customerName" \| "customerReference" \| "quantity" \| "firstSeenImportId">/, "la quantité et l'id du premier import doivent survivre à la réduction du work order transmise à l'Atelier (toPlanningListRow)");

  const service = await readFile(new URL("../src/features/erp-import/server/erp-planning-service.ts", import.meta.url), "utf8");
  assert.match(service, /quantity: row\.workOrder\.quantity,/, "toPlanningListRow doit reporter la quantité, sinon l'Atelier reçoit un work order tronqué sans elle");
  assert.match(service, /firstSeenImportId: row\.workOrder\.firstSeenImportId,/, "toPlanningListRow doit aussi reporter firstSeenImportId, sinon le module OF ne peut plus repérer les OF nouvelles");
});

test("la colonne Retard reprend les mêmes seuils et libellés que le Cockpit ERP, via une table partagée unique", async () => {
  const presentation = await readFile(new URL("../src/features/erp-import/services/erp-operation-status-presentation.ts", import.meta.url), "utf8");
  const row = await readFile(new URL("../src/features/planning/components/WorkshopOperationRow.tsx", import.meta.url), "utf8");
  const operations = await readFile(new URL("../src/features/erp-import/components/ErpPlanningOperations.tsx", import.meta.url), "utf8");
  assert.match(presentation, /delayDays > 15\) return "danger"/);
  assert.match(presentation, /delayDays > 0\) return "warning"/);
  assert.match(presentation, /j retard/);
  assert.match(presentation, /j avance/);
  assert.match(row, /erpOperationDelayTone|erpOperationDelayLabel/, "l'Atelier doit réutiliser la table partagée, pas sa propre copie");
  assert.doesNotMatch(row, /delayDays > 15\) return "danger"/, "aucune seconde copie des seuils dans l'Atelier");
  assert.match(operations, /delayDays > 15/, "référence : le Cockpit ERP utilise le même seuil de 15 jours");
});

test("parseWorkshopViewState retombe sur les valeurs par défaut pour une entrée invalide ou d'une ancienne version", () => {
  assert.deepEqual(parseWorkshopViewState(null).filters, createDefaultWorkshopFilters());
  assert.deepEqual(parseWorkshopViewState({ version: 0, columns: "invalide" }).filters, createDefaultWorkshopFilters());
  const recovered = parseWorkshopViewState({ version: 1, columns: [{ id: "priority", visible: false }], collapsedMachineIds: ["dmu50"], filters: { search: "abc", showActiveMachines: false } });
  assert.equal(recovered.columns.find((column) => column.id === "priority").visible, false);
  assert.deepEqual(recovered.collapsedMachineIds, ["dmu50"]);
  assert.equal(recovered.filters.search, "abc");
  assert.equal(recovered.filters.showActiveMachines, false);
  assert.equal(recovered.filters.showMachinesWithoutOperations, true, "les champs absents reprennent leur valeur par défaut");
});

test("les colonnes se réordonnent par glisser-déposer et l'affichage par défaut montre 10 lignes par machine", () => {
  const state = createDefaultWorkshopViewState();
  assert.equal(state.rowsPerMachine, 10);
  const reordered = moveWorkshopColumn(state.columns, "machine", "priority");
  assert.equal(reordered[0].id, "machine");
  assert.equal(reordered.length, state.columns.length);
  assert.deepEqual(moveWorkshopColumn(state.columns, "inconnue", "priority"), state.columns, "un identifiant inconnu ne modifie rien");
});

test("parseWorkshopViewState valide rowsPerMachine et retombe sur 10 si la valeur est invalide", () => {
  assert.equal(parseWorkshopViewState(null).rowsPerMachine, 10);
  assert.equal(parseWorkshopViewState({ version: 1, rowsPerMachine: 25 }).rowsPerMachine, 25);
  assert.equal(parseWorkshopViewState({ version: 1, rowsPerMachine: "all" }).rowsPerMachine, "all");
  assert.equal(parseWorkshopViewState({ version: 1, rowsPerMachine: 999 }).rowsPerMachine, 10, "une valeur hors liste retombe sur le défaut");
});

test("WorkshopMachinePanel affiche toutes les opérations dans un cadre défilant dimensionné par « Lignes par machine »", async () => {
  const panel = await readFile(new URL("../src/features/planning/components/WorkshopMachinePanel.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(panel, /\.slice\(0, rowsPerMachine\)/, "aucune opération ne doit être masquée par le réglage de lignes");
  assert.match(panel, /rowsPerMachine === "all" \? undefined : HEADER_HEIGHT_PX \+ ROW_HEIGHT_PX \* rowsPerMachine/);
  assert.match(panel, /overflow-auto/);
  assert.match(panel, /sticky top-0/, "l'en-tête doit rester visible pendant le défilement du cadre");
});

test("WorkshopMachinePanel affiche la machine entière dans une carte compacte à gauche et agrandissable", async () => {
  const panel = await readFile(new URL("../src/features/planning/components/WorkshopMachinePanel.tsx", import.meta.url), "utf8");
  assert.match(panel, /import \{ useMachinePhotos \} from "@\/features\/machines\/services\/machine-photo-store";/);
  assert.match(panel, /backgroundImage: `url\(\$\{machinePhoto\}\)`/);
  assert.match(panel, /h-14 w-20 shrink-0[^\n]+bg-contain bg-center bg-no-repeat/);
  assert.match(panel, /flex w-full items-center gap-2 border-b border-slate-100 bg-slate-50/);
  assert.match(panel, /onClick=\{\(\) => setIsPhotoOpen\(true\)\}/);
  assert.match(panel, /role="dialog" aria-modal="true"/);
  assert.match(panel, /Charge : \{plannedLoadHours\.toLocaleString\("fr-BE"\)\} h/);
});

test("departmentSettingsService déplace durablement une catégorie avant sa cible et renumérote l'ordre", async () => {
  const { departmentSettingsService } = await import("../src/features/settings/services/department-settings-service.ts");
  const settings = {
    production: {
      departments: [
        { id: "turning", order: 0 },
        { id: "milling", order: 1 },
        { id: "quality", order: 2 },
      ],
    },
  };
  assert.equal(departmentSettingsService.moveDepartment(settings, "turning", "quality"), true);
  assert.deepEqual(settings.production.departments.map((item) => [item.id, item.order]), [["milling", 0], ["quality", 1], ["turning", 2]]);
  assert.equal(departmentSettingsService.moveDepartment(settings, "unknown", "milling"), false);
  assert.deepEqual(settings.production.departments.map((item) => item.id), ["milling", "quality", "turning"], "un identifiant inconnu ne modifie rien");
});

test("Planning capacité reprend les départements et rattachements machine du Planning Atelier sans modifier sa vue", async () => {
  const capacity = await readFile(new URL("../src/features/planning/components/PlanningModule.tsx", import.meta.url), "utf8");
  const workshop = await readFile(new URL("../src/features/planning/components/PlanningWorkshopView.tsx", import.meta.url), "utf8");
  assert.match(capacity, /buildDepartmentOperationIndex, resolveDepartmentMachineIds/);
  assert.match(capacity, /resolveDepartmentMachineIds\(departmentOperationIndex, settings\.production\.machines, department\)/);
  assert.match(capacity, /label: department\.label, machines: matchingMachines/);
  assert.match(capacity, /Catégories, machines et rattachements partagés avec le Planning Atelier/);
  assert.doesNotMatch(workshop, /Planning capacité reprend/);
});

test("sortOperations trie par priorité ou par retard selon la colonne active, et laisse les valeurs inconnues en fin de liste", () => {
  const unsorted = [
    { id: "a", workOrderId: "OF-1", effectivePriority: 3, delayDays: 5 },
    { id: "b", workOrderId: "OF-2", effectivePriority: 9, delayDays: null },
    { id: "c", workOrderId: "OF-3", effectivePriority: 1, delayDays: -2 },
  ];
  assert.deepEqual(sortOperations(unsorted, NO_SORT).map((o) => o.id), ["a", "b", "c"]);
  assert.deepEqual(sortOperations(unsorted, { column: "priority", direction: "asc" }).map((o) => o.id), ["c", "a", "b"]);
  assert.deepEqual(sortOperations(unsorted, { column: "priority", direction: "desc" }).map((o) => o.id), ["b", "a", "c"]);
  assert.deepEqual(sortOperations(unsorted, { column: "delay", direction: "desc" }).map((o) => o.id), ["a", "c", "b"], "b sans date de retard reste en fin de liste, jamais fabriqué");
  assert.deepEqual(sortOperations(unsorted, { column: "delay", direction: "asc" }).map((o) => o.id), ["c", "a", "b"]);
});

test("nextSortState boucle décroissant → croissant → aucun tri, une seule colonne active à la fois", () => {
  assert.deepEqual(nextSortState(createDefaultWorkshopSort(), "priority"), { column: "priority", direction: "desc" });
  assert.deepEqual(nextSortState({ column: "priority", direction: "desc" }, "priority"), { column: "priority", direction: "asc" });
  assert.deepEqual(nextSortState({ column: "priority", direction: "asc" }, "priority"), createDefaultWorkshopSort());
  assert.deepEqual(nextSortState({ column: "priority", direction: "asc" }, "delay"), { column: "delay", direction: "desc" }, "changer de colonne repart à décroissant, sans mélanger les deux tris");
});

test("buildWorkshopDepartments applique le tri de priorité ou de retard demandé à chaque machine", () => {
  const sameMachineOps = [
    { ...opBase, id: "op-low", workOrderId: "OF-200", articleCode: "D400", description: "Faible priorité", machine: "CV5-500", machineId: "cv5-500", effectivePriority: 2, delayDays: 1, workOrder: null },
    { ...opBase, id: "op-high", workOrderId: "OF-201", articleCode: "E500", description: "Haute priorité", machine: "CV5-500", machineId: "cv5-500", effectivePriority: 8, delayDays: 10, workOrder: null },
  ];
  const desc = buildWorkshopDepartments(sameMachineOps, machines, departments, createDefaultWorkshopFilters(), { column: "priority", direction: "desc" });
  assert.deepEqual(findMachine(findDepartment(desc, "dept-fraisage"), "cv5-500").operations.map((o) => o.id), ["op-high", "op-low"]);
  const asc = buildWorkshopDepartments(sameMachineOps, machines, departments, createDefaultWorkshopFilters(), { column: "priority", direction: "asc" });
  assert.deepEqual(findMachine(findDepartment(asc, "dept-fraisage"), "cv5-500").operations.map((o) => o.id), ["op-low", "op-high"]);
  const byDelay = buildWorkshopDepartments(sameMachineOps, machines, departments, createDefaultWorkshopFilters(), { column: "delay", direction: "desc" });
  assert.deepEqual(findMachine(findDepartment(byDelay, "dept-fraisage"), "cv5-500").operations.map((o) => o.id), ["op-high", "op-low"]);
});

test("parseWorkshopViewState valide le tri générique, migre l'ancien champ prioritySort et retombe sur aucun tri si invalide", () => {
  assert.deepEqual(createDefaultWorkshopViewState().sort, createDefaultWorkshopSort());
  assert.deepEqual(parseWorkshopViewState(null).sort, createDefaultWorkshopSort());
  assert.deepEqual(parseWorkshopViewState({ version: 1, sort: { column: "delay", direction: "asc" } }).sort, { column: "delay", direction: "asc" });
  assert.deepEqual(parseWorkshopViewState({ version: 1, sort: { column: "colonne-inconnue", direction: "asc" } }).sort, createDefaultWorkshopSort());
  assert.deepEqual(parseWorkshopViewState({ version: 1, prioritySort: "asc" }).sort, { column: "priority", direction: "asc" }, "l'ancien réglage prioritySort est repris, pas perdu");
  assert.deepEqual(parseWorkshopViewState({ version: 1, prioritySort: "none" }).sort, createDefaultWorkshopSort());
});

test("les en-têtes Priorité et Retard exposent un bouton de tri croissant/décroissant relié à la préférence persistée", async () => {
  const panel = await readFile(new URL("../src/features/planning/components/WorkshopMachinePanel.tsx", import.meta.url), "utf8");
  const hook = await readFile(new URL("../src/features/planning/hooks/useWorkshopViewPreferences.ts", import.meta.url), "utf8");
  const view = await readFile(new URL("../src/features/planning/components/PlanningWorkshopView.tsx", import.meta.url), "utf8");
  assert.match(panel, /onClick=\{\(\) => onCycleSort\(columnId as WorkshopSortColumn\)\}/);
  assert.match(panel, /SORTABLE_COLUMNS\.has\(columnId\)/, "le bouton de tri doit apparaître pour toute colonne triable, pas seulement Priorité");
  assert.match(hook, /cycleSort/);
  assert.match(view, /onCycleSort=\{preferences\.cycleSort\}/);
});

test("le menu Colonnes permet d'afficher ou de masquer chaque colonne indépendamment", async () => {
  const selector = await readFile(new URL("../src/features/planning/components/WorkshopColumnSelector.tsx", import.meta.url), "utf8");
  assert.match(selector, /type="checkbox" checked=\{column\.visible\}/);
  assert.match(selector, /onToggleColumn\(column\.id\)/);
});

test("le bouton Renuméroter réattribue 1, 2, 3… selon l'ordre actuellement affiché pour cette machine", async () => {
  const panel = await readFile(new URL("../src/features/planning/components/WorkshopMachinePanel.tsx", import.meta.url), "utf8");
  assert.match(panel, /const handleRenumber = useCallback\(\(\) => \{\s*onRenumberOperations\(operationsRef\.current\.map\(\(operation\) => operation\.id\)\)/);
  assert.match(panel, /disabled=\{busy \|\| operations\.length < 2\}/, "désactivé pendant une mutation ou s'il n'y a rien à renumeroter");
  assert.match(panel, />\s*Renuméroter\s*</);

  const hook = await readFile(new URL("../src/features/planning/hooks/useWorkshopOperations.ts", import.meta.url), "utf8");
  assert.match(hook, /priority: index \+ 1/, "la numérotation commence à 1 et s'incrémente, à la différence du glisser-déposer (priorités décroissantes depuis 999)");
});

test("renumberOperations attribue 1..N selon l'ordre fourni, via la même route PATCH que les autres mutations de priorité", async () => {
  const hook = await readFile(new URL("../src/features/planning/hooks/useWorkshopOperations.ts", import.meta.url), "utf8");
  assert.match(hook, /const renumberOperations = useCallback\(async \(orderedOperationIds: string\[\]\)/);
  assert.match(hook, /\.map\(\(id, index\) => \(\{ id, priority: index \+ 1 \}\)\)/);
  assert.match(hook, /\.filter\(\(entry\) => currentPriority\.get\(entry\.id\) !== entry\.priority\)/);
  assert.match(hook, /patchOperationRemote\(entry\.id, \{ priority: entry\.priority \}/);
});

test("l'entrée de priorité se remet à jour après une mutation groupée (Renuméroter, glisser-déposer), au lieu de garder une valeur figée à l'affichage initial", async () => {
  const row = await readFile(new URL("../src/features/planning/components/WorkshopOperationRow.tsx", import.meta.url), "utf8");
  assert.match(row, /key=\{operation\.effectivePriority\}/, "force le remontage du champ non contrôlé quand la priorité change depuis l'extérieur (sinon defaultValue reste figé sur la première valeur affichée)");
});

test("clampColumnWidth borne une largeur de colonne à l'intervalle accepté", () => {
  assert.equal(clampColumnWidth(10), 44, "une largeur trop petite retombe sur le minimum (abaissé à 44px pour permettre des colonnes très resserrées)");
  assert.equal(clampColumnWidth(5000), 640, "une largeur trop grande retombe sur le maximum");
  assert.equal(clampColumnWidth(200.4), 200, "arrondie à l'entier le plus proche");
});

test("parseWorkshopViewState valide columnWidths : nombres uniquement, colonnes connues, valeurs bornées", () => {
  assert.deepEqual(createDefaultWorkshopViewState().columnWidths, {});
  assert.deepEqual(parseWorkshopViewState(null).columnWidths, {});
  assert.deepEqual(parseWorkshopViewState({ version: 1, columnWidths: { priority: 260, delay: 10, "colonne-inconnue": 300, article: "200" } }).columnWidths, { priority: 260, delay: 44 }, "les colonnes inconnues et les valeurs non numériques sont ignorées, les valeurs hors bornes sont clampées");
});

test("le glisser-déposer d'un bord de colonne redimensionne via colgroup, sans perturber le glisser-déposer de réordonnancement des colonnes", async () => {
  const panel = await readFile(new URL("../src/features/planning/components/WorkshopMachinePanel.tsx", import.meta.url), "utf8");
  assert.match(panel, /<colgroup>/);
  assert.match(panel, /table-fixed/);
  assert.match(panel, /cursor-col-resize/);
  assert.match(panel, /onMouseDown=\{\(event\) => startResize\(event, columnId\)\}/);
  assert.match(panel, /event\.stopPropagation\(\)/, "le redimensionnement ne doit pas déclencher le glisser-déposer natif de réordonnancement de la colonne");

  const hook = await readFile(new URL("../src/features/planning/hooks/useWorkshopViewPreferences.ts", import.meta.url), "utf8");
  assert.match(hook, /resizeColumn/);

  const view = await readFile(new URL("../src/features/planning/components/PlanningWorkshopView.tsx", import.meta.url), "utf8");
  assert.match(view, /columnWidths=\{preferences\.state\.columnWidths\}/);
  assert.match(view, /onResizeColumn=\{preferences\.resizeColumn\}/);
});

test("la priorité est modifiable dans l'Atelier et se propage au Cockpit ERP via le bus de données partagé", async () => {
  const row = await readFile(new URL("../src/features/planning/components/WorkshopOperationRow.tsx", import.meta.url), "utf8");
  const hook = await readFile(new URL("../src/features/planning/hooks/useWorkshopOperations.ts", import.meta.url), "utf8");
  const workspace = await readFile(new URL("../src/features/erp-import/components/ErpPlanningWorkspace.tsx", import.meta.url), "utf8");
  assert.match(row, /type="number"/);
  assert.match(row, /onUpdatePriority/);
  assert.match(hook, /erp-planning-data-bus/);
  assert.match(hook, /notifyErpPlanningDataChanged\(sourceId\.current\)/);
  assert.match(hook, /changedSourceId !== sourceId\.current/);
  assert.match(workspace, /erp-planning-data-bus/);
  assert.match(workspace, /notifyErpPlanningDataChanged\(dataBusSourceId\.current\)/);
  assert.match(workspace, /changedSourceId === dataBusSourceId\.current\) return/);
});

test("buildPlanningView bascule entre OF de démonstration et opérations ERP selon hasActiveImport, sans jamais les mélanger", () => {
  const testDepartments = [{ id: "dept-1", value: "usinage", label: "Usinage", color: "", textColor: "", active: true, order: 0 }];
  const testMachines = [{ id: "m1", active: true, visible: true, deleted: false, name: "M1", displayName: "M1", department: "Usinage", departmentId: "dept-1", machineType: "", color: "", order: 0, technicalInformation: "" }];
  const settings = {
    production: {
      machines: testMachines,
      departments: testDepartments,
      capacities: [],
      statuses: [],
      priorities: [],
      taskTypes: [],
      maintenanceTypes: [],
      maintenanceStatuses: [],
      planning: { allDepartmentsLabel: "Tous", defaultCapacityHours: 8, workingDays: [1, 2, 3, 4, 5], weekStartsOn: 1, visibleWeeks: 1, loadWarningPercent: 80, loadCriticalPercent: 100 },
    },
    theme: { success: "#0a0", warning: "#fa0", danger: "#a00", card: "#fff", text: "#000", information: "#00a" },
  };
  const data = { machines: [], workOrders: [], planning: [], maintenance: [] };
  const testOperations = [{ id: "op-erp-1", workOrderId: "OF-9", machineId: "m1", plannedDate: "2026-07-20", plannedDurationHours: 8, effectiveStatus: "in-progress", effectivePriority: 5, comment: null, articleCode: "A1", description: "desc", operationNumber: 1, dueDate: null, workOrder: null }];

  const withErp = buildPlanningView(data, settings, testOperations, true);
  assert.equal(withErp.blocks.length, 1);
  assert.equal(withErp.blocks[0].source, "erp-operation");
  assert.equal(withErp.blocks[0].machineId, "m1");
  assert.equal(withErp.blocks[0].date, "2026-07-20");
  assert.equal(withErp.blocks[0].durationHours, 8, "le bloc reprend le temps prévu local initialisé à 8 h");

  const withoutErp = buildPlanningView(data, settings, testOperations, false);
  assert.equal(withoutErp.blocks.length, 0, "sans import actif, les opérations ERP ne s'affichent pas et aucun OF de démonstration n'existe dans ce jeu de test");

  // Demandé par l'utilisateur : une opération terminée dans un futur export ERP ne doit plus apparaître dans Planning capacité.
  const completedOperation = { ...testOperations[0], id: "op-erp-2", effectiveStatus: "completed" };
  const withCompleted = buildPlanningView(data, settings, [completedOperation], true);
  assert.equal(withCompleted.blocks.length, 0, "une opération terminée ne doit plus générer de bloc dans le planning au jour le jour");
});

test("sumDurationHours ignore les durées inconnues sans les fabriquer à 0 mêlé silencieusement ; countUnknownDurationBlocks les recense", () => {
  const blocks = [{ durationHours: 2 }, { durationHours: null }, { durationHours: 3.5 }];
  assert.equal(sumDurationHours(blocks), 5.5);
  assert.equal(countUnknownDurationBlocks(blocks), 1);
});

test("le déplacement d'un OF ERP dans Planning capacité écrit machineId et plannedDate via la même route que l'Atelier", async () => {
  const hook = await readFile(new URL("../src/features/planning/hooks/useWorkshopOperations.ts", import.meta.url), "utf8");
  const planningModule = await readFile(new URL("../src/features/planning/components/PlanningModule.tsx", import.meta.url), "utf8");
  assert.match(hook, /const updatePlacement = useCallback\(async \(operationId: string, placement: \{ machineId: string; plannedDate: string \}\)/);
  assert.match(planningModule, /updatePlacement\(moveTarget\.block\.operationView\.id, \{ machineId, plannedDate: date \}\)/);
});

test("Planning capacité masque les OF de démonstration dès qu'un import ERP est actif", async () => {
  const planningModule = await readFile(new URL("../src/features/planning/components/PlanningModule.tsx", import.meta.url), "utf8");
  const view = await readFile(new URL("../src/features/planning/services/planning-view.ts", import.meta.url), "utf8");
  assert.match(planningModule, /useErpImportActive/);
  assert.match(planningModule, /buildPlanningView\(data, settings, allRows, hasActiveImport\)/);
  assert.match(view, /hasActiveImport \? erpOperationBlocks : planningBlocks/);
});

test("Planning capacité utilise le temps prévu local modifiable de l'Atelier", async () => {
  const planningView = await readFile(new URL("../src/features/planning/services/planning-view.ts", import.meta.url), "utf8");
  const card = await readFile(new URL("../src/features/planning/components/PlanningCard.tsx", import.meta.url), "utf8");
  const row = await readFile(new URL("../src/features/planning/components/MachinePlanningRow.tsx", import.meta.url), "utf8");
  assert.match(planningView, /durationHours: operation\.plannedDurationHours/);
  assert.match(card, /block\.durationHours\.toLocaleString\("fr-BE"\)/);
  assert.match(row, /sumDurationHours/);
});

test("l'Atelier initialise le temps prévu à 8 h et permet son édition inline durable", async () => {
  const operationView = await readFile(new URL("../src/features/erp-import/services/operation-view-service.ts", import.meta.url), "utf8");
  const row = await readFile(new URL("../src/features/planning/components/WorkshopOperationRow.tsx", import.meta.url), "utf8");
  const hook = await readFile(new URL("../src/features/planning/hooks/useWorkshopOperations.ts", import.meta.url), "utf8");
  const route = await readFile(new URL("../src/app/api/erp/operations/[id]/route.ts", import.meta.url), "utf8");
  assert.match(operationView, /plannedDurationHours: decision\?\.plannedDurationHours \?\? 8/);
  assert.match(row, /onUpdateDuration\(operation\.id, value\)/);
  assert.match(hook, /\{ plannedDurationHours \}/);
  assert.match(route, /patch\.plannedDurationHours = nullableDuration/);
});

test("reorderOperationIds déplace un identifiant juste avant sa cible sans perdre ni dupliquer d'entrée", () => {
  const ids = ["a", "b", "c", "d"];
  assert.deepEqual(reorderOperationIds(ids, "d", "b"), ["a", "d", "b", "c"]);
  assert.deepEqual(reorderOperationIds(ids, "a", "c"), ["b", "c", "a", "d"]);
  assert.deepEqual(reorderOperationIds(ids, "a", "a"), ids, "cible identique à la source : aucun changement");
  assert.deepEqual(reorderOperationIds(ids, "inconnu", "b"), ids, "identifiant absent : aucun changement");
});

test("le glisser-déposer d'une opération recalcule la priorité de tout ce qui a bougé, via la même route que l'édition manuelle", async () => {
  const hook = await readFile(new URL("../src/features/planning/hooks/useWorkshopOperations.ts", import.meta.url), "utf8");
  const panel = await readFile(new URL("../src/features/planning/components/WorkshopMachinePanel.tsx", import.meta.url), "utf8");
  const row = await readFile(new URL("../src/features/planning/components/WorkshopOperationRow.tsx", import.meta.url), "utf8");
  assert.match(hook, /const reorderOperations = useCallback\(async \(orderedOperationIds: string\[\]\)/);
  assert.match(hook, /patchOperationRemote\(entry\.id, \{ priority: entry\.priority \}/);
  assert.match(panel, /reorderOperationIds/);
  assert.match(row, /draggable=\{!busy\}/);
  assert.match(row, /WORKSHOP_OPERATION_DRAG_MIME_TYPE/);
});

test("la réaffectation de machine passe par la même route PATCH que le Cockpit ERP (champ machineId)", async () => {
  const hook = await readFile(new URL("../src/features/planning/hooks/useWorkshopOperations.ts", import.meta.url), "utf8");
  const row = await readFile(new URL("../src/features/planning/components/WorkshopOperationRow.tsx", import.meta.url), "utf8");
  assert.match(hook, /const updateMachine = useCallback\(async \(operationId: string, machineId: string \| null\)/);
  assert.match(hook, /patchOneOptimistically\(operationId, \{ machineId \}/);
  assert.match(row, /WorkshopMachinePicker/);
  assert.match(row, /onUpdateMachine/);
  const picker = await readFile(new URL("../src/features/planning/components/WorkshopMachinePicker.tsx", import.meta.url), "utf8");
  assert.match(picker, /Sans machine définie/);
  assert.match(picker, /onClick=\{\(\) => select\(null\)\}/);
});

test("le statut d'une opération se modifie directement dans l'Atelier, via la même route PATCH que la machine et la priorité", async () => {
  const hook = await readFile(new URL("../src/features/planning/hooks/useWorkshopOperations.ts", import.meta.url), "utf8");
  assert.match(hook, /const updateStatus = useCallback\(async \(operationId: string, status: OperationView\["status"\]\)/);
  assert.match(hook, /patchOneOptimistically\(operationId, \{ status \}/);
  assert.match(hook, /return \{ rows, allRows, isLoading, isMutating, error, refresh: load, updatePriority, updateMachine, updateStatus, updateDuration, updatePlacement, reorderOperations, renumberOperations \};/);

  // Propagation par props à travers les quatre couches, comme onUpdateMachine.
  const view = await readFile(new URL("../src/features/planning/components/PlanningWorkshopView.tsx", import.meta.url), "utf8");
  assert.match(view, /onUpdateStatus={updateStatus}/);
  const section = await readFile(new URL("../src/features/planning/components/WorkshopDepartmentSection.tsx", import.meta.url), "utf8");
  assert.match(section, /onUpdateStatus: \(operationId: string, status: OperationView\["status"\]\) => void;/);
  const panel = await readFile(new URL("../src/features/planning/components/WorkshopMachinePanel.tsx", import.meta.url), "utf8");
  assert.match(panel, /onUpdateStatus: \(operationId: string, status: OperationView\["status"\]\) => void;/);

  const row = await readFile(new URL("../src/features/planning/components/WorkshopOperationRow.tsx", import.meta.url), "utf8");
  assert.match(row, /if \(columnId === "status"\) return <select className={`\$\{compactFieldClass\} w-full`} value={operation\.effectiveStatus} disabled={busy} onChange={\(event\) => onUpdateStatus\(operation\.id, event\.target\.value as OperationView\["status"\]\)}>/, "la colonne Statut n'est plus un badge en lecture seule");
  assert.doesNotMatch(row, /if \(columnId === "status"\) return <StatusPill/, "l'ancien affichage en lecture seule a bien disparu");
});

test("le sélecteur de machine propose une recherche par nom et une vignette photo issue du Parc Machines", async () => {
  const picker = await readFile(new URL("../src/features/planning/components/WorkshopMachinePicker.tsx", import.meta.url), "utf8");
  assert.match(picker, /useMachinePhotos/);
  assert.match(picker, /Rechercher une machine/);
  assert.match(picker, /displayName\.toLocaleLowerCase\("fr"\)\.includes\(normalized\)/);
});

test("le Workspace Planning garde Cockpit ERP et Planning capacité inchangés en ajoutant l'Atelier", async () => {
  const workspace = await readFile(new URL("../src/features/planning/components/PlanningWorkspace.tsx", import.meta.url), "utf8");
  assert.match(workspace, /<ErpPlanningWorkspace \/>/);
  assert.match(workspace, /<PlanningModule \/>/);
  assert.match(workspace, /<PlanningWorkshopView \/>/);
});
