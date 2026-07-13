/* Les aperçus locaux en data URL ne passent pas par l’optimiseur d’images. */
/* eslint-disable @next/next/no-img-element */
"use client";

import { useSettings } from "@/features/settings/components/SettingsProvider";
import { Field, inputClass, SettingsPanel } from "@/features/settings/components/SettingsUi";
import type { CompanyIdentity, ThemeSettings } from "@/features/settings/types/settings";

export function CompanyIdentitySettings() {
  const { settings, updateSettings } = useSettings();
  function update<K extends keyof CompanyIdentity>(key: K, value: CompanyIdentity[K]) { updateSettings((draft) => { draft.company[key] = value; }, "Identité société mise à jour"); }
  function readLogo(file?: File) { if (!file) return; if (!file.type.startsWith("image/")) return; const reader = new FileReader(); reader.onload = () => update("logoDataUrl", String(reader.result)); reader.readAsDataURL(file); }
  return <SettingsPanel title="Identité société" description="Le logo est conservé localement pour cette démonstration."><div className="grid gap-5 lg:grid-cols-[180px_1fr]"><div><div className="grid h-32 place-items-center overflow-hidden rounded-xl border border-dashed border-[var(--app-border)] bg-slate-50 p-3">{settings.company.logoDataUrl ? <img src={settings.company.logoDataUrl} alt={`Logo ${settings.company.name}`} className="h-full w-full object-contain" /> : <span className="text-sm text-slate-400">Aucun logo</span>}</div><label className="mt-2 block text-xs font-semibold text-slate-600">Importer un logo<input type="file" accept="image/*" className="mt-1 block w-full text-xs" onChange={(event) => readLogo(event.target.files?.[0])} /></label></div><div className="grid gap-4 sm:grid-cols-2"><Field label="Nom de la société"><input className={inputClass} value={settings.company.name} onChange={(event) => update("name", event.target.value)} /></Field><Field label="Adresse e-mail"><input className={inputClass} type="email" value={settings.company.email} onChange={(event) => update("email", event.target.value)} /></Field><Field label="Adresse"><input className={inputClass} value={settings.company.address} onChange={(event) => update("address", event.target.value)} /></Field><Field label="Téléphone"><input className={inputClass} value={settings.company.phone} onChange={(event) => update("phone", event.target.value)} /></Field><Field label="Site web"><input className={inputClass} value={settings.company.website} onChange={(event) => update("website", event.target.value)} /></Field><Field label="Pied de page"><input className={inputClass} value={settings.company.footerText} onChange={(event) => update("footerText", event.target.value)} /></Field></div></div></SettingsPanel>;
}

const colorLabels: Record<keyof ThemeSettings, string> = { primary: "Couleur principale", secondary: "Menu latéral", success: "Succès", warning: "Avertissement", danger: "Danger", information: "Information", background: "Arrière-plan", card: "Cartes", border: "Bordures", text: "Texte" };

export function ThemeSettingsPanel() {
  const { settings, updateSettings } = useSettings();
  return <SettingsPanel title="Couleurs" description="Les changements sont appliqués immédiatement à toute l’interface."><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{(Object.keys(colorLabels) as (keyof ThemeSettings)[]).map((key) => <label key={key} className="flex items-center gap-3 rounded-xl border border-[var(--app-border)] p-3"><input type="color" className="size-10 rounded border-0 bg-transparent" value={settings.theme[key]} onChange={(event) => updateSettings((draft) => { draft.theme[key] = event.target.value; }, `${colorLabels[key]} modifiée`)} /><span><strong className="block text-sm">{colorLabels[key]}</strong><span className="font-mono text-xs text-slate-500">{settings.theme[key]}</span></span></label>)}</div></SettingsPanel>;
}

export function TemplateSettings({ templateKey, title }: { templateKey: string; title: string }) {
  const { settings, updateSettings } = useSettings();
  return <SettingsPanel title={title} description="Utilisez des variables entre accolades pour préparer les futurs contenus."><textarea className={`${inputClass} min-h-64 p-4 font-mono leading-6`} value={settings.templates[templateKey] ?? ""} onChange={(event) => updateSettings((draft) => { draft.templates[templateKey] = event.target.value; }, `${title} mis à jour`)} /></SettingsPanel>;
}
