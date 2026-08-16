import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("ProductionAction porte un champ besoinType (type de besoin des boutons de l'étape « Cinq projets critiques »)", async () => {
  const source = await read("src/features/demo/types/demo.ts");
  assert.match(source, /besoinType: string \| null;/);
});

test("createAction reporte besoinType sur la nouvelle action, null par défaut (aucun appelant existant n'a besoin de changer)", async () => {
  const source = await read("src/features/actions/services/action-service.ts");
  assert.match(source, /besoinType\?: string \| null;/, "champ optionnel sur NewActionInput");
  assert.match(source, /besoinType: input\.besoinType \?\? null,/, "reporté sur l'action créée, avec repli explicite à null");
});

test("migrateDemoData rattache besoinType (null) aux actions déjà enregistrées, v2 comme v1 legacy", async () => {
  const source = await read("src/features/demo/services/demo-data-migration.ts");
  assert.match(source, /besoinType: action\.besoinType \?\? null,/, "backfill d'un payload v2 déjà stocké");
  assert.match(source, /besoinType: null,\s*\};\s*\}/, "migration v1 legacy vers v2");
});

test("ActionFormDialog n'affiche le champ « Type de besoin » que si initialBesoinType est explicitement fourni (undefined = masqué pour toute création d'action hors contexte de besoin)", async () => {
  const source = await read("src/features/actions/components/ActionFormDialog.tsx");
  assert.match(source, /const showBesoinType = initialBesoinType !== undefined;/);
  assert.match(source, /\{showBesoinType \? <label className="text-sm font-medium">Type de besoin/);
  assert.match(source, /export const ACTION_NEED_TYPES = \["Qualité", "Planning", "Programme", "Outillage", "Matière", "Maintenance", "Achats", "Autre"\];/);
  assert.match(source, /besoinType: showBesoinType \? besoinType : null,/, "jamais renseigné si le champ n'était pas affiché");
});
