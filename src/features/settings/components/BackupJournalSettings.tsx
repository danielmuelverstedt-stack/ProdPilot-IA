"use client";

import { useRef, useState } from "react";
import { useSettings } from "@/features/settings/components/SettingsProvider";
import { buttonClass, SettingsPanel } from "@/features/settings/components/SettingsUi";
import type { AppSettings } from "@/features/settings/types/settings";

export function BackupSettings() {
  const { settings, updateSettings, resetSettings } = useSettings();
  const inputRef = useRef<HTMLInputElement>(null);
  const [notice, setNotice] = useState("");
  function exportSettings() { const blob = new Blob([JSON.stringify(settings, null, 2)], { type: "application/json" }); const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = `prodpilot-reglages-${new Date().toISOString().slice(0, 10)}.json`; anchor.click(); URL.revokeObjectURL(url); setNotice("Sauvegarde exportée."); }
  function importSettings(file?: File) { if (!file) return; const reader = new FileReader(); reader.onload = () => { try { const imported = JSON.parse(String(reader.result)) as AppSettings; if (!imported.version || !Array.isArray(imported.navigation)) throw new Error(); updateSettings(() => imported, "Sauvegarde importée"); setNotice("Sauvegarde importée."); } catch { setNotice("Le fichier sélectionné n’est pas une sauvegarde valide."); } }; reader.readAsText(file); }
  return <SettingsPanel title="Sauvegardes" description="Exportez ou restaurez les réglages locaux. Aucun envoi réseau n’est effectué."><div className="flex flex-wrap gap-2"><button className={buttonClass} onClick={exportSettings}>Exporter les réglages</button><button className={buttonClass} onClick={() => inputRef.current?.click()}>Importer une sauvegarde</button><input ref={inputRef} hidden type="file" accept="application/json" onChange={(event) => importSettings(event.target.files?.[0])} /><button className={`${buttonClass} text-red-700`} onClick={() => { if (window.confirm("Réinitialiser tous les réglages locaux ?")) { resetSettings(); setNotice("Réglages réinitialisés."); } }}>Rétablir les valeurs par défaut</button></div><p className="mt-4 text-sm text-slate-500" aria-live="polite">{notice}</p></SettingsPanel>;
}

export function JournalSettings() { const { settings } = useSettings(); return <SettingsPanel title="Journal des réglages" description="Les 50 dernières modifications locales sont conservées.">{settings.journal.length ? <ul className="divide-y divide-slate-100">{settings.journal.map((entry) => <li className="flex flex-col gap-1 py-3 text-sm sm:flex-row sm:justify-between" key={entry.id}><span>{entry.description}</span><time className="text-slate-500">{entry.date}</time></li>)}</ul> : <p className="rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">Aucune modification enregistrée.</p>}</SettingsPanel>; }
