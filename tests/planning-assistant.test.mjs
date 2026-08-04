import assert from "node:assert/strict";
import test from "node:test";
import {
  buildMachineAmbiguousReply,
  buildMachineLookupReply,
  buildMachineNotFoundReply,
  buildMachineOfListReply,
  buildPriorityLookupReply,
  buildSetPriorityOutcome,
  extractMachineQuery,
  extractOperationNumber,
  extractTargetPriority,
  extractWorkOrderId,
  interpretPlanningIntent,
  isMachineOfListRequest,
  isPlanningAssistantRequest,
  resolveMachineQuery,
} from "../src/features/planning/services/planning-assistant-interpreter.ts";

function buildMachine(overrides = {}) {
  return {
    id: "VTC-200",
    active: true,
    visible: true,
    name: "VTC-200",
    displayName: "VTC-200 · Centre 5 axes",
    department: "Usinage",
    departmentId: "dep-usinage",
    machineType: "Centre d'usinage",
    color: "#123d30",
    order: 0,
    technicalInformation: "",
    deleted: false,
    ...overrides,
  };
}

function buildOperation(overrides = {}) {
  return {
    id: "op-1",
    operationIdentity: "op-1",
    workOrderId: "OF-63596",
    operationNumber: 10,
    taskCode: "T10",
    articleCode: "ART-1",
    description: "Fraisage",
    subcontracted: false,
    dueDate: null,
    actualStartAt: null,
    actualEndAt: null,
    status: "planned",
    machine: "Mazak 1",
    machineId: "machine-1",
    priority: 3,
    userPriority: null,
    comment: null,
    manualOrder: null,
    isLocked: false,
    hasPlannedMachine: true,
    hasUserPriority: false,
    hasComment: false,
    hasManualOrder: false,
    isRemoved: false,
    isVisible: true,
    isWithoutMachine: false,
    isLate: false,
    isStarted: false,
    isFinished: false,
    isBlocked: false,
    erpMachineCode: "MZ1",
    sourcePriority: 3,
    effectivePriority: 3,
    sourceStatus: "planned",
    effectiveStatus: "planned",
    sourceOperationStatusId: 1,
    sourceOrderStatus: "En cours",
    sourceMacroRangeCode: "USI",
    sourceRow: 1,
    duplicateOf: null,
    plannedDate: null,
    delayDays: null,
    priorityScore: 3,
    articleWorkOrderCount: 1,
    hasManualOverride: false,
    issues: [],
    ...overrides,
  };
}

test("extractWorkOrderId reconnaît le préfixe OF et la faute de frappe courante sans le F", () => {
  assert.equal(extractWorkOrderId("l'OF-63596 est sur quelle machine"), "OF-63596");
  assert.equal(extractWorkOrderId("OF63596 en priorité"), "OF-63596");
  assert.equal(extractWorkOrderId("l'o63596 est sur quelle machine"), "OF-63596");
  assert.equal(extractWorkOrderId("bonjour"), null);
});

test("extractTargetPriority lit plusieurs formulations de priorité", () => {
  assert.equal(extractTargetPriority("passe la priorité n2"), 2);
  assert.equal(extractTargetPriority("priorité n°5"), 5);
  assert.equal(extractTargetPriority("priorité 7"), 7);
  assert.equal(extractTargetPriority("aucune mention"), null);
});

test("extractOperationNumber lit un numéro d'opération explicite ou une réponse nue", () => {
  assert.equal(extractOperationNumber("opération n°20"), 20);
  assert.equal(extractOperationNumber("operation 30"), 30);
  assert.equal(extractOperationNumber("20"), 20);
  assert.equal(extractOperationNumber("bonjour"), null);
});

test("isPlanningAssistantRequest détecte un OF ou une question de machine/priorité", () => {
  assert.equal(isPlanningAssistantRequest("l'OF-63596 est sur quelle machine"), true);
  assert.equal(isPlanningAssistantRequest("quelle est la priorité"), true);
  assert.equal(isPlanningAssistantRequest("bonjour, comment vas-tu"), false);
});

