import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { classifyVoiceLevel } from "../src/features/mail-assistant/config/voice-diagnostic-defaults.ts";
import { deduplicateVoices, resolveVoiceFallback } from "../src/features/mail-assistant/services/browser-tts-provider.ts";
const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("les niveaux audio utilisent les seuils centralisés", () => { assert.equal(classifyVoiceLevel(0), "absent"); assert.equal(classifyVoiceLevel(0.03), "weak"); assert.equal(classifyVoiceLevel(0.2), "correct"); assert.equal(classifyVoiceLevel(0.8), "strong"); });

test("les voix dupliquées sont supprimées avec des identifiants stables", () => { const voices = deduplicateVoices([{ voiceURI: "uri-a", name: "A", lang: "fr-FR", localService: true, default: true }, { voiceURI: "uri-a", name: "A", lang: "fr-FR", localService: true, default: true }]); assert.equal(voices.length, 1); assert.equal(voices[0].id, "uri-a"); assert.equal(voices[0].locale, "fr-FR"); });

test("le repli essaie URI, nom et locale, défaut de locale puis défaut navigateur", () => { const voices = deduplicateVoices([{ voiceURI: "fr-default", name: "France", lang: "fr-FR", localService: true, default: true }, { voiceURI: "en", name: "English", lang: "en-GB", localService: true, default: false }]); assert.equal(resolveVoiceFallback(voices, { id: "absente", name: "France", locale: "fr-FR" })?.id, "fr-default"); assert.equal(resolveVoiceFallback(voices, { id: "absente", name: "Absente", locale: "fr-FR" })?.id, "fr-default"); });

test("le diagnostic énumère avant et après permission puis nettoie toutes les ressources", async () => { const source = await read("src/features/mail-assistant/services/microphone-diagnostic-service.ts"); assert.match(source, /enumerateDevices/); assert.match(source, /autorisez l’accès pour afficher son nom/); assert.match(source, /getUserMedia/); assert.match(source, /getTracks\(\)\.forEach/); assert.match(source, /track\.stop/); assert.match(source, /context\.close/); assert.match(source, /MediaRecorder/); assert.doesNotMatch(source, /localStorage|indexedDB|fetch\(/); });

test("le panneau ne demande aucune permission au chargement et détruit l'audio temporaire", async () => { const source = await read("src/features/settings/components/MicrophoneDiagnosticPanel.tsx"); const effect = source.match(/useEffect\(\(\) => \{ void refresh[\s\S]*?\}, \[discard, refresh\]\)/)?.[0] ?? ""; assert.doesNotMatch(effect, /getUserMedia|startMicrophoneTest/); assert.match(source, /URL\.revokeObjectURL/); assert.match(source, /audio\.onended = discard/); assert.match(source, /Permission refusée/); assert.match(source, /Aucun microphone détecté/); });

test("la liste de voix gère chargement vide, événement et actualisation", async () => { const provider = await read("src/features/mail-assistant/services/browser-tts-provider.ts"); const panel = await read("src/features/settings/components/MailVoiceSettingsPanel.tsx"); assert.match(provider, /voiceschanged/); assert.match(provider, /!voices\.length/); assert.match(provider, /setTimeout\(refresh, 250\)/); assert.match(panel, /Actualiser les voix/); assert.match(panel, /La voix choisie n’est plus disponible/); assert.match(panel, /Prévisualiser/); assert.match(panel, /browserTtsProvider\.stop/); });
