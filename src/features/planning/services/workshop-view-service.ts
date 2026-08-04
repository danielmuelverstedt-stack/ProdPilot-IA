import { filterEngine } from "../../erp-import/services/filter-engine.ts";
import { groupErpPlanningRows } from "../../erp-import/services/erp-planning-grouping.ts";
import { emptyPlanningFilters } from "../../erp-import/services/erp-planning-view-preferences.ts";
import { groupMachinesByTaskCategory } from "../../../lib/task-category-grouping.ts";
import type { OperationView } from "@/features/erp-import/types/erp-import";
import type { DepartmentSettings, MachineSettings } from "@/features/settings/types/settings";
import type { WorkshopDepartmentGroup, WorkshopFilterState, WorkshopMachineGroup, WorkshopMachineLoadSummary, WorkshopSortState } from "@/features/planning/types/workshop-view";

const UNASSIGNED_DEPARTMENT_ID = "unassigned";

/** Regroupe les opérations déjà filtrées (recherche + articles) par machine, quel que soit le mode de regroupement des sections (département ou catégorie). */
export function groupOperationsByMachineId(rows: OperationView[], machines: MachineSettings[], filters: WorkshopFilterState): { byMachineId: Map<string, OperationView[]>; unassigned: OperationView[] } {
  const searchFiltered = filterEngine.apply(rows, { ...emptyPlanningFilters(), search: filters.search, articleMultiplicity: filters.articleMultiplicity });
  // Une opération terminée n'a plus sa place dans le planning au jour le jour (demande explicite de
  // l'utilisateur) — elle reste néanmoins visible dans le module OF, qui ne passe pas par cette
  // fonction, et dans le Cockpit ERP, non plus concerné par ce filtre.
  const activeRows = searchFiltered.filter((operation) => operation.effectiveStatus !== "completed");
  const machineGroups = groupErpPlanningRows(activeRows, "machine", machines);
  const byMachineId = new Map<string, OperationView[]>();
  let unassigned: OperationView[] = [];
  machineGroups.forEach((group) => {
    const machineId = group.id.startsWith("machine:") ? group.id.slice("machine:".length) : null;
    if (!machineId || machineId === "unmapped") unassigned = group.rows;
    else byMachineId.set(machineId, group.rows);
  });
  return { byMachineId, unassigned };
}

/**
 * Regroupe les opérations par département puis par machine, à partir des seules sources
 * autorisées (OperationView, MachineSettings, DepartmentSettings). Réutilise le moteur de
 * filtres et le regroupement par machine déjà utilisés par le Cockpit ERP : aucune règle de
 * filtrage ou de correspondance machine n'est redéfinie ici.
 */
export function buildWorkshopDepartments(rows: OperationView[], machines: MachineSettings[], departments: DepartmentSettings[], filters: WorkshopFilterState, sort: WorkshopSortState): WorkshopDepartmentGroup[] {
  const { byMachineId: operationsByMachineId, unassigned: unassignedOperations } = groupOperationsByMachineId(rows, machines, filters);

  const orderedDepartments = [...departments].filter((department) => department.active).sort((a, b) => a.order - b.order);
  const sections: WorkshopDepartmentGroup[] = [];

  orderedDepartments.forEach((department) => {
    if (filters.departments.length && !filters.departments.includes(department.id)) return;
    const departmentMachineGroups = machines
      .filter((machine) => machine.departmentId === department.id && !machine.deleted && matchesMachineStatus(machine, filters))
      .sort((a, b) => a.order - b.order)
      .map((machine) => toMachineGroup(machine, operationsByMachineId.get(machine.id) ?? [], sort))
      .filter((group) => filters.showMachinesWithoutOperations || group.operationCount > 0);
    if (departmentMachineGroups.length) sections.push({ id: department.id, label: department.label, machines: departmentMachineGroups });
  });

  if (unassignedOperations.length && !filters.departments.length) {
    sections.push({ id: UNASSIGNED_DEPARTMENT_ID, label: "Atelier non défini", machines: [toMachineGroup(null, unassignedOperations, sort)] });
  }

  return sections;
}