test("interpretPlanningIntent distingue consultation et modification de priorité", () => {
  assert.equal(interpretPlanningIntent("l'OF-63596 est sur quelle machine"), "machine-lookup");
  assert.equal(interpretPlanningIntent("quelle est la priorité de l'OF-65489"), "priority-lookup");
  assert.equal(interpretPlanningIntent("peux-tu la passer en priorité n2"), "set-priority");
  assert.equal(interpretPlanningIntent("bonjour"), "unknown");
});

test("buildMachineLookupReply répond directement pour une opération unique et détaille en cas de pluralité", () => {
  assert.match(buildMachineLookupReply("OF-63596", [buildOperation()]), /Mazak 1/);
  assert.match(buildMachineLookupReply("OF-63596", []), /introuvable/);
  const reply = buildMachineLookupReply("OF-63596", [buildOperation({ operationNumber: 10, machine: "Mazak 1" }), buildOperation({ id: "op-2", operationNumber: 20, machine: "Mazak 2" })]);
  assert.match(reply, /Op\. 10/);
  assert.match(reply, /Op\. 20/);
});

test("buildPriorityLookupReply répond directement pour une opération unique et détaille en cas de pluralité", () => {
  assert.match(buildPriorityLookupReply("OF-65489", [buildOperation({ effectivePriority: 4 })]), /priorité 4/);
  const reply = buildPriorityLookupReply("OF-65489", [buildOperation({ operationNumber: 10, effectivePriority: 4 }), buildOperation({ id: "op-2", operationNumber: 20, effectivePriority: 2 })]);
  assert.match(reply, /Op\. 10.*priorité 4/);
  assert.match(reply, /Op\. 20.*priorité 2/);
});

test("buildSetPriorityOutcome propose une modification quand une seule opération existe", () => {
  const outcome = buildSetPriorityOutcome("OF-65489", [buildOperation({ effectivePriority: 3 })], 2, null);
  assert.ok(outcome.proposal);
  assert.equal(outcome.proposal.priority, 2);
  assert.equal(outcome.proposal.operationId, "op-1");
  assert.match(outcome.reply, /Confirmez-vous/);
});

test("buildSetPriorityOutcome ne propose rien et demande le numéro d'opération en cas d'ambiguïté", () => {
  const operations = [buildOperation({ operationNumber: 10 }), buildOperation({ id: "op-2", operationNumber: 20 })];
  const outcome = buildSetPriorityOutcome("OF-65489", operations, 2, null);
  assert.equal(outcome.proposal, null);
  assert.equal(outcome.pendingCandidates, operations);
  assert.match(outcome.reply, /plusieurs opérations/);
});

test("buildSetPriorityOutcome résout l'ambiguïté quand le numéro d'opération est fourni", () => {
  const operations = [buildOperation({ operationNumber: 10 }), buildOperation({ id: "op-2", operationNumber: 20 })];
  const outcome = buildSetPriorityOutcome("OF-65489", operations, 2, 20);
  assert.ok(outcome.proposal);
  assert.equal(outcome.proposal.operationId, "op-2");
  assert.equal(outcome.proposal.operationNumber, 20);
});

test("buildSetPriorityOutcome signale un numéro d'opération inconnu sans proposer de modification", () => {
  const operations = [buildOperation({ operationNumber: 10 }), buildOperation({ id: "op-2", operationNumber: 20 })];
  const outcome = buildSetPriorityOutcome("OF-65489", operations, 2, 99);
  assert.equal(outcome.proposal, null);
  assert.match(outcome.reply, /Aucune opération n°99/);
});

test("buildSetPriorityOutcome signale un OF introuvable", () => {
  const outcome = buildSetPriorityOutcome("OF-00000", [], 2, null);
  assert.equal(outcome.proposal, null);
  assert.match(outcome.reply, /introuvable/);
});

