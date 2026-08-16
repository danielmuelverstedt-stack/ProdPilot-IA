import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("MeetingRequestsReview affiche un bouton « + Action liée » par demande, ouvrant ActionFormDialog avec un contextLink vers la demande", async () => {
  const source = await read("src/features/meetings/components/MeetingRequestsReview.tsx");
  assert.match(source, /module: "request", id: request\.id, label: request\.id, href: `\/suivi\/\$\{request\.id\}`/);
  assert.match(source, /<ActionFormDialog origine={origine} contextLink={buildContextLink\(actionTarget\)} onClose={\(\) => setActionTarget\(null\)} onCreated={onActionCreated}/);
  assert.match(source, /\+ Action liée/);
});

test("MeetingRequestsReview affiche un état vide explicite plutôt qu'une liste vide silencieuse", async () => {
  const source = await read("src/features/meetings/components/MeetingRequestsReview.tsx");
  assert.match(source, /if \(!requests\.length\) return <p className="mt-4 text-sm text-slate-600">Aucune demande active pour le moment\.<\/p>;/);
});

test("l'action créée depuis une demande peut remonter à la réunion (comme les autres étapes), pas seulement au module Actions", async () => {
  const source = await read("src/features/meetings/components/MeetingRequestsReview.tsx");
  assert.match(source, /onActionCreated: \(id: string, responsable: string\) => void/);
});

test("l'étape « Demandes des départements » de la réunion Production permet désormais de créer une action liée, plus une simple liste consultative", async () => {
  const source = await read("src/features/meetings/components/MeetingWorkflow.tsx");
  assert.match(source, /import \{ MeetingRequestsReview \} from "@\/features\/meetings\/components\/MeetingRequestsReview"/);
  assert.match(source, /if \(type === "Production" && step === 6\) return <MeetingRequestsReview requests={data\.requests\.filter\(\(item\) => item\.status !== "Terminée"\)} origine={origine} onActionCreated={onActionCreated} \/>;/);
});
