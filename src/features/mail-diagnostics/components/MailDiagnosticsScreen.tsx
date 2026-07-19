"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { MailDiagnosticItem, MailServerDiagnostics } from "@/features/mail-diagnostics/types/mail-diagnostics";

export function MailDiagnosticsScreen() {
  const [server, setServer] = useState<MailServerDiagnostics | null>(null);
  const [browserItems, setBrowserItems] = useState<MailDiagnosticItem[]>([]);
  const [pending, setPending] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setPending(true); setError(null);
    try {
      const result = await loadDiagnostics();
      setServer(result.server); setBrowserItems(result.browserItems);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Le diagnostic Mail est indisponible."); }
    finally { setPending(false); }
  }, []);

  useEffect(() => {
    let active = true;
    void loadDiagnostics()
      .then((result) => { if (active) { setServer(result.server); setBrowserItems(result.browserItems); } })
      .catch((caught: unknown) => { if (active) setError(caught instanceof Error ? caught.message : "Le diagnostic Mail est indisponible."); })
      .finally(() => { if (active) setPending(false); });
    return () => { active = false; };
  }, []);

  async function synchronize() {
    setPending(true); setError(null);
    try {
      const response = await fetch("/api/mail/messages?all=true&refresh=true", { cache: "no-store" });
      const payload = await response.json() as { message?: string };
      if (!response.ok) throw new Error(payload.message ?? "La synchronisation complète a échoué.");
      await refresh();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "La synchronisation complète a échoué."); setPending(false); }
  }

  const items = [...(server?.items ?? []), ...browserItems];
  return <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6"><header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1f5f49]">Fiabilité Mail</p><h1 className="mt-2 text-3xl font-bold tracking-tight">Diagnostic Mail</h1><p className="mt-2 max-w-3xl text-sm text-slate-600">État réel des connexions, de la synchronisation, de l’IA et des périphériques locaux. Aucun secret ni contenu de mail n’est affiché.</p></div><div className="flex flex-wrap gap-2"><Link href="/mails" className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold">Retour aux mails</Link><button type="button" disabled={pending} onClick={() => void synchronize()} className="rounded-xl bg-[#1f5f49] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Synchroniser complètement</button><button type="button" disabled={pending} onClick={() => void refresh()} className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold disabled:opacity-50">Actualiser</button></div></header>
    {error ? <p role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p> : null}
    {pending && !items.length ? <p className="mt-8 text-sm text-slate-500">Diagnostic en cours…</p> : <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{items.map((entry) => <article key={entry.id} className={`rounded-2xl border p-4 ${cardClass[entry.status]}`}><div className="flex items-center justify-between gap-3"><h2 className="font-semibold text-slate-900">{entry.label}</h2><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${badgeClass[entry.status]}`}>{statusLabel[entry.status]}</span></div><p className="mt-3 text-2xl font-bold text-slate-900">{entry.value}</p><p className="mt-2 text-sm leading-6 text-slate-600">{entry.explanation}</p></article>)}</div>}
    {server ? <p className="mt-6 text-xs text-slate-500">Diagnostic généré le {new Intl.DateTimeFormat("fr-BE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(new Date(server.generatedAt))}.</p> : null}
  </main>;
}

async function loadDiagnostics() {
  const [response, browserItems] = await Promise.all([fetch("/api/mail/diagnostics", { cache: "no-store" }), inspectBrowserCapabilities()]);
  const server = await response.json() as MailServerDiagnostics & { message?: string };
  if (!response.ok || !Array.isArray(server.items)) throw new Error(server.message ?? "Le diagnostic Mail est indisponible.");
  return { server, browserItems };
}

async function inspectBrowserCapabilities(): Promise<MailDiagnosticItem[]> {
  const items: MailDiagnosticItem[] = [];
  const synthSupported = "speechSynthesis" in window && typeof SpeechSynthesisUtterance !== "undefined";
  const voices = synthSupported ? window.speechSynthesis.getVoices() : [];
  items.push(entry("tts", "État TTS", synthSupported ? (voices.length ? "ok" : "warning") : "error", synthSupported ? `${voices.length} voix` : "Indisponible", synthSupported ? "Synthèse vocale fournie localement par le navigateur." : "Le navigateur ne fournit pas SpeechSynthesis."));
  const recognition = window as typeof window & { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown };
  const sttSupported = Boolean(recognition.SpeechRecognition ?? recognition.webkitSpeechRecognition);
  items.push(entry("stt", "État STT", sttSupported ? "ok" : "warning", sttSupported ? "OK" : "Indisponible", sttSupported ? "Reconnaissance vocale disponible ; elle démarre uniquement après une action utilisateur." : "Utilisez Edge ou Chrome, ou conservez la saisie clavier."));

  let devices: MediaDeviceInfo[] = [];
  try { devices = await navigator.mediaDevices?.enumerateDevices?.() ?? []; } catch { devices = []; }
  const microphones = devices.filter((device) => device.kind === "audioinput");
  const speakers = devices.filter((device) => device.kind === "audiooutput");
  let permission = "non vérifiée";
  try { permission = (await navigator.permissions.query({ name: "microphone" as PermissionName })).state; } catch { permission = microphones.length ? "périphérique détecté" : "non disponible"; }
  items.push(entry("microphone", "Micro", microphones.length ? (permission === "denied" ? "error" : "ok") : "warning", microphones.length ? `${microphones.length} détecté${microphones.length > 1 ? "s" : ""}` : "Aucun", `Permission : ${permission}. Aucun enregistrement n’est lancé par ce diagnostic.`));
  items.push(entry("speakers", "Haut-parleurs", speakers.length ? "ok" : "warning", speakers.length ? `${speakers.length} détecté${speakers.length > 1 ? "s" : ""}` : "Non identifiés", speakers.length ? "Sorties audio annoncées par le navigateur." : "Le navigateur peut masquer les sorties tant qu’aucune permission média n’a été accordée."));
  const plaudDevices = devices.filter((device) => /plaud/i.test(device.label));
  items.push(entry("plaud", "Plaud", "warning", plaudDevices.length ? "Périphérique détecté" : "Non connecté", plaudDevices.length ? "Un périphérique audio porte le nom Plaud, mais aucun connecteur ni session Plaud n’existe dans ProdPilot. Il n’est donc jamais déclaré connecté." : "Aucun connecteur, jeton, session ou fournisseur Plaud n’est configuré dans ProdPilot."));
  return items;
}

function entry(id: string, label: string, status: MailDiagnosticItem["status"], value: string, explanation: string): MailDiagnosticItem { return { id, label, status, value, explanation }; }
const statusLabel = { ok: "OK", warning: "Avertissement", error: "Erreur" } as const;
const cardClass = { ok: "border-emerald-200 bg-emerald-50/40", warning: "border-amber-200 bg-amber-50/40", error: "border-red-200 bg-red-50/40" } as const;
const badgeClass = { ok: "bg-emerald-100 text-emerald-800", warning: "bg-amber-100 text-amber-900", error: "bg-red-100 text-red-800" } as const;