test("isMachineOfListRequest reconnaît une question d'OF par machine et exclut une question sur un OF précis", () => {
  assert.equal(isMachineOfListRequest("quels sont les 5 OF en priorité sur la VTC-200"), true);
  assert.equal(isMachineOfListRequest("les OF sur VTC-200"), true);
  assert.equal(isMachineOfListRequest("l'OF-63596 est sur quelle machine"), false);
  assert.equal(isMachineOfListRequest("bonjour"), false);
});

test("extractMachineQuery capture le texte de machine en fin de phrase et le nombre d'OF demandé", () => {
  assert.deepEqual(extractMachineQuery("quels sont les 5 OF en priorité sur la VTC-200"), { machineText: "VTC-200", limit: 5 });
  assert.deepEqual(extractMachineQuery("les OF sur la machine VTC-200 ?"), { machineText: "VTC-200", limit: 5 });
  assert.deepEqual(extractMachineQuery("les 3 OF sur VTC-200"), { machineText: "VTC-200", limit: 3 });
});

test("resolveMachineQuery trouve une machine par id ou par nom d'affichage, sans jamais deviner entre plusieurs", () => {
  const machines = [buildMachine(), buildMachine({ id: "FRA-01", name: "FRA-01", displayName: "FRA-01 · Fraiseuse" })];
  assert.equal(resolveMachineQuery("VTC-200", machines).machine.id, "VTC-200");
  assert.equal(resolveMachineQuery("vtc 200", machines).machine.id, "VTC-200");
  assert.equal(resolveMachineQuery("fraiseuse", machines).machine.id, "FRA-01");
  assert.equal(resolveMachineQuery("machine inconnue", machines).machine, null);
  assert.deepEqual(resolveMachineQuery("machine inconnue", machines).candidates, []);
});

test("resolveMachineQuery renvoie les candidats sans choisir quand plusieurs machines correspondent", () => {
  const machines = [buildMachine({ id: "VTC-200" }), buildMachine({ id: "VTC-300", name: "VTC-300", displayName: "VTC-300 · Centre 5 axes" })];
  const resolution = resolveMachineQuery("centre 5 axes", machines);
  assert.equal(resolution.machine, null);
  assert.equal(resolution.candidates.length, 2);
});

test("resolveMachineQuery ignore les machines supprimées", () => {
  const machines = [buildMachine({ deleted: true })];
  assert.equal(resolveMachineQuery("VTC-200", machines).machine, null);
});

test("buildMachineOfListReply liste les OF triés par priorité et signale le surplus au-delà de la limite", () => {
  const operations = [buildOperation({ id: "op-1", workOrderId: "OF-100", effectivePriority: 1 }), buildOperation({ id: "op-2", workOrderId: "OF-200", effectivePriority: 2 })];
  const reply = buildMachineOfListReply("VTC-200 · Centre 5 axes", operations, 1);
  assert.match(reply, /OF-100/);
  assert.match(reply, /autre\(s\) OF/);
  assert.doesNotMatch(reply, /OF-200/);
});

test("buildMachineOfListReply signale l'absence d'OF sur la machine sans en inventer", () => {
  assert.match(buildMachineOfListReply("VTC-200 · Centre 5 axes", [], 5), /Aucun OF planifié/);
});

test("buildMachineNotFoundReply et buildMachineAmbiguousReply restent honnêtes sans deviner", () => {
  assert.match(buildMachineNotFoundReply("VTC-999"), /Aucune machine/);
  const machines = [buildMachine({ id: "VTC-200" }), buildMachine({ id: "VTC-300", displayName: "VTC-300" })];
  const reply = buildMachineAmbiguousReply("VTC", machines);
  assert.match(reply, /VTC-200 · Centre 5 axes/);
  assert.match(reply, /VTC-300/);
});