/**
 * Section « Opérations sans machine » d'un département en mode `"physical"` (Tournage, Fraisage,
 * Découpe fil). Une opération sans machine assignée n'a pas de département physique connu — elle
 * ne peut jamais correspondre à un `machine.departmentId` puisqu'il n'y a pas de machine. Sa seule
 * façon de rejoindre le bon onglet est sa propre catégorie de tâche ERP (`operation.taskCode`),
 * comparée aux catégories associées au département (`linkedCategoryCodes`, configurées depuis le
 * ✎ de l'onglet) : sans cette association, un OF de cette catégorie pas encore affecté à une
 * machine physique resterait invisible partout dans l'Atelier. Toujours en premier dans l'onglet,
 * comme pour les départements en mode `"linked"` (`buildWorkshopCategories`).
 */
export function buildUnassignedOperationsSection(rows: OperationView[], machines: MachineSettings[], department: DepartmentLinks, filters: WorkshopFilterState, sort: WorkshopSortState): WorkshopDepartmentGroup | null {
  const linkedCategoryCodes = department.linkedCategoryCodes ?? [];
  if (!linkedCategoryCodes.length) return null;
  const { unassigned } = groupOperationsByMachineId(rows, machines, filters);
  const operations = unassigned.filter((operation) => linkedCategoryCodes.includes(operation.taskCode));
  if (!operations.length) return null;
  return { id: UNASSIGNED_DEPARTMENT_ID, label: "Opérations sans machine", machines: [toMachineGroup(null, operations, sort)] };
}

/**
 * Regroupe les sections par catégorie de tâche, sur le même réglage partagé
 * `visibleTaskCategoryCodes` que le contrôle « Catégories » déjà utilisé pour filtrer les
 * opérations — indépendant du département physique de la machine (`MachineSettings.departmentId`).
 * Une machine appartient à une catégorie visible si sa fiche le déclare (`taskCategoryCode`, pour
 * qu'une machine sans encore aucune opération reste planifiable) **ou** si elle porte au moins une
 * opération de cette catégorie (`operation.taskCode`), même si sa fiche n'a jamais été taguée — une
 * machine mappée à un code ERP mais dont la fiche n'a pas été mise à jour ne doit jamais faire
 * disparaître ses OF. `directlyLinkedMachineIds` ajoute une section supplémentaire « Machines liées
 * directement » pour les machines rattachées individuellement à un département (ex. une machine
 * « Non catégorisée ») sans dupliquer celles déjà visibles via une catégorie. Une machine/poste sans
 * opération reste affiché si `showMachinesWithoutOperations` — c'est ce qui permet à un poste de
 * travail sans ERP mappé (ex. Ébavurage) d'être planifiable dès sa création, avant même d'avoir une
 * opération dessus. Une opération de catégorie visible mais sans machine assignée n'est pas perdue
 * pour autant : elle atterrit dans une ligne « Machine non définie » à l'intérieur de la section de
 * sa propre catégorie (toujours en premier dans cette section), et non plus dans un panier unique
 * partagé par toutes les catégories visibles — sans quoi un département avec plusieurs catégories
 * mais aucune machine/poste encore rattaché voyait tous ses OF mélangés dans un seul planning au
 * lieu de rester séparés catégorie par catégorie, chacune restant un planning distinct.
 */
