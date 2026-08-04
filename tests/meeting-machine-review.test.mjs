import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { buildDemoMachineReview, buildErpMachineReview } from "../src/features/meetings/services/meeting-machine-review.ts";

const machineBase = { active: true, visible: true, deleted: false, name: "Machine", displayName: "Machine", department: "Fraisage", departmentId: "dept-fraisage", machineType: "Fraisage", color: "", order: 0, technicalInformation: "" };

const machines = [
  { ...machineBase, id: "cv5-500", displayName: "CV5-500", order: 0 },
  { ...machineBase, id: "dmu50", displayName: "DMU50", order: 1 },
  { ...machineBase, id: "dmu60", displayName: "DMU60", order: 2, active: false },
  { ...machineBase, id: "masked-machine", displayName: "Masquée", order: 3, visible: false },
];

const opBase = { isRemoved: false, isVisible: true, isWithoutMachine: false, articleWorkOrderCount: 1, department: null, resourceGroup: null, sourcePriority: 1, userPriority: null, sourceOperationStatusId: 1, sourceOrderStatus: "OUVERT", effectiveStatus: "not-started", plannedDate: null, dueDate: null, delayDays: null, comment: null, operationNumber: 10, taskCode: "T1", articleCode: "A100", workOrder: { customerName: "EXAIL", quantity: 120 } };

function op(overrides) { return { ...opBase, ...overrides }; }

test("buildErpMachineReview : les OF les plus prioritaires de chaque machine active et visible, limités à N, avec leur désignation", () => {
  const operations = [
    op({ id: "op-1", workOrderId: "OF-100", machineId: "cv5-500", machine: "CV5-500", description: "Bride", effectivePriority: 3 }),
    op({ id: "op-2", workOrderId: "OF-101", machineId: "cv5-500", machine: "CV5-500", description: "Axe", effectivePriority: 1 }),
    op({ id: "op-3", workOrderId: "OF-102", machineId: "cv5-500", machine: "CV5-500", description: "Support", effectivePriority: 2 }),
    op({ id: "op-4", workOrderId: "OF-200", machineId: "dmu50", machine: "DMU50", description: "Flasque", effectivePriority: 5 }),
    op({ id: "op-5", workOrderId: "OF-300", machineId: "dmu60", machine: "DMU60", description: "Sur machine inactive", effectivePriority: 1 }),
  ];
  const groups = buildErpMachineReview(operations, machines, 2);
  assert.deepEqual(groups.map((group) => group.machineId), ["cv5-500", "dmu50"], "ordre des machines actives/visibles, machine inactive exclue");
  assert.deepEqual(groups[0].rows.map((row) => row.workOrderId), ["OF-101", "OF-102"], "les 2 OF de plus haute priorité (numéro le plus bas), limité à N");
  assert.deepEqual(groups[0].rows.map((row) => row.description), ["Axe", "Support"]);
  assert.deepEqual(groups[1].rows.map((row) => row.workOrderId), ["OF-200"]);
  assert.deepEqual(groups[0].rows[0], { workOrderId: "OF-101", description: "Axe", customerName: "EXAIL", articleCode: "A100", quantity: 120 }, "client, code article et quantité repris de l'opération/du work order ERP");
});

test("buildErpMachineReview : machine masquée exclue, machine sans opération absente du résultat, désignation/client/quantité manquants repliés sur des valeurs explicites", () => {
  const operations = [
    op({ id: "op-1", workOrderId: "OF-100", machineId: "masked-machine", machine: "Masquée", description: "Ne doit pas apparaître", effectivePriority: 1 }),
    op({ id: "op-2", workOrderId: "OF-101", machineId: "cv5-500", machine: "CV5-500", description: "", articleCode: "", workOrder: null, effectivePriority: 1 }),
  ];
  const groups = buildErpMachineReview(operations, machines, 5);
  assert.deepEqual(groups.map((group) => group.machineId), ["cv5-500"], "machine masquée exclue, DMU50 sans opération absente du résultat");
  assert.deepEqual(groups[0].rows[0], { workOrderId: "OF-101", description: "Sans description", customerName: "Client inconnu", articleCode: "—", quantity: null });
});

const demoMachines = [
  { id: "m-1", displayName: "Machine 1" },
  { id: "m-2", displayName: "Machine 2" },
];

function planned(overrides) { return { id: "po-1", workOrderId: "OF-1", operationId: "op-1", machineId: "m-1", startAt: "2026-08-01T08:00:00Z", endAt: "2026-08-01T10:00:00Z", status: "À faire", comments: "", ...overrides }; }

