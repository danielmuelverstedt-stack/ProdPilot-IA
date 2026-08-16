import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function read(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("MeetingRecap détaille les actions liées (lien vers la fiche, responsable, échéance, statut), pas seulement un compteur", async () => {
  const source = await read("src/features/meetings/components/MeetingRecap.tsx");
  assert.match(source, /href={`\/actions\/\$\{action\.id\}`}/, "chaque action doit renvoyer vers sa fiche, comme partout ailleurs dans l'application");
  assert.match(source, /échéance {formatEuropeanDate\(action\.echeance\)}/);
  assert.match(source, /import \{ actionStatusTone \} from "@\/features\/actions\/services\/action-status"/, "réutilise le même mappage statut → couleur que le module Actions, sans le redéfinir");
});

test("MeetingRecap reconstitue le déroulé (notes et décisions par étape) et le parking lot, pas seulement des compteurs", async () => {
  const source = await read("src/features/meetings/components/MeetingRecap.tsx");
  assert.match(source, /Déroulé de la réunion/);
  assert.match(source, /<TextList title="Parking lot" items={meeting\.parkingLot} emptyLabel="Aucun point en attente\." \/>/);
});

test("le déroulé de la réunion reprend l'ordre des étapes du rituel (meetingSteps), pas l'ordre de saisie", async () => {
  const source = await read("src/features/meetings/components/MeetingRecap.tsx");
  assert.match(source, /import \{ meetingSteps \} from "@\/features\/meetings\/services\/meeting-steps"/);
  assert.match(source, /const orderedSteps = \[\.\.\.meetingSteps\(type\)\]/);
});

test("l'étape « Compte rendu » de la réunion Production affiche le compte rendu détaillé (MeetingRecap), pas un simple comptage — demandé explicitement : pas à la clôture, mais dans cette étape", async () => {
  const source = await read("src/features/meetings/components/MeetingWorkflow.tsx");
  assert.match(source, /import \{ MeetingRecap \} from "@\/features\/meetings\/components\/MeetingRecap"/);
  assert.match(source, /if \(type === "Production" && step === 7\) return <MeetingRecap meeting={meeting} actions={meetingActions} \/>;/);
});

test("l'écran Terminée du cycle de vie affiche le compte rendu détaillé (MeetingRecap) et reste accessible tant que la réunion n'est pas archivée — plus seulement juste après le clic « Clôturer la réunion »", async () => {
  const source = await read("src/features/meetings/components/MeetingWorkflow.tsx");
  const terminatedSection = source.slice(source.indexOf("{isTerminee"), source.indexOf(": <section className=\"mt-6 rounded-2xl border border-[var(--app-border)] bg-white p-5 sm:p-6\">"));
  assert.match(terminatedSection, /<MeetingRecapWorkspace meeting={meeting} actions={meetingActions} onArchive={archiveMeeting} \/>/, "l'écran Terminée doit utiliser le véritable espace de compte rendu");
  assert.match(source, /const openMeeting = typeMeetings\.find\(\(item\) => item\.status !== "Archivée"\) \?\? null;/, "tant que la réunion n'est pas archivée, elle reste « la réunion ouverte » — l'écran Terminée est donc accessible à chaque nouvelle visite, pas seulement juste après la clôture");
});