export function buildWorkshopCategories(rows: OperationView[], machines: MachineSettings[], filters: WorkshopFilterState, sort: WorkshopSortState, visibleTaskCategoryCodes: string[], directlyLinkedMachineIds: string[] = []): WorkshopDepartmentGroup[] {
  const { byMachineId: operationsByMachineId, unassigned: unassignedOperations } = groupOperationsByMachineId(rows, machines, filters);
  const eligibleMachines = machines.filter((machine) => !machine.deleted && matchesMachineStatus(machine, filters));
  const categoryGroups = groupMachinesByTaskCategory(eligibleMachines, visibleTaskCategoryCodes);

  const sections: WorkshopDepartmentGroup[] = [];

  // Les OF sans machine assignée sont répartis par leur propre code catégorie (pas un panier unique
  // partagé par toutes les catégories visibles), pour que chaque catégorie reste son propre planning
  // même tant qu'aucune machine/poste ne lui est encore rattaché.
  const unassignedOperationsByTaskCode = new Map<string, OperationView[]>();
  unassignedOperations.forEach((operation) => {
    if (!visibleTaskCategoryCodes.includes(operation.taskCode)) return;
    const list = unassignedOperationsByTaskCode.get(operation.taskCode) ?? [];
    list.push(operation);
    unassignedOperationsByTaskCode.set(operation.taskCode, list);
  });

  // Construit une seule fois (pas une fois par catégorie visible) l'ensemble des codes catégorie réellement portés par les opérations de chaque machine.
  const categoryCodesByMachineId = new Map<string, Set<string>>();
  operationsByMachineId.forEach((operations, machineId) => {
    categoryCodesByMachineId.set(machineId, new Set(operations.map((operation) => operation.taskCode)));
  });

  sections.push(...categoryGroups
    .map((group) => {
      const declaredMachineIds = new Set(group.machines.map((machine) => machine.id));
      // Machines dont la fiche n'est pas (ou plus) taguée sur cette catégorie, mais qui portent déjà une opération de cette catégorie : à afficher quand même, plutôt que de perdre silencieusement des OF réels derrière un tag manuel désynchronisé.
      const machinesFromOperations = group.code
        ? eligibleMachines.filter((machine) => !declaredMachineIds.has(machine.id) && categoryCodesByMachineId.get(machine.id)?.has(group.code!))
        : [];
      const categoryMachines = [...group.machines, ...machinesFromOperations].sort((a, b) => a.order - b.order);
      // Toujours en premier dans la section de sa catégorie : les OF de cette catégorie qui n'ont pas encore de machine assignée — sauf s'il n'existe qu'une seule machine/poste candidat pour
      // cette catégorie, auquel cas ils la rejoignent directement plutôt que de rester dans une ligne « Machine non définie » séparée, alors qu'aucune autre machine ne pourrait les recevoir de
      // toute façon. Affichage uniquement : l'opération reste sans machine assignée dans les données (son propre sélecteur Machine le montre toujours), rien n'est écrit silencieusement.
      const categoryUnassignedOperations = group.code ? unassignedOperationsByTaskCode.get(group.code) ?? [] : [];
      const soleMachine = categoryMachines.length === 1 ? categoryMachines[0] : null;
      const machineGroups = categoryMachines
        .map((machine) => {
          const ownOperations = operationsByMachineId.get(machine.id) ?? [];
          const operations = machine === soleMachine && categoryUnassignedOperations.length ? [...ownOperations, ...categoryUnassignedOperations] : ownOperations;
          return toMachineGroup(machine, operations, sort);
        })
        .filter((entry) => filters.showMachinesWithoutOperations || entry.operationCount > 0);
      if (categoryUnassignedOperations.length && !soleMachine) machineGroups.unshift(toMachineGroup(null, categoryUnassignedOperations, sort));
      return { id: group.code ?? "none", label: group.label, machines: machineGroups };
    })
    .filter((section) => section.machines.length));

  if (directlyLinkedMachineIds.length) {
    const alreadyShown = new Set(sections.flatMap((section) => section.machines.map((entry) => entry.machine?.id).filter((id): id is string => Boolean(id))));
    const directMachines = eligibleMachines
      .filter((machine) => directlyLinkedMachineIds.includes(machine.id) && !alreadyShown.has(machine.id))
      .sort((a, b) => a.order - b.order)
      .map((machine) => toMachineGroup(machine, operationsByMachineId.get(machine.id) ?? [], sort))
      .filter((entry) => filters.showMachinesWithoutOperations || entry.operationCount > 0);
    if (directMachines.length) sections.push({ id: "direct", label: "Machines liées directement", machines: directMachines });
  }

  return sections;
}

export interface DepartmentOperationIndex {
  /** Nombre total d'OF par machine, toutes catégories confondues. */
  operationCountByMachineId: Map<string, number>;
  /** Pour chaque code catégorie, l'ensemble des machines qui portent au moins une opération de cette catégorie — même quand la fiche machine n'est pas taguée sur cette catégorie (voir buildWorkshopCategories, même règle). */
  machineIdsByTaskCode: Map<string, Set<string>>;
  /** Pour chaque code catégorie, le nombre d'OF de cette catégorie qui n'ont encore aucune machine assignée. */
  unassignedOperationCountByTaskCode: Map<string, number>;
}

