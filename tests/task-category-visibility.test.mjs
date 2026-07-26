import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { getTaskCategoryLabel, TASK_CATEGORY_CODES, TASK_CATEGORY_LABELS, UNKNOWN_TASK_CATEGORY_LABEL } from "../src/lib/task-category-dictionary.ts";
import { applyTaskCategoryVisibility } from "../src/features/erp-import/services/task-category-visibility.ts";

function op(id, taskCode) {
  return { id, taskCode };
}

test("le dictionnaire des catégories de tâche couvre les codes fournis, triés numériquement, sans les codes 1 et 2 non confirmés", () => {
  assert.equal(TASK_CATEGORY_LABELS["0"], "Non défini");
  assert.equal(TASK_CATEGORY_LABELS["5"], "Tournage");
  assert.equal(TASK_CATEGORY_LABELS["27"], "Fraisage");
  assert.equal(TASK_CATEGORY_LABELS["37"], "Rectification plane");
  assert.equal(TASK_CATEGORY_LABELS["40"], "Combiné Laser-poinçonnage");
  assert.equal(TASK_CATEGORY_LABELS["42"], "Réception marchandises");
  assert.equal(TASK_CATEGORY_LABELS["1"], undefined, "le code 1 n'a pas encore de signification confirmée");
  assert.equal(TASK_CATEGORY_LABELS["2"], undefined, "le code 2 n'a pas encore de signification confirmée");
  assert.deepEqual(TASK_CATEGORY_CODES.slice(0, 3), ["0", "3", "4"], "tri numérique : pas de \"10\" avant \"3\"");
  assert.equal(TASK_CATEGORY_CODES.length, 41);
});

test("getTaskCategoryLabel retombe sur un libellé générique pour un code inconnu (1, 2, ou tout futur code inattendu), sans inventer de texte", () => {
  assert.equal(getTaskCategoryLabel("5"), "Tournage");
  assert.equal(getTaskCategoryLabel("1"), UNKNOWN_TASK_CATEGORY_LABEL);
  assert.equal(getTaskCategoryLabel("999"), UNKNOWN_TASK_CATEGORY_LABEL);
});

test("applyTaskCategoryVisibility masque tout par défaut (liste vide), à l'inverse des autres filtres où une liste vide veut dire \"aucune restriction\"", () => {
  const operations = [op("a", "5"), op("b", "27"), op("c", "0")];
  assert.deepEqual(applyTaskCategoryVisibility(operations, []), []);
});

test("applyTaskCategoryVisibility ne garde que les opérations dont le code de catégorie est explicitement rendu visible", () => {
  const operations = [op("a", "5"), op("b", "27"), op("c", "0"), op("d", "5")];
  assert.deepEqual(applyTaskCategoryVisibility(operations, ["5"]).map((entry) => entry.id), ["a", "d"]);
  assert.deepEqual(applyTaskCategoryVisibility(operations, ["5", "27"]).map((entry) => entry.id), ["a", "b", "d"]);
  assert.deepEqual(applyTaskCategoryVisibility(operations, TASK_CATEGORY_CODES).length, operations.filter((entry) => entry.taskCode !== undefined).length);
});

test("applyTaskCategoryVisibility masque aussi les codes inconnus (1, 2, ou tout code hors dictionnaire) tant qu'ils ne sont pas explicitement rendus visibles", () => {
  const operations = [op("a", "1"), op("b", "5")];
  assert.deepEqual(applyTaskCategoryVisibility(operations, []).map((entry) => entry.id), []);
  assert.deepEqual(applyTaskCategoryVisibility(operations, ["1"]).map((entry) => entry.id), ["a"]);
});

test("le réglage visibleTaskCategoryCodes est vide par défaut (toutes les catégories masquées), sur toute la production", async () => {
  const defaults = await readFile(new URL("../src/features/settings/config/default-settings.ts", import.meta.url), "utf8");
  assert.match(defaults, /visibleTaskCategoryCodes: \[\]/);
});

test("le gate de visibilité par catégorie est appliqué dans les deux seuls points de chargement client des opérations ERP (useWorkshopOperations et ErpPlanningWorkspace), donc partout où l'Atelier/Capacité/OF/Cockpit ERP les consomment", async () => {
  const hook = await readFile(new URL("../src/features/planning/hooks/useWorkshopOperations.ts", import.meta.url), "utf8");
  assert.match(hook, /const allRows = useMemo\(\(\) => reconcileOperationViewMachineCatalog\(rawRows, machines\), \[rawRows, machines\]\);/);
  assert.match(hook, /const rows = useMemo\(\(\) => applyTaskCategoryVisibility\(allRows, visibleTaskCategoryCodes\), \[allRows, visibleTaskCategoryCodes\]\);/);

  const workspace = await readFile(new URL("../src/features/erp-import/components/ErpPlanningWorkspace.tsx", import.meta.url), "utf8");
  assert.match(workspace, /const rows = useMemo\(\(\) => reconciledRows \? applyTaskCategoryVisibility\(reconciledRows, visibleTaskCategoryCodes\) : null, \[reconciledRows, visibleTaskCategoryCodes\]\);/, "le Cockpit ERP sépare aussi réconciliation (rare) et filtrage catégorie (fréquent), comme useWorkshopOperations");
  assert.match(workspace, /const loadRows = useCallback\(async \(\) => \{\s*\n\s*const nextRows = await fetchErpPlanningRows\(\);\s*\n\s*setReconciledRows\(reconcileOperationViewMachineCatalog\(nextRows, machines\)\);\s*\n\s*\}, \[machines\]\);/, "loadRows ne doit plus dépendre de visibleTaskCategoryCodes : changer de catégorie ne doit jamais redéclencher un fetch/reconciliation complet pendant que ce cockpit reste monté en arrière-plan");

  const capacityModule = await readFile(new URL("../src/features/planning/components/PlanningModule.tsx", import.meta.url), "utf8");
  assert.match(capacityModule, /useWorkshopOperations\(settings\.production\.machines, visibleTaskCategoryCodes\)/, "Planning capacité hérite du masquage via le même hook, sans logique dupliquée");

  const workOrdersModule = await readFile(new URL("../src/features/work-orders/components/WorkOrdersModule.tsx", import.meta.url), "utf8");
  assert.match(workOrdersModule, /useWorkshopOperations\(machines, visibleTaskCategoryCodes\)/, "le module OF hérite du masquage via le même hook, sans logique dupliquée");
});

