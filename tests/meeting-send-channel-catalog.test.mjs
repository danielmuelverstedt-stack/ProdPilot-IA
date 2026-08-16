import assert from "node:assert/strict";
import test from "node:test";
import { getMeetingSendChannelDefinition, MEETING_SEND_CHANNEL_CATALOG } from "../src/features/meetings/config/meeting-send-channel-catalog.ts";

test("MEETING_SEND_CHANNEL_CATALOG déclare les 3 canaux annoncés (e-mail, impression/PDF, Teams)", () => {
  assert.deepEqual(Object.keys(MEETING_SEND_CHANNEL_CATALOG).sort(), ["email", "print", "teams"]);
});

test("e-mail et impression/PDF sont réellement disponibles, Teams est déclaré « prévu » (comme Microsoft 365 pour les mails)", () => {
  assert.equal(getMeetingSendChannelDefinition("email").availability, "available");
  assert.equal(getMeetingSendChannelDefinition("print").availability, "available");
  assert.equal(getMeetingSendChannelDefinition("teams").availability, "planned");
});

test("chaque canal a un type cohérent avec sa clé dans le catalogue, un libellé et une description", () => {
  for (const [key, definition] of Object.entries(MEETING_SEND_CHANNEL_CATALOG)) {
    assert.equal(definition.type, key);
    assert.ok(definition.label.length > 0);
    assert.ok(definition.description.length > 0);
  }
});
