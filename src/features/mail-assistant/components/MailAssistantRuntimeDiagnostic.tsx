"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { inspectBrowserCapabilities } from "@/features/mail-diagnostics/components/MailDiagnosticsScreen";
import type { MailDiagnosticItem } from "@/features/mail-diagnostics/types/mail-diagnostics";

export function MailAssistantRuntimeDiagnostic({ currentError }: { currentError: string | null }) {
  const [items, setItems] = useState<MailDiagnosticItem[]>([]);
  const [pending, setPending] = useState(false);
  const [opened, setOpened] = useState(false);
  const refresh = useCallback(async () => {
    setPending(true);
    try {
      const [browserItems, aiResponse] = await Promise.all([inspectBrowserCapabilities(), fetch("/api/ai/mail/status", { cache: "no-store" })]);
      const ai = await aiResponse.json() as { status?: { configured?: boolean; message?: string }; deterministicFallbackAvailable?: boolean };
      const plaud = browserItems.find((item) => item.id === "plaud");
      setItems([
        rename(browserItems.find((item) => item.id === "microphone"), "Micro disponible"),
        permissionItem(browserItems.find((item) => item.id === "microphone")),
        rename(browserItems.find((item) => item.id === "stt"), "Reconnaissance vocale"),
        rename(browserItems.find((item) => item.id === "tts"), "Synthèse vocale"),
        { id: "ai", label: "Connexion IA", status: aiResponse.ok && (ai.status?.configured || ai.deterministicFallbackAvailable) ? "ok" : "warning", value: ai.status?.configured ? "Connectée" : ai.deterministicFallbackAvailable ? "Repli local" : "Indisponible", explanation: ai.status?.message ?? "État du fournisseur IA et de son repli local." },
        { id: "streaming", label: "Streaming", status: "warning", value: "Non activé", explanation: "Les réponses arrivent actuellement en une seule fois. Cela ne bloque ni le texte ni la voix." },
        rename(plaud, "Plaud détecté"),
        { id: "browser", label: "Navigateur", status: /Edg|Chrome|Chromium/i.test(navigator.userAgent) ? "ok" : "warning", value: browserName(navigator.userAgent), explanation: "Edge ou Chrome est recommandé pour la reconnaissance vocale." },
        { id: "errors", label: "Erreurs", status: currentError ? "error" : "ok", value: currentError ? "1 active" : "Aucune", explanation: currentError ?? "Aucune erreur active dans la conversation." },
      ]);
    } catch (error) {
      setItems([{ id: "errors", label: "Erreurs", status: "error", value: "Diagnostic indisponible", explanation: error instanceof Error ? error.message : "Le diagnostic n’a pas pu être chargé." }]);
    } finally { setPending(false); }
  }, [currentError]);
  return <details className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3" open={opened} onToggle={(event) => { const isOpen = event.currentTarget.open; setOpened(isOpen); if (isOpen && !items.length) void refresh(); }}><summary className="cursor-pointer text-xs font-semibold text-slate-600">Diagnostic audio et conversation</summary>{opened ? <div className="mt-3"><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{pending && !items.length ? <p className="text-xs text-slate-500">Diagnostic en cours…</p> : items.map((item) => <div key={item.id} className="rounded-lg border bg-white p-2 text-xs"><div className="flex items-center justify-between gap-2"><strong>{item.label}</strong><span className={item.status === "ok" ? "text-emerald-700" : item.status === "error" ? "text-red-700" : "text-amber-700"}>{item.status === "ok" ? "✓" : item.status === "error" ? "✕" : "!"} {item.value}</span></div><p className="mt-1 text-slate-500">{item.explanation}</p></div>)}</div><div className="mt-3 flex flex-wrap gap-2"><button type="button" disabled={pending} onClick={() => void refresh()} className="rounded-lg border bg-white px-3 py-2 text-xs font-semibold disabled:opacity-50">Actualiser</button><Link href="/mails/diagnostic" className="rounded-lg border bg-white px-3 py-2 text-xs font-semibold">Diagnostic complet</Link><Link href="/reglages" className="rounded-lg border bg-white px-3 py-2 text-xs font-semibold">Réglages audio</Link></div></div> : null}</details>;
}

function rename(item: MailDiagnosticItem | undefined, label: string): MailDiagnosticItem { return item ? { ...item, label } : { id: label, label, status: "warning", value: "Non vérifié", explanation: "Information non disponible." }; }
function permissionItem(item: MailDiagnosticItem | undefined): MailDiagnosticItem { const denied = item?.explanation.includes("denied"); const granted = item?.explanation.includes("granted"); return { id: "permission", label: "Permissions accordées", status: denied ? "error" : granted ? "ok" : "warning", value: denied ? "Refusées" : granted ? "Accordées" : "À vérifier", explanation: item?.explanation ?? "Permission microphone non vérifiée." }; }
function browserName(userAgent: string): string { if (/Edg/i.test(userAgent)) return "Microsoft Edge"; if (/Chrome|Chromium/i.test(userAgent)) return "Google Chrome/Chromium"; if (/Firefox/i.test(userAgent)) return "Firefox"; if (/Safari/i.test(userAgent)) return "Safari"; return "Navigateur inconnu"; }