test("le réglage « catégories visibles » vit dans son propre store dédié (pas dans les Réglages partagés), pour que le changer ne clone/réécrive jamais tout l'arbre AppSettings à chaque changement (ex. un clic d'onglet de département dans l'Atelier)", async () => {
  const store = await readFile(new URL("../src/lib/visible-task-categories-store.ts", import.meta.url), "utf8");
  assert.match(store, /export function useVisibleTaskCategoryCodes\(\): string\[\]/);
  assert.match(store, /export function setVisibleTaskCategoryCodes\(codes: string\[\]\): void/);
  assert.match(store, /migrateFromLegacySettings/, "migre automatiquement l'ancienne valeur déjà enregistrée par un utilisateur existant, une seule fois");

  for (const file of [
    "../src/features/planning/components/PlanningWorkshopView.tsx",
    "../src/features/planning/components/PlanningModule.tsx",
    "../src/features/work-orders/components/WorkOrdersModule.tsx",
    "../src/features/erp-import/components/ErpPlanningWorkspace.tsx",
  ]) {
    const source = await readFile(new URL(file, import.meta.url), "utf8");
    assert.match(source, /from "@\/lib\/visible-task-categories-store"/, `${file} doit lire/écrire ce réglage via le store dédié`);
    assert.doesNotMatch(source, /production\.visibleTaskCategoryCodes/, `${file} ne doit plus lire/écrire settings.production.visibleTaskCategoryCodes (champ conservé uniquement pour la compatibilité des anciennes sauvegardes)`);
  }
});

test("le contrôle Catégories reste partagé (dictionnaire + champs) entre le Cockpit ERP et le crayon (✎) de département de l'Atelier, sans dupliquer la liste des 41 catégories", async () => {
  const control = await readFile(new URL("../src/features/erp-import/components/TaskCategoryVisibilityControl.tsx", import.meta.url), "utf8");
  assert.match(control, /TASK_CATEGORY_CODES, TASK_CATEGORY_LABELS/);
  assert.match(control, /export function TaskCategoryVisibilityFields/, "les champs (recherche + liste à cocher) sont exportés séparément du bouton/popover, pour être embarqués ailleurs sans dupliquer la liste des 41 catégories");

  // L'Atelier n'a plus aucun réglage « catégories visibles » dans son menu Filtres : à la demande explicite de
  // l'utilisateur, un seul endroit les configure — le crayon (✎) de chaque département — pour ne jamais avoir
  // deux réglages qui peuvent diverger silencieusement (ex. une catégorie liée à un département mais jamais
  // rendue visible dans l'ancien second réglage, masquant ses OF partout dans l'Atelier sans erreur visible).
  const workshopFilters = await readFile(new URL("../src/features/planning/components/WorkshopFilters.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(workshopFilters, /TaskCategoryVisibilityFields/, "plus aucun réglage catégories dans le menu Filtres de l'Atelier");
  assert.doesNotMatch(workshopFilters, /<TaskCategoryVisibilityControl /, "plus de bouton Catégories séparé dans l'Atelier");
  assert.doesNotMatch(workshopFilters, /visibleTaskCategoryCodes/, "WorkshopFilters ne reçoit plus ce réglage du tout, il n'en a plus l'usage");

  // Le crayon (✎) de département (DepartmentLinksDialog) reste l'unique endroit, dans l'Atelier, où l'on choisit les catégories.
  const dialog = await readFile(new URL("../src/features/planning/components/DepartmentLinksDialog.tsx", import.meta.url), "utf8");
  assert.match(dialog, /TASK_CATEGORY_CODES, TASK_CATEGORY_LABELS/, "réutilise le même dictionnaire partagé, jamais une copie locale");

  // Cockpit ERP et Planning capacité gardent leur propre bouton séparé, inchangé (hors périmètre de l'Atelier).
  const filterPanel = await readFile(new URL("../src/features/erp-import/components/PlanningFilterPanel.tsx", import.meta.url), "utf8");
  assert.match(filterPanel, /<TaskCategoryVisibilityControl visibleTaskCategoryCodes={visibleTaskCategoryCodes} onChange={onChangeVisibleTaskCategoryCodes} \/>/);
});
