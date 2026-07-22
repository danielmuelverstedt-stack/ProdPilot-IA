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
  assert.match(source, /onTranscriptRef/); assert.match(source, /onSubmitRef/); assert.match(source, /processedAutoStartToken/);
  assert.match(source, /event\.resultIndex/); assert.match(source, /settings\.inputMode !== "push_to_talk"/);
  assert.doesNotMatch(source, /\[onSubmit, onTranscript,/);
});

test("le clic micro reste actif et le raccourci Plaud à risque n’est plus la valeur initiale", async () => {
  const defaults = await read("src/features/mail-assistant/config/mail-assistant-defaults.ts");
  const repository = await read("src/features/settings/services/settings-repository.ts");
  assert.match(defaults, /inputMode: "click_to_talk"/);
  assert.match(defaults, /pushToTalkShortcut: "f8"/);
  assert.match(repository, /saved\.pushToTalkShortcut === "ctrl_space"/);
  assert.match(repository, /migrated\.pushToTalkShortcut = "f8"/);
});

test("la lecture vocale ne dépend plus de l’identité instable du callback parent", async () => {
  const source = await read("src/features/mail-assistant/components/MailAssistantSpeechOutput.tsx");
  assert.match(source, /onFinishedRef/);
  assert.doesNotMatch(source, /\[onFinished,/);
});

test("le panneau de diagnostic couvre audio, IA, streaming, Plaud, navigateur et erreurs", async () => {
  const source = await read("src/features/mail-assistant/components/MailAssistantRuntimeDiagnostic.tsx");
  for (const label of ["Micro disponible", "Permissions accordées", "Reconnaissance vocale", "Synthèse vocale", "Connexion IA", "Streaming", "Plaud détecté", "Navigateur", "Erreurs"]) assert.match(source, new RegExp(label));
});

test("la voix système charge les voix asynchrones et les fournisseurs premium restent inactifs", async () => {
  const provider = await read("src/features/mail-assistant/services/browser-tts-provider.ts"); const contract = await read("src/features/mail-assistant/services/tts-provider.ts");
  assert.match(provider, /voiceschanged/); assert.match(provider, /getVoices/); assert.match(provider, /configured: false/);
  assert.match(contract, /system-browser/); assert.match(contract, /openai-tts-future/); assert.doesNotMatch(provider, /fetch\(|openai\.audio/i);
});

test("aucun audio n'est persisté par la mémoire mail", async () => {
  const memory = await read("src/features/mail-memory/services/mail-memory-service.ts");
  assert.doesNotMatch(memory, /audio|MediaRecorder|getUserMedia/);
});
