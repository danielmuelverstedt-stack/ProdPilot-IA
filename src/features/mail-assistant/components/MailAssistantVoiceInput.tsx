"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MailAssistantStartSettings } from "@/features/mail-assistant/types/mail-assistant";
import { matchesVoiceShortcut, resolveVoiceShortcut } from "@/features/mail-assistant/services/voice-shortcut";
import { browserTtsProvider } from "@/features/mail-assistant/services/browser-tts-provider";

interface RecognitionResult { 0: { transcript: string }; isFinal: boolean }
interface RecognitionEvent { resultIndex?: number; results: ArrayLike<RecognitionResult> }
interface RecognitionError { error: string }
interface Recognition { lang: string; interimResults: boolean; continuous: boolean; start(): void; stop(): void; abort(): void; onstart: (() => void) | null; onresult: ((event: RecognitionEvent) => void) | null; onerror: ((event: RecognitionError) => void) | null; onend: (() => void) | null }
type RecognitionConstructor = new () => Recognition;
type VoiceState = "disabled" | "ready" | "listening" | "transcribing" | "ready_transcript" | "error" | "denied";

export function MailAssistantVoiceInput({ disabled, settings, autoStartToken = 0, onTranscript, onSubmit }: { disabled: boolean; settings: MailAssistantStartSettings; autoStartToken?: number; onTranscript: (value: string) => void; onSubmit: (value: string) => void }) {
  const recognition = useRef<Recognition | null>(null);
  const finalText = useRef("");
  const held = useRef(false);
  const shouldListen = useRef(false);
  const isListening = useRef(false);
  const startedAt = useRef(0);
  const restartTimer = useRef(0);
  const processedAutoStartToken = useRef(0);
  const onTranscriptRef = useRef(onTranscript);
  const onSubmitRef = useRef(onSubmit);
  const disabledRef = useRef(disabled);
  const settingsRef = useRef(settings);
  const [state, setState] = useState<VoiceState>(settings.voiceInteractionEnabled ? "ready" : "disabled");
  const [partial, setPartial] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const supported = typeof window !== "undefined" && Boolean((window as typeof window & { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor }).SpeechRecognition ?? (window as typeof window & { webkitSpeechRecognition?: RecognitionConstructor }).webkitSpeechRecognition);

  useEffect(() => { onTranscriptRef.current = onTranscript; }, [onTranscript]);
  useEffect(() => { onSubmitRef.current = onSubmit; }, [onSubmit]);
  useEffect(() => { disabledRef.current = disabled; if (disabled && isListening.current) { shouldListen.current = false; recognition.current?.stop(); } }, [disabled]);
  useEffect(() => { settingsRef.current = settings; }, [settings]);

  const stop = useCallback(() => { shouldListen.current = false; held.current = false; window.clearTimeout(restartTimer.current); recognition.current?.stop(); }, []);
  const start = useCallback(() => {
    if (disabledRef.current || !settingsRef.current.voiceInteractionEnabled || !recognition.current || isListening.current) return;
    shouldListen.current = true;
    if (settingsRef.current.interruptAssistantBySpeaking) browserTtsProvider.stop();
    setError(null); finalText.current = ""; setPartial("");
    try { recognition.current.start(); }
    catch { setState("error"); setError("Le microphone est déjà en cours de démarrage. Patientez un instant puis réessayez."); }
  }, []);
  const cancel = useCallback(() => { shouldListen.current = false; held.current = false; window.clearTimeout(restartTimer.current); recognition.current?.abort(); finalText.current = ""; setPartial(""); onTranscriptRef.current(""); setState("ready"); }, []);

  useEffect(() => {
    const browser = window as typeof window & { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor };
    const Constructor = browser.SpeechRecognition ?? browser.webkitSpeechRecognition;
    if (!Constructor || !settings.voiceInteractionEnabled) return;
    const instance = new Constructor();
    instance.lang = settings.recognitionLanguage;
    instance.interimResults = true;
    instance.continuous = settings.inputMode !== "push_to_talk";
    instance.onstart = () => { isListening.current = true; startedAt.current = Date.now(); setElapsed(0); setState("listening"); };
    instance.onresult = (event) => {
      setState("transcribing");
      let interim = "";
      for (let index = event.resultIndex ?? 0; index < event.results.length; index += 1) {
        const result = event.results[index];
        if (result.isFinal) finalText.current += `${result[0].transcript} `;
        else interim += result[0].transcript;
      }
      const combined = `${finalText.current}${interim}`.trim();
      setPartial(combined);
      if (settingsRef.current.transcriptPreview) onTranscriptRef.current(combined);
      if (finalText.current.trim()) setState("ready_transcript");
    };
    instance.onerror = (event) => {
      const denied = event.error === "not-allowed" || event.error === "service-not-allowed";
      shouldListen.current = false; isListening.current = false;
      setState(denied ? "denied" : "error");
      setError(denied ? "Permission microphone refusée. Autorisez-la dans les réglages du navigateur." : `Erreur microphone : ${event.error}.`);
    };
    instance.onend = () => {
      isListening.current = false;
      const transcript = finalText.current.trim();
      const current = settingsRef.current;
      if (transcript && current.submitAutomatically) {
        shouldListen.current = false;
        setState("ready_transcript");
        onSubmitRef.current(transcript);
        return;
      }
      if (shouldListen.current && current.inputMode !== "push_to_talk" && !disabledRef.current) {
        setState("ready");
        restartTimer.current = window.setTimeout(() => { if (shouldListen.current && !isListening.current) { try { instance.start(); } catch { /* reprise au prochain clic */ } } }, 250);
        return;
      }
      setState(transcript ? "ready_transcript" : "ready");
    };
    recognition.current = instance;
    return () => { shouldListen.current = false; window.clearTimeout(restartTimer.current); instance.abort(); recognition.current = null; };
  }, [settings.inputMode, settings.recognitionLanguage, settings.voiceInteractionEnabled]);

  useEffect(() => { if (state !== "listening" && state !== "transcribing") return; const timer = window.setInterval(() => setElapsed(Math.floor((Date.now() - startedAt.current) / 1000)), 250); return () => window.clearInterval(timer); }, [state]);
  useEffect(() => {
    if (!autoStartToken || processedAutoStartToken.current === autoStartToken) return;
    processedAutoStartToken.current = autoStartToken;
    start();
  }, [autoStartToken, start]);
  useEffect(() => {
    if (settings.inputMode !== "push_to_talk") return;
    const shortcut = resolveVoiceShortcut(settings.pushToTalkShortcut, settings.customShortcut);
    const down = (event: KeyboardEvent) => { if (event.repeat || !matchesVoiceShortcut(event, shortcut)) return; event.preventDefault(); held.current = true; start(); };
    const up = (event: KeyboardEvent) => { if (!held.current || !matchesVoiceShortcut(event, shortcut)) return; event.preventDefault(); stop(); };
    window.addEventListener("keydown", down); window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, [settings.customShortcut, settings.inputMode, settings.pushToTalkShortcut, start, stop]);
  useEffect(() => { if (!settings.disableContinuousOnBlur) return; const blur = () => { if (settings.inputMode === "continuous") stop(); }; window.addEventListener("blur", blur); return () => window.removeEventListener("blur", blur); }, [settings.disableContinuousOnBlur, settings.inputMode, stop]);

  if (!settings.voiceInteractionEnabled) return <span className="text-xs text-slate-500">Microphone désactivé</span>;
  if (!supported) return <span role="status" className="text-xs text-amber-800">Saisie vocale non disponible. Utilisez Edge ou Chrome, ou continuez au clavier.</span>;
  const shortcut = resolveVoiceShortcut(settings.pushToTalkShortcut, settings.customShortcut);
  const active = state === "listening" || state === "transcribing";
  return <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><button type="button" disabled={disabled} title={settings.inputMode === "push_to_talk" ? `Cliquer ou maintenir ${shortcut.label}` : "Cliquer pour démarrer ou arrêter"} aria-label={active ? "Arrêter l’écoute" : "Démarrer l’écoute"} aria-pressed={active} onClick={() => active ? stop() : start()} className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold disabled:opacity-50">{active ? "Arrêter" : "Micro"}</button>{active ? <><span aria-hidden="true" className="h-3 w-3 animate-pulse rounded-full bg-red-600 motion-reduce:animate-none"/><span role="status" className="text-xs font-semibold">{state === "transcribing" ? "Transcription en cours" : "Écoute en cours"} · {elapsed} s</span><button type="button" onClick={cancel} className="text-xs font-semibold text-slate-600">Annuler</button></> : <span role="status" className="text-xs text-slate-500">{state === "ready_transcript" ? "Transcription prête · modifiable avant envoi" : "Prêt à écouter"}{settings.inputMode === "push_to_talk" ? ` · ${shortcut.label}` : ""}</span>}</div>{settings.transcriptPreview && partial ? <div aria-live="polite" className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">{partial}<button type="button" onClick={() => browserTtsProvider.speak({ text: partial, language: settings.preferredLanguage, voiceId: settings.preferredVoiceId, voiceName: settings.preferredVoiceName, rate: settings.speechRate, pitch: settings.speechPitch, volume: settings.speechVolume, onStart() {}, onEnd() {}, onError() {} })} className="ml-2 font-semibold text-[var(--app-primary)]">Relire</button></div> : null}{error ? <p role="alert" className="mt-1 text-xs text-red-700">{error}</p> : null}</div>;
}