test("buildDemoMachineReview : regroupe par machine dans l'ordre chronologique, limite à N, résout désignation/client/article/quantité depuis l'OF de démonstration", () => {
  const workOrders = [
    { id: "OF-1", description: "OF description générale", customer: "EXAIL", article: "A100", quantity: 50, operations: [{ id: "op-1", description: "Perçage" }, { id: "op-2", description: "Fraisage" }] },
    { id: "OF-2", description: "Autre OF", customer: "SAB", article: "B200", quantity: 12, operations: [] },
  ];
  const planning = [
    planned({ id: "po-1", machineId: "m-1", operationId: "op-2", startAt: "2026-08-01T14:00:00Z" }),
    planned({ id: "po-2", machineId: "m-1", operationId: "op-1", startAt: "2026-08-01T08:00:00Z" }),
    planned({ id: "po-3", machineId: "m-1", workOrderId: "OF-2", operationId: "op-x", startAt: "2026-08-01T09:00:00Z" }),
  ];
  const groups = buildDemoMachineReview(planning, demoMachines, workOrders, 2);
  assert.deepEqual(groups.map((group) => group.machineId), ["m-1"], "Machine 2 sans planning absente du résultat");
  assert.deepEqual(groups[0].rows.map((row) => row.workOrderId), ["OF-1", "OF-2"], "ordre chronologique, limité à N");
  assert.deepEqual(groups[0].rows[0], { workOrderId: "OF-1", description: "Perçage", customerName: "EXAIL", articleCode: "A100", quantity: 50 }, "opération résolue par id dans l'OF, client/article/quantité de l'OF");
  assert.deepEqual(groups[0].rows[1], { workOrderId: "OF-2", description: "Autre OF", customerName: "SAB", articleCode: "B200", quantity: 12 }, "repli sur la description de l'OF quand l'opération est introuvable");
});

test("le nouveau composant de revue OF par machine bascule entre planning ERP réel et démonstration, comme la fiche OF", async () => {
  const source = await readFile(new URL("../src/features/meetings/components/MeetingMachineReview.tsx", import.meta.url), "utf8");
  assert.match(source, /useErpImportActive/, "doit réutiliser le même bascule ERP/démonstration que WorkOrderDetail.tsx");
  assert.match(source, /hasActiveImport \? <ErpMachineReview/);
});

test("la revue OF par machine affiche le client, le code article et la quantité de chaque OF", async () => {
  const source = await readFile(new URL("../src/features/meetings/components/MeetingMachineReview.tsx", import.meta.url), "utf8");
  assert.match(source, /\{row\.customerName\} · Article \{row\.articleCode\} · Qté \{row\.quantity/);
});

test("chaque carte machine affiche la photo enregistrée dans Parc Machines (repli explicite sans photo), comme la fiche machine", async () => {
  const source = await readFile(new URL("../src/features/meetings/components/MeetingMachineReview.tsx", import.meta.url), "utf8");
  assert.match(source, /import \{ MachineThumbnail \} from "@\/features\/machines\/components\/MachineThumbnail"/);
  assert.match(source, /import \{ useMachinePhotos \} from "@\/features\/machines\/services\/machine-photo-store"/);
  assert.match(source, /<MachineThumbnail photoDataUrl={photos\[group\.machineId\]} alt={group\.machineLabel} size="md" \/>/);

  const thumbnail = await readFile(new URL("../src/features/machines/components/MachineThumbnail.tsx", import.meta.url), "utf8");
  assert.match(thumbnail, /export function MachineThumbnail/);

  const picker = await readFile(new URL("../src/features/planning/components/WorkshopMachinePicker.tsx", import.meta.url), "utf8");
  assert.match(picker, /import \{ MachineThumbnail \} from "@\/features\/machines\/components\/MachineThumbnail"/, "le sélecteur machine de l'Atelier doit réutiliser le même composant partagé, pas sa propre copie");
  assert.doesNotMatch(picker, /function MachineThumbnail\(/, "l'ancienne définition locale doit disparaître");
});

test("une action créée depuis la revue OF par machine reste liée à l'OF précis (module workOrder), pas seulement à la réunion", async () => {
  const source = await readFile(new URL("../src/features/meetings/components/MeetingMachineReview.tsx", import.meta.url), "utf8");
  assert.match(source, /module: "workOrder", id: workOrderId, label: workOrderId, href: `\/of\/\$\{workOrderId\}`/);
  assert.match(source, /<ActionFormDialog origine={origine} contextLink={buildContextLink\(actionTarget\.workOrderId\)}/);
});

test("les étapes de la réunion se pilotent aussi depuis des onglets en haut de l'écran (revenir/sauter librement), pas seulement Précédent/Suivant", async () => {
  const workflow = await readFile(new URL("../src/features/meetings/components/MeetingWorkflow.tsx", import.meta.url), "utf8");
  assert.match(workflow, /<StepTabs steps={steps} activeStep={step} disabled={closed} onSelect={setStep} \/>/, "la barre d'étapes doit permettre de sauter directement à n'importe quelle étape via setStep");
  assert.match(workflow, /onClick={\(\) => onSelect\(index\)}/, "chaque onglet doit déclencher la navigation au clic");
  assert.match(workflow, /disabled={disabled}/, "la navigation par onglet doit être désactivée une fois la réunion clôturée");
  assert.match(workflow, /disabled={step === 0} onClick={\(\) => setStep\(\(value\) => value - 1\)}>Précédent/, "les boutons Précédent/Suivant restent disponibles en complément");
});

test("la réunion de production remplace l'étape « Vue planning » (redondante) par « OF planifiés par machine », sans décaler les étapes QRQC", async () => {
  const workflow = await readFile(new URL("../src/features/meetings/components/MeetingWorkflow.tsx", import.meta.url), "utf8");
  assert.match(workflow, /"OF planifiés par machine"/);
  assert.doesNotMatch(workflow, /"Vue planning"/, "l'ancienne étape, devenue redondante avec la nouvelle revue par machine, doit disparaître");
  assert.match(workflow, /type === "Production" && step === 2\) return <MeetingMachineReview origine={origine} \/>/);
  assert.match(workflow, /type === "QRQC" && \[1, 2, 3, 4\]\.includes\(step\)/, "les indices d'étapes QRQC ne doivent pas bouger");
});
