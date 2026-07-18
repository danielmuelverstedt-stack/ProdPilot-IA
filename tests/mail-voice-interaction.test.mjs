import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { matchesVoiceShortcut, resolveVoiceShortcut } from "../src/features/mail-assistant/services/voice-shortcut.ts";
const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Ctrl + Espace démarre au maintien et reste utilisable dans une zone de saisie", () => {
  const shortcut = resolveVoiceShortcut("ctrl_space");
  assert.equal(shortcut.label, "Ctrl+Espace");
  assert.equal(matchesVoiceShortcut({ key: " ", ctrlKey: true, altKey: false, shiftKey: false, target: { tagName: "TEXTAREA", isContentEditable: false } }, shortcut), true);
});

test("Espace seul est ignoré pendant la saisie", () => {
  const shortcut = resolveVoiceShortcut("space");
  assert.equal(matchesVoiceShortcut({ key: " ", ctrlKey: false, altKey: false, shiftKey: false, target: { tagName: "INPUT", isContentEditable: false } }, shortcut), false);
});

test("les raccourcis personnalisés sont interprétés sans dépendance navigateur", () => {
  const shortcut = resolveVoiceShortcut("custom", "Ctrl+Shift+F8");
  assert.deepEqual(shortcut, { key: "f8", ctrl: true, alt: false, shift: true, label: "Ctrl+Shift+F8" });
});

test("le microphone expose les états, le temps, l'annulation et les transcriptions", async () => {
  const source = await read("src/features/mail-assistant/components/MailAssistantVoiceInput.tsx");
  for (const text of ["Microphone désactivé", "Prêt à écouter", "Écoute en cours", "Transcription en cours", "Transcription prête", "Permission microphone refusée", "Annuler"]) assert.match(source, new RegExp(text));
  assert.match(source, /isFinal/); assert.match(source, /interimResults = true/); assert.match(source, /elapsed/);
});

test("la voix système charge les voix asynchrones et les fournisseurs premium restent inactifs", async () => {
  const provider = await read("src/features/mail-assistant/services/browser-tts-provider.ts"); const contract = await read("src/features/mail-assistant/services/tts-provider.ts");
  assert.match(provider, /voiceschanged/); assert.match(provider, /getVoices/); assert.match(provider, /configured: false/);
  assert.match(contract, /system-browser/); assert.match(contract, /openai-tts-future/); assert.doesNotMatch(provider, /fetch\(|openai\.audio/i);
});

test("aucun audio n'est persisté et le mode développement reste Webpack", async () => {
  const memory = await read("src/features/mail-memory/services/mail-memory-service.ts"); const pkg = JSON.parse(await read("package.json"));
  assert.doesNotMatch(memory, /audio|MediaRecorder|getUserMedia/); assert.equal(pkg.scripts.dev, "next dev --webpack");
});
