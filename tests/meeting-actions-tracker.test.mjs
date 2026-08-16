import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("MeetingActionsTracker montre les actions « Reporté » en plus de « À faire » (contrairement à l'ancienne revue), tant qu'elles ne sont pas terminées", async () => {
  const source = await read("src/features/meetings/components/MeetingActionsTracker.tsx");
  assert.match(source, /const scoped = useMemo\(\(\) => data\.actions\.filter\(\(item\) => item\.origine === origine && !isSubAction\(item\)\), \[data\.actions, origine\]\);/);
  assert.match(source, /const open = useMemo\(\(\) => scoped\.filter\(\(item\) => item\.statut !== "Fait"\), \[scoped\]\);/, "ouvertes = tout sauf Fait, donc Reporté reste visible");
  assert.doesNotMatch(source, /statut === "À faire"/, "ne doit plus se limiter au seul statut « À faire » comme l'ancienne revue");
});

test("le résumé ne montre jamais de priorité, uniquement total/retard/aujourd'hui/cette semaine", async () => {
  const source = await read("src/features/meetings/components/MeetingActionsTracker.tsx");
  assert.doesNotMatch(source, /priority/i, "aucune notion de priorité dans cette vue, à la demande explicite de l'utilisateur");
  assert.match(source, /summary\.total/);
  assert.match(source, /summary\.retard/);
  assert.match(source, /summary\.aujourdhui/);
  assert.match(source, /summary\.semaine/);
});

test("le tri retard-en-premier et la fin de semaine réutilisent les fonctions déjà centralisées d'action-grouping.ts, sans les réécrire", async () => {
  const source = await read("src/features/meetings/components/MeetingActionsTracker.tsx");
  assert.match(source, /import \{ endOfWeekIso, sortWithOverdueFirst \} from "@\/features\/actions\/services\/action-grouping"/);
  assert.match(source, /const sorted = sortWithOverdueFirst\(searched, today\);/);
});

test("la recherche porte sur le titre, le responsable et les libellés des liens (machine/OF/projet)", async () => {
  const source = await read("src/features/meetings/components/MeetingActionsTracker.tsx");
  assert.match(source, /`\$\{item\.description\} \$\{item\.responsable\} \$\{item\.contextLinks\.map\(\(link\) => link\.label\)\.join\(" "\)\}`/);
});

test("+ Nouvelle action réutilise ActionFormDialog (même formulaire que le module Actions), avec le sélecteur de liens et le rattachement à la réunion en cours", async () => {
  const source = await read("src/features/meetings/components/MeetingActionsTracker.tsx");
  assert.match(source, /<ActionFormDialog origine={origine} contextLink={meetingLink} allowLinkPicker onClose={\(\) => setCreating\(false\)} onCreated={onActionCreated} \/>/);
});

test("cliquer sur une carte ouvre le panneau d'édition rapide (ActionQuickEditPanel), pas une nouvelle page", async () => {
  const source = await read("src/features/meetings/components/MeetingActionsTracker.tsx");
  assert.match(source, /import \{ ActionQuickEditPanel \} from "@\/features\/actions\/components\/ActionQuickEditPanel"/);
  assert.match(source, /<ActionQuickEditPanel actionId={editingId} onClose={\(\) => setEditingId\(null\)} \/>/);
});

test("MeetingWorkflow route désormais l'étape 2 (index 1) vers MeetingActionsTracker, pour QRQC comme pour Production", async () => {
  const workflow = await read("src/features/meetings/components/MeetingWorkflow.tsx");
  assert.match(workflow, /import \{ MeetingActionsTracker \} from "@\/features\/meetings\/components\/MeetingActionsTracker"/);
  assert.match(workflow, /if \(step === 1\) return <MeetingActionsTracker origine={origine} meetingLink={\{ module: "meeting", id: meeting\.id, label: meeting\.id, href: meetingHref\(type\) \}} onActionCreated={onActionCreated} \/>;/);
});
