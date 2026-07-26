import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { actionStatusTone, isActionOverdue } from "../src/features/actions/services/action-status.ts";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

function action(overrides) {
  return { id: "ACT-900", dateEncodage: "2026-07-01", introduitPar: "Daniel", origine: "Manuel", contextLink: null, description: "Test", responsable: "", echeance: "2026-07-01", statut: "À planifier", dateCloture: null, remarque: null, ...overrides };
}

test("isActionOverdue ne considère jamais une idée « À planifier » comme en retard, même avec une échéance passée", () => {
  const idea = action({ statut: "À planifier", echeance: "2020-01-01" });
  assert.equal(isActionOverdue(idea, "2026-07-26"), false);
});

test("isActionOverdue reste en retard pour les statuts habituels dès que l'échéance est passée, sauf « Fait »", () => {
  assert.equal(isActionOverdue(action({ statut: "À faire", echeance: "2020-01-01" }), "2026-07-26"), true);
  assert.equal(isActionOverdue(action({ statut: "Reporté", echeance: "2020-01-01" }), "2026-07-26"), true);
  assert.equal(isActionOverdue(action({ statut: "Fait", echeance: "2020-01-01" }), "2026-07-26"), false);
  assert.equal(isActionOverdue(action({ statut: "À faire", echeance: "2030-01-01" }), "2026-07-26"), false);
});

test("actionStatusTone couvre les 4 statuts, y compris le nouveau « À planifier »", () => {
  assert.equal(actionStatusTone("Fait"), "success");
  assert.equal(actionStatusTone("Reporté"), "warning");
  assert.equal(actionStatusTone("À planifier"), "info");
  assert.equal(actionStatusTone("À faire"), "neutral");
});

// action-service.ts importe demo-repository.ts, qui importe lui-même des modules via l'alias
// `@/...` (résolu par Next.js/tsconfig, pas par la résolution ESM native de node:test) : pas
// importable directement ici, même limitation structurelle que le reste de ce dépôt pour ces
// fichiers (aucun test existant n'exerçait déjà action-service.ts avant ce chantier). Garde de
// texte source sur le comportement, comme pour tous les autres services de ce module.
test("createAction crée toujours une action « À faire » par défaut (compatibilité), et n'utilise « À planifier » que si demandé explicitement", async () => {
  const source = await read("src/features/actions/services/action-service.ts");
  assert.match(source, /statut\?: ActionStatus;/, "le nouveau champ est optionnel : aucun appelant existant n'a besoin de changer");
  assert.match(source, /statut: input\.statut \?\? "À faire",/, "défaut inchangé pour tous les appelants existants (machines, OF, réunions, demandes, qualité ERP, mail)");
});

test("planAction transforme une idée « À planifier » en action « À faire », avec le responsable et l'échéance donnés à la validation", async () => {
  const source = await read("src/features/actions/services/action-service.ts");
  assert.match(source, /export function planAction\(id: string, responsable: string, echeance: string\): void \{/);
  assert.match(source, /target\.statut = "À faire";[\s\S]*?target\.responsable = responsable\.trim\(\);[\s\S]*?target\.echeance = echeance;/);
});

test("l'onglet « À planifier » d'Actions filtre les idées séparément des actions actuelles, sans jamais les mélanger", async () => {
  const view = await read("src/features/actions/components/ActionsModule.tsx");
  assert.match(view, /const \[view, setView\] = useState<ActionsView>\("current"\);/);
  assert.match(view, /if \(item\.statut !== "À planifier"\) return false;/, "l'onglet « À planifier » ne montre que les idées");
  assert.match(view, /if \(item\.statut === "À planifier"\) return false;/, "l'onglet Actions exclut toujours les idées, quel que soit le filtre de statut choisi");
  assert.match(view, /variant={view}/, "transmet le mode à ActionGroupedList pour adapter les actions rapides de chaque ligne");
});

test("ActionRow propose Planifier/Supprimer pour une idée du backlog, au lieu de Fait/Reporter", async () => {
  const row = await read("src/features/actions/components/ActionRow.tsx");
  assert.match(row, /variant === "backlog"/);
  assert.match(row, /planAction\(action\.id, planResponsable, planEcheance\);/);
  assert.match(row, /onClick={\(\) => setPlanning\(true\)}>Planifier</);
});

test("ActionFormDialog en mode backlog ne demande que la description (pas de responsable/échéance requis), et crée l'action avec statut « À planifier »", async () => {
  const dialog = await read("src/features/actions/components/ActionFormDialog.tsx");
  assert.match(dialog, /mode\?: "full" \| "backlog";/);
  assert.match(dialog, /if \(!description\.trim\(\) \|\| \(!isBacklog && \(!responsable\.trim\(\) \|\| !echeance\)\)\) return;/, "en mode backlog, seule la description est obligatoire");
  assert.match(dialog, /statut: isBacklog \? "À planifier" : "À faire",/);
});
