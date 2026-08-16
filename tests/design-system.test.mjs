import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("le Design System expose les primitives transversales sans nouvelle dépendance", async () => {
  const ui = await readFile(new URL("../src/components/ui/ModuleUi.tsx", import.meta.url), "utf8");
  const overlays = await readFile(new URL("../src/components/ui/OverlayUi.tsx", import.meta.url), "utf8");
  for (const component of ["Button", "IconButton", "Card", "MetricCard", "Input", "Textarea", "Select", "SearchInput", "FilterBar", "Tabs", "EntityLink", "LoadingState", "Toast"]) {
    assert.match(ui, new RegExp(`export function ${component}\\b`), `${component} doit rester disponible dans la base commune`);
  }
  assert.match(ui, /export const PageHeader = ModuleHeader/);
  assert.match(ui, /export const StatusBadge = StatusPill/);
  assert.match(overlays, /export function Modal\b/);
  assert.match(overlays, /export function SidePanel\b/);
  assert.match(overlays, /event\.key === "Escape"/);
});

test("la modale historique du Planning délègue au composant commun", async () => {
  const dialog = await readFile(new URL("../src/features/planning/components/PlanningDialogShell.tsx", import.meta.url), "utf8");
  assert.match(dialog, /import \{ Modal \} from "@\/components\/ui\/OverlayUi"/);
  assert.match(dialog, /return <Modal title=\{title\}/);
  assert.doesNotMatch(dialog, /fixed inset-0/);
});

test("les quatre modules pilotes utilisent les contrôles harmonisés", async () => {
  const paths = {
    actions: "../src/features/actions/components/ActionsModule.tsx",
    contacts: "../src/features/contacts/components/ContactsModule.tsx",
    machines: "../src/features/machines/components/MachinesModule.tsx",
    maintenance: "../src/features/maintenance/components/MaintenanceProblemsWorkspace.tsx",
  };
  const sources = Object.fromEntries(await Promise.all(Object.entries(paths).map(async ([name, path]) => [name, await readFile(new URL(path, import.meta.url), "utf8")])));
  assert.match(sources.actions, /<Tabs label="Vues des actions"/);
  assert.match(sources.actions, /<SearchInput/);
  assert.match(sources.contacts, /<FilterBar/);
  assert.match(sources.contacts, /<EmptyState icon="contacts"/);
  assert.match(sources.machines, /<MetricCard label="Machines actives"/);
  assert.match(sources.machines, /<Button onClick=\{\(\) => setCreatingMachine\(true\)\}/);
  assert.match(sources.maintenance, /<MetricCard key=\{label\}/);
  assert.match(sources.maintenance, /<SearchInput className="min-w-60 flex-1"/);
});
