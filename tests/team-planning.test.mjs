import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  addIsoWeeks,
  enumerateIsoMonths,
  enumerateIsoWeeks,
  isoMonthLabel,
  isoWeekDateRangeLabel,
  isoWeekKey,
  isoWeekLabel,
  isoWeekMonthKey,
  isoWeekStart,
} from "../src/features/actions/services/iso-week.ts";
import { migrateDemoData } from "../src/features/demo/services/demo-data-migration.ts";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

// --- iso-week.ts : utilitaires purs, testables directement (aucun import "@/...") ---

test("isoWeekKey place le 1er janvier 2026 (jeudi) en semaine 1 de 2026", () => {
  assert.equal(isoWeekKey(new Date("2026-01-01T00:00:00Z")), "2026-W01");
});

test("isoWeekKey bascule les derniers jours de décembre 2025 (mercredi) sur la semaine 1 de 2026, comme l'exige ISO 8601 (semaine à cheval sur l'année)", () => {
  assert.equal(isoWeekKey(new Date("2025-12-31T00:00:00Z")), "2026-W01");
});

test("isoWeekKey bascule le 1er janvier 2027 (vendredi) sur la dernière semaine de 2026 (année à 53 semaines ISO), pas sur 2027-W01", () => {
  assert.equal(isoWeekKey(new Date("2026-12-31T00:00:00Z")), "2026-W53");
  assert.equal(isoWeekKey(new Date("2027-01-01T00:00:00Z")), "2026-W53");
});

test("isoWeekStart(isoWeekKey(date)) fait toujours l'aller-retour vers le lundi de la même semaine, y compris à cheval sur une année", () => {
  for (const iso of ["2026-01-01", "2025-12-31", "2026-12-31", "2027-01-01", "2026-07-28"]) {
    const key = isoWeekKey(new Date(`${iso}T00:00:00Z`));
    const monday = isoWeekStart(key);
    assert.equal(isoWeekKey(monday), key, `round-trip cassé pour ${iso} → ${key}`);
    assert.equal(monday.getUTCDay(), 1, `isoWeekStart(${key}) doit toujours tomber un lundi`);
  }
});

test("addIsoWeeks avance/recule de façon symétrique, y compris au travers d'un changement d'année", () => {
  assert.equal(addIsoWeeks("2026-W53", 1), "2027-W01", "2026-W53 est la dernière semaine de l'année à 53 semaines ISO ; la suivante est bien 2027-W01");
  const forward = addIsoWeeks("2026-W01", 5);
  assert.equal(addIsoWeeks(forward, -5), "2026-W01");
});

test("isoWeekLabel affiche le numéro sans zéro non significatif, isoWeekMonthKey rattache la semaine au mois de son lundi", () => {
  assert.equal(isoWeekLabel("2026-W05"), "S5");
  assert.equal(isoWeekLabel("2026-W31"), "S31");
  // 2026-W01 : lundi le 29/12/2025 (le 1er janvier 2026 est un jeudi) → rattachée à décembre 2025, pas janvier 2026
  assert.equal(isoWeekMonthKey("2026-W01"), "2025-12");
  // 2026-W53 : lundi le 28/12/2026 → toujours rattachée à décembre 2026, pas à janvier 2027
  assert.equal(isoWeekMonthKey("2026-W53"), "2026-12");
});

test("isoWeekDateRangeLabel couvre exactement 7 jours au format JJ/MM – JJ/MM", () => {
  assert.equal(isoWeekDateRangeLabel("2026-W01"), "29/12 – 04/01");
});

test("isoMonthLabel met une majuscule initiale au libellé du mois en français", () => {
  assert.equal(isoMonthLabel("2026-07"), "Juillet 2026");
});

test("enumerateIsoWeeks/enumerateIsoMonths : suite chronologique sans trou, sans doublon de mois", () => {
  const weeks = enumerateIsoWeeks("2026-W52", 4);
  assert.deepEqual(weeks, ["2026-W52", "2026-W53", "2027-W01", "2027-W02"]);
  const months = enumerateIsoMonths(weeks);
  assert.deepEqual(months, ["2026-12", "2027-01"]);
});

// --- demo-data-migration.ts : import type uniquement (aucun import runtime "@/..."), directement testable ---

function baseV2Payload(overrides = {}) {
  return {
    version: 2,
    actions: [], workOrders: [], planning: [], machines: [], maintenance: [], meetings: [],
    requests: [], erpQuality: [], notifications: [], savContacts: [], consumables: [],
    ...overrides,
  };
}

