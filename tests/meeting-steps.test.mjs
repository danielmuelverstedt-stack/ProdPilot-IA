import assert from "node:assert/strict";
import test from "node:test";
import { meetingSteps } from "../src/features/meetings/services/meeting-steps.ts";

test("l'étape 2 (index 1) des réunions QRQC et Production s'appelle « Suivi des actions », comme la catégorie « Participants » nommée à l'étape 1", () => {
  assert.equal(meetingSteps("QRQC")[0], "Participants");
  assert.equal(meetingSteps("QRQC")[1], "Suivi des actions");
  assert.equal(meetingSteps("Production")[0], "Participants");
  assert.equal(meetingSteps("Production")[1], "Suivi des actions");
});
