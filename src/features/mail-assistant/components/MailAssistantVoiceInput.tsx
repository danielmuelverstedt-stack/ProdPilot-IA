"use client";

import { useEffect, useRef, useState } from "react";

interface SpeechRecognitionEventLike { results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }> }
interface SpeechRecognitionErrorLike { error: string }
interface SpeechRecognitionLike { lang: string; interimResults: boolean; continuous: boolean; start(): void; stop(): void; abort(): void; onresult: ((event: SpeechRecognitionEventLike) => void) | null; onerror: ((event: SpeechRecognitionErrorLike) => void) | null; onend: (() => void) | null }
type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

export function MailAssistantVoiceInput({ disabled, onTranscript }: { disabled: boolean; onTranscript: (value: string) => void }) {
  const recognition = useRef<SpeechRecognitionLike | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isSupported] = useState(() => typeof window !== "undefined" && Boolean((window as typeof window & { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor }).SpeechRecognition ?? (window as typeof window & { webkitSpeechRecognition?: SpeechRecognitionConstructor }).webkitSpeechRecognition));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const browser = window as typeof window & { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor };
    const Constructor = browser.SpeechRecognition ?? browser.webkitSpeechRecognition;
    if (!Constructor) return;
    const instance = new Constructor();
    instance.lang = "fr-FR"; instance.interimResults = true; instance.continuous = false;
    instance.onresult = (event) => { let transcript = ""; for (let index = 0; index < event.results.length; index += 1) transcript += event.results[index][0].transcript; onTranscript(transcript); };
    instance.onerror = () => { setError("La reconnaissance vocale a échoué. Vous pouvez continuer au clavier."); setIsListening(false); };
    instance.onend = () => setIsListening(false);
    recognition.current = instance;
    return () => instance.abort();
  }, [onTranscript]);

  if (!isSupported) return <span className="text-xs text-slate-500">Saisie vocale non disponible dans ce navigateur.</span>;
  return <div className="flex items-center gap-2">
    <button type="button" disabled={disabled} aria-label={isListening ? "Arrêter l’écoute" : "Dicter un message"} aria-pressed={isListening} onClick={() => { setError(null); if (isListening) recognition.current?.stop(); else { recognition.current?.start(); setIsListening(true); } }} className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#195c45] disabled:opacity-50">{isListening ? "Arrêter" : "Micro"}</button>
    {isListening ? <span role="status" className="text-xs font-semibold text-red-700">Écoute en cours…</span> : null}
    {error ? <span role="alert" className="text-xs text-red-700">{error}</span> : null}
  </div>;
}