test("migrateDemoData complète un ancien payload v2 sans « people » ni nouveaux champs d'action, sans jamais réinitialiser les données existantes", () => {
  const legacyAction = { id: "ACT-001", dateEncodage: "2026-01-01", introduitPar: "Daniel", origine: "Manuel", contextLink: null, description: "Ancienne action", responsable: "Marc", echeance: "2026-02-01", statut: "À faire", dateCloture: null, remarque: null };
  const result = migrateDemoData(baseV2Payload({ actions: [legacyAction] }));
  assert.ok(result, "un payload v2 valide sans `people` doit être migré, pas rejeté");
  assert.deepEqual(result.people, [], "aucune personne existante : tableau vide par défaut, pas d'erreur");
  assert.deepEqual(result.actions[0].priority, null);
  assert.deepEqual(result.actions[0].responsableId, null);
  assert.deepEqual(result.actions[0].estimatedHours, null);
  assert.deepEqual(result.actions[0].plannedWeek, null);
  assert.deepEqual(result.actions[0].planningOrder, null);
  assert.equal(result.actions[0].description, "Ancienne action", "les données existantes ne sont jamais perdues par le backfill");
  assert.deepEqual(result.actions[0].contextLinks, [], "l'ancien champ contextLink (singulier, null) devient un tableau vide, pas une erreur");
  assert.deepEqual(result.actions[0].comments, []);
  assert.deepEqual(result.actions[0].history, []);
  assert.deepEqual(result.actions[0].responsableContactId, null);
});

test("migrateDemoData convertit l'ancien contextLink (singulier) déjà renseigné en tableau contextLinks à une seule entrée, sans perdre le lien", () => {
  const legacyAction = { id: "ACT-002", dateEncodage: "2026-01-01", introduitPar: "Daniel", origine: "Parc machines", contextLink: { module: "machine", id: "FIL-01", label: "FIL-01", href: "/machines/FIL-01" }, description: "Ancienne action liée à une machine", responsable: "Marc", echeance: "2026-02-01", statut: "À faire", dateCloture: null, remarque: null };
  const result = migrateDemoData(baseV2Payload({ actions: [legacyAction] }));
  assert.deepEqual(result.actions[0].contextLinks, [{ module: "machine", id: "FIL-01", label: "FIL-01", href: "/machines/FIL-01" }]);
});

test("migrateDemoData préserve un « people » déjà présent (ne l'écrase pas avec un tableau vide)", () => {
  const people = [{ id: "person-1", name: "Marc", weeklyCapacityHours: 38, order: 0 }];
  const result = migrateDemoData(baseV2Payload({ people }));
  assert.deepEqual(result.people, people);
});

test("migrateDemoData (chemin v1 legacy) construit des actions avec les 5 nouveaux champs à null, et `people: []` par défaut", () => {
  const v1Payload = {
    version: 1,
    actions: [{ id: "ACT-900", description: "Vieille action v1", responsible: "Sophie", status: "Ouverte", dueDate: "2026-03-01", createdAt: "2026-01-01", sourceType: "manual", sourceId: null, workOrderId: null, machineId: null }],
    workOrders: [], planning: [], machines: [], maintenance: [], meetings: [], requests: [], erpQuality: [], notifications: [],
  };
  const result = migrateDemoData(v1Payload);
  assert.ok(result);
  assert.equal(result.version, 2);
  assert.deepEqual(result.people, []);
  assert.deepEqual(result.actions[0].planningOrder, null);
  assert.deepEqual(result.actions[0].estimatedHours, null);
});

// --- team-planning-service.ts : importe updateDemoData via l'alias "@/...", non résolvable par
// node:test natif (même limitation, déjà documentée, que action-service.ts dans
// action-backlog.test.mjs) → garde de texte source sur le comportement des mutateurs. ---

