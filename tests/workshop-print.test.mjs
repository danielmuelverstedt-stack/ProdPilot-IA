import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("le bouton Imprimer d'une machine de l'Atelier utilise l'ordre/tri complet affiché, pas la fenêtre de lignes réellement montées dans le DOM", async () => {
  const panel = await read("src/features/planning/components/WorkshopMachinePanel.tsx");
  assert.match(panel, /onPrint\(machine, lineCount === "all" \? operations : operations\.slice\(0, lineCount\), operations\.length\)/, "le nombre de lignes imprimées doit se baser sur `operations` (toutes, triées), pas `visibleOperations` (fenêtrage DOM)");
  assert.match(panel, /<WorkshopMachinePrintDialog/);
  assert.match(panel, /setIsPrintDialogOpen\(true\)/);
});

test("WorkshopMachinePrintDialog propose des paliers de lignes et un nombre précis, sans jamais dépasser le total disponible", async () => {
  const dialog = await read("src/features/planning/components/WorkshopMachinePrintDialog.tsx");
  assert.match(dialog, /const LINE_COUNT_PRESETS = \[10, 25, 50\]/);
  assert.match(dialog, /Toutes \(\{totalOperationCount/);
  assert.match(dialog, /Math\.min\(Math\.floor\(parsed\), totalOperationCount\)/, "un nombre précis saisi à la main reste borné au total réellement disponible");
  assert.match(dialog, /onConfirm\(selection\)/);
});

test("PlanningWorkshopView bascule en pleine page vers la fiche d'impression machine quand une cible est choisie, sans se mélanger aux onglets de département", async () => {
  const view = await read("src/features/planning/components/PlanningWorkshopView.tsx");
  assert.match(view, /if \(printTarget\) return <WorkshopMachinePrintView/);
  assert.match(view, /onPrint=\{\(machine, operations, totalOperationCount\) => setPrintTarget\(\{ machine, operations, totalOperationCount \}\)\}/);
});

test("WorkshopMachinePrintView affiche les mêmes colonnes que celles actuellement visibles à l'écran, avec le nombre imprimé sur le total, sans inventer de temps de fabrication", async () => {
  const printView = await read("src/features/planning/components/WorkshopMachinePrintView.tsx");
  assert.match(printView, /visibleColumnIds\.map\(\(columnId\) => <th key=\{columnId\}[^>]*>\{WORKSHOP_COLUMN_LABELS\[columnId\]\}<\/th>\)/);
  assert.match(printView, /operations\.length\.toLocaleString\("fr-BE"\)\}? sur \$?\{totalOperationCount\.toLocaleString\("fr-BE"\)\}/);
  assert.match(printView, /if \(columnId === "time"\) return "Non disponible";/);
  assert.match(printView, /window\.print\(\)/);
  assert.match(printView, /@page \{ size: \$\{settings\.print\.paperSize\} \$\{settings\.print\.orientation\}/, "reprend la même configuration papier que l'impression du Planning capacité, une seule source de réglages");
});