/**
 * Précalcule en un seul passage sur les opérations chargées tout ce dont le compteur d'OF par
 * onglet a besoin, pour éviter de reparcourir toutes les opérations à chaque département. Doit
 * rester la même règle de rattachement qu'un département utilise réellement pour afficher son
 * contenu (`buildWorkshopCategories`) — sans quoi le compteur d'un onglet peut afficher 0 alors
 * que des OF y sont bien visibles une fois l'onglet ouvert (catégorie liée mais fiche machine pas
 * taguée, ou OF pas encore assigné à une machine).
 */
export function buildDepartmentOperationIndex(rows: OperationView[]): DepartmentOperationIndex {
  const operationCountByMachineId = new Map<string, number>();
  const machineIdsByTaskCode = new Map<string, Set<string>>();
  const unassignedOperationCountByTaskCode = new Map<string, number>();
  // Mêmes opérations terminées exclues qu'à l'affichage réel (groupOperationsByMachineId), sinon le
  // compteur d'un onglet resterait supérieur à ce qui y est effectivement listé.
  rows.filter((row) => row.effectiveStatus !== "completed").forEach((row) => {
    if (row.machineId) {
      operationCountByMachineId.set(row.machineId, (operationCountByMachineId.get(row.machineId) ?? 0) + 1);
      const machineIds = machineIdsByTaskCode.get(row.taskCode) ?? new Set<string>();
      machineIds.add(row.machineId);
      machineIdsByTaskCode.set(row.taskCode, machineIds);
    } else {
      unassignedOperationCountByTaskCode.set(row.taskCode, (unassignedOperationCountByTaskCode.get(row.taskCode) ?? 0) + 1);
    }
  });
  return { operationCountByMachineId, machineIdsByTaskCode, unassignedOperationCountByTaskCode };
}

export interface DepartmentLinks {
  id?: string;
  /** `"physical"` : machines dont la fiche indique ce département (`MachineSettings.departmentId`), sans lien par catégorie. Absent/`"linked"` : règles habituelles (catégories/machines liées). */
  membershipMode?: "physical" | "linked";
  linkedCategoryCodes?: string[];
  linkedMachineIds?: string[];
}

/**
 * Résout l'ensemble des machines rattachées à un département. En mode `"physical"` (départements
 * de production Tournage/Fraisage/Découpe fil) : uniquement les machines dont la fiche indique ce
 * département, indépendamment de toute catégorie — une machine tourno-fraiseuse ne doit jamais
 * apparaître ailleurs que dans son propre département physique sous prétexte qu'elle porte
 * ponctuellement une opération d'une autre catégorie. En mode `"linked"` (par défaut, ex.
 * Qualité/Maintenance qui n'ont structurellement aucune machine physiquement rattachée) : machines
 * taguées, liées directement, ou juste porteuses d'une opération de la catégorie même sans être
 * taguées — même règle que `buildWorkshopCategories`. Partagé par `countDepartmentOperations`
 * (compteur des onglets) et par l'aperçu en direct de la modale de création/édition, pour ne jamais
 * avoir deux implémentations de la même règle qui pourraient diverger.
 */
export function resolveDepartmentMachineIds(index: DepartmentOperationIndex, machines: MachineSettings[], department: DepartmentLinks): Set<string> {
  if (department.membershipMode === "physical") {
    return new Set(machines.filter((machine) => !machine.deleted && machine.departmentId === department.id).map((machine) => machine.id));
  }
  const linkedCategoryCodes = department.linkedCategoryCodes ?? [];
  const linkedMachineIds = new Set(department.linkedMachineIds ?? []);
  const linkedCategoryCodeSet = new Set(linkedCategoryCodes);
  const relevantMachineIds = new Set(
    machines
      .filter((machine) => !machine.deleted && (linkedMachineIds.has(machine.id) || (machine.taskCategoryCode ? linkedCategoryCodeSet.has(machine.taskCategoryCode) : false)))
      .map((machine) => machine.id),
  );
  linkedCategoryCodes.forEach((code) => {
    index.machineIdsByTaskCode.get(code)?.forEach((machineId) => relevantMachineIds.add(machineId));
  });
  return relevantMachineIds;
}