test("assignAction pose responsable/semaine, synchronise le nom affiché, et place la carte en fin de case", async () => {
  const source = await read("src/features/actions/services/team-planning-service.ts");
  assert.match(source, /function applyAssignment\(action: ProductionAction, person: TeamMember, weekKey: string, allActions: ProductionAction\[\]\): void \{/);
  assert.match(source, /action\.responsableId = person\.id;\s*\n\s*action\.responsable = person\.name;\s*\n\s*action\.plannedWeek = weekKey;\s*\n\s*action\.planningOrder = nextOrderInCell\(allActions, person\.id, weekKey, action\.id\);/);
});

test("unassignAction retire la période mais garde toujours le responsable (aucune perte de charge/historique)", async () => {
  const source = await read("src/features/actions/services/team-planning-service.ts");
  assert.match(source, /export function unassignAction\(actionId: string\): boolean \{/);
  assert.match(source, /action\.plannedWeek = null;\s*\n\s*action\.planningOrder = null;\s*\n\s*updated = true;/);
});

test("deleteTeamMember conserve responsableId (pas de perte) mais efface la période : les actions repassent en « Non planifiées »", async () => {
  const source = await read("src/features/actions/services/team-planning-service.ts");
  assert.match(source, /if \(action\.responsableId === personId\) \{ action\.plannedWeek = null; action\.planningOrder = null; \}/);
  assert.doesNotMatch(source, /action\.responsableId = null;[\s\S]{0,40}deleteTeamMember/, "deleteTeamMember ne doit jamais effacer responsableId");
});

test("moveToMonth choisit la première semaine du mois non surchargée pour cette personne, sinon la première semaine du mois", async () => {
  const source = await read("src/features/actions/services/team-planning-service.ts");
  assert.match(source, /const targetWeek = weeks\.find\(\(week\) => \{/);
  assert.match(source, /return existingHours \+ chargeableHours\(action\) <= person\.weeklyCapacityHours;/);
  assert.match(source, /\}\) \?\? weeks\[0\];/, "repli sur la première semaine du mois si toutes sont en surcharge");
});

test("reorderWithinCell réécrit planningOrder en une seule passe et ignore les id qui ne sont plus dans cette case", async () => {
  const source = await read("src/features/actions/services/team-planning-service.ts");
  assert.match(source, /const action = draft\.actions\.find\(\(item\) => item\.id === id && item\.responsableId === personId && item\.plannedWeek === weekKey\);\s*\n\s*if \(!action\) return;/);
});

test("une action « Fait » compte pour 0 h dans la charge mais reste visible (grisée) dans sa case", async () => {
  const source = await read("src/features/actions/services/team-planning-service.ts");
  assert.match(source, /function chargeableHours\(action: ProductionAction\): number \{\s*\n\s*return action\.statut === "Fait" \? 0 : action\.estimatedHours \?\? 0;/);
  assert.match(source, /export function unscheduledActions\(actions: ProductionAction\[\]\): ProductionAction\[\] \{\s*\n\s*return actions\.filter\(\(action\) => action\.responsableId !== null && action\.estimatedHours !== null && action\.plannedWeek === null && action\.statut !== "Fait"\);/);
});

// --- Câblage : nouvelles colonnes, 3e onglet, non-régression des onglets/statuts Actions existants ---

test("les colonnes « Charge estimée »/« Période planifiée » existent par défaut dans les réglages Actions", async () => {
  const settings = await read("src/features/settings/config/default-settings.ts");
  assert.match(settings, /id: "estimatedHours"/);
  assert.match(settings, /id: "plannedWeek"/);
});

test("ActionsModule expose un 3e onglet « Planification équipe » sans retirer les onglets existants", async () => {
  const view = await read("src/features/actions/components/ActionsModule.tsx");
  assert.match(view, /type ActionsView = "current" \| "backlog" \| "team-planning";/);
  assert.match(view, /if \(item\.statut !== "À planifier"\) return false;/, "l'onglet backlog reste inchangé");
  assert.match(view, /if \(item\.statut === "À planifier"\) return false;/, "l'onglet Actions exclut toujours les idées, non-régression");
  assert.match(view, /<TeamPlanningTab actions={topLevelActions} people={data\.people} \/>/);
});

test("le sélecteur Responsable d'ActionRow référence toujours une personne par id, jamais par nom", async () => {
  const row = await read("src/features/actions/components/ActionRow.tsx");
  assert.match(row, /value={action\.responsableId \?\? ""}/);
  assert.match(row, /onChange={\(event\) => updateResponsableId\(action\.id, event\.target\.value \|\| null\)}/);
});

test("la planification équipe ne dépend de src/features/planning/ que via la coquille UI générique PlanningDialogShell, jamais de la logique métier de Planning capacité", async () => {
  const files = ["TeamCapacityGrid.tsx", "TeamCapacityCard.tsx", "TeamPlanningTab.tsx", "UnscheduledActionsPanel.tsx", "MoveActionMenu.tsx", "TeamManagementDialog.tsx"];
  for (const file of files) {
    const source = await read(`src/features/actions/components/${file}`);
    const planningImports = [...source.matchAll(/from "@\/features\/planning\/([^"]+)"/g)].map((match) => match[1]);
    for (const target of planningImports) assert.equal(target, "components/PlanningDialogShell", `${file} importe ${target} depuis planning/, attendu uniquement la coquille UI générique`);
  }
});