/**
 * Compteur d'OF d'un département, avec exactement les mêmes règles de rattachement que
 * `buildWorkshopCategories`/`buildWorkshopDepartments` selon le mode — coût proportionnel au
 * nombre de machines/catégories du département, pas au nombre total d'opérations. Les OF sans
 * machine assignée comptent dans les deux modes dès lors que leur catégorie est liée au
 * département : en mode `"physical"`, c'est même leur seule façon d'être rattachés (voir
 * `buildUnassignedOperationsSection`), puisqu'ils n'ont pas de `departmentId` à comparer.
 */
export function countDepartmentOperations(index: DepartmentOperationIndex, machines: MachineSettings[], department: DepartmentLinks): number {
  const relevantMachineIds = resolveDepartmentMachineIds(index, machines, department);
  let total = 0;
  relevantMachineIds.forEach((machineId) => { total += index.operationCountByMachineId.get(machineId) ?? 0; });
  (department.linkedCategoryCodes ?? []).forEach((code) => { total += index.unassignedOperationCountByTaskCode.get(code) ?? 0; });
  return total;
}

/**
 * Diagnostic pour un département en mode `"physical"` sans aucune machine : détecte les machines
 * dont la fiche affiche encore le bon libellé (`machine.department`, texte figé au dernier
 * enregistrement) mais dont le vrai lien (`machine.departmentId`) ne pointe plus vers ce
 * département — cas typique d'un département supprimé puis recréé (même nom, nouvel identifiant)
 * via l'éditeur générique de Réglages → Production → Départements, qui ne vérifie pas les machines
 * encore rattachées. Sans ce correctif, la machine semble « bien en Fraisage » dans le Parc
 * Machines (libellé affiché en repli) alors que le lien réel est rompu, et l'onglet reste vide sans
 * explication.
 */
export function findMachinesWithMismatchedDepartmentLabel(machines: MachineSettings[], department: DepartmentLinks & { label?: string }): MachineSettings[] {
  const label = department.label?.trim().toLocaleLowerCase("fr");
  if (!label) return [];
  return machines.filter((machine) => !machine.deleted && machine.departmentId !== department.id && machine.department.trim().toLocaleLowerCase("fr") === label);
}

export function getMachineLoadSummary(operations: OperationView[]): WorkshopMachineLoadSummary {
  return { operationCount: operations.length, workOrderCount: new Set(operations.map((operation) => operation.workOrderId)).size, hoursAvailable: false };
}

/** Déplace `draggedId` juste avant `targetId` dans la liste ; utilisé par le glisser-déposer des opérations. */
export function reorderOperationIds(orderedIds: string[], draggedId: string, targetId: string): string[] {
  const fromIndex = orderedIds.indexOf(draggedId);
  const toIndex = orderedIds.indexOf(targetId);
  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return orderedIds;
  const next = [...orderedIds];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

/**
 * Trie par priorité effective ou par jours de retard selon la colonne active ; `column: null`
 * conserve l'ordre reçu, sans tri ajouté. Les opérations sans valeur connue (retard sans date)
 * restent en fin de liste plutôt que de recevoir une valeur fabriquée pour les comparer.
 */
export function sortOperations(operations: OperationView[], sort: WorkshopSortState): OperationView[] {
  if (sort.column === "priority") return sortByComparableValue(operations, (operation) => operation.effectivePriority, sort.direction);
  if (sort.column === "delay") return sortByComparableValue(operations, (operation) => operation.delayDays, sort.direction);
  return operations;
}

function sortByComparableValue(operations: OperationView[], getValue: (operation: OperationView) => number | null, direction: "asc" | "desc"): OperationView[] {
  const withValue = operations.filter((operation) => getValue(operation) !== null);
  const withoutValue = operations.filter((operation) => getValue(operation) === null);
  const sorted = [...withValue].sort((a, b) => getValue(a)! - getValue(b)!);
  return [...(direction === "asc" ? sorted : sorted.reverse()), ...withoutValue];
}

function toMachineGroup(machine: MachineSettings | null, operations: OperationView[], sort: WorkshopSortState): WorkshopMachineGroup {
  return { machine, operations: sortOperations(operations, sort), ...getMachineLoadSummary(operations) };
}

function matchesMachineStatus(machine: MachineSettings, filters: WorkshopFilterState): boolean {
  if (!machine.visible && !filters.showMaskedMachines) return false;
  if (machine.active && !filters.showActiveMachines) return false;
  if (!machine.active && !filters.showInactiveMachines) return false;
  return true;
}
