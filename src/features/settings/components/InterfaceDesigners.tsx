"use client";

import { AppIcon, iconLabels, iconOptions } from "@/components/ui/AppIcon";
import { useSettings } from "@/features/settings/components/SettingsProvider";
import { buttonClass, inputClass, SettingsPanel } from "@/features/settings/components/SettingsUi";
import { defaultSettings } from "@/features/settings/config/default-settings";

function move<T extends { order: number }>(items: T[], index: number, direction: -1 | 1) {
  const sorted = [...items].sort((a, b) => a.order - b.order);
  const target = index + direction;
  if (!sorted[target]) return items;
  [sorted[index], sorted[target]] = [sorted[target], sorted[index]];
  return sorted.map((item, order) => ({ ...item, order: order + 1 }));
}

function IconSelect({ value, onChange, label }: { value: string; onChange: (value: string) => void; label: string }) {
  return <select aria-label={label} className={inputClass} value={value} onChange={(event) => onChange(event.target.value)}>{iconOptions.map((icon) => <option key={icon} value={icon}>{iconLabels[icon]}</option>)}</select>;
}

export function NavigationDesigner() {
  const { settings, updateSettings } = useSettings();
  const items = [...settings.navigation].sort((a, b) => a.order - b.order);
  const reset = <button className={buttonClass} onClick={() => updateSettings((draft) => { draft.navigation = structuredClone(defaultSettings.navigation); }, "Menu principal réinitialisé")}>Valeurs par défaut</button>;
  return <SettingsPanel title="Menu principal" description="Renommez, réordonnez ou masquez les modules pour tous les écrans." actions={reset}>
    <div className="space-y-2">{items.map((item, index) => <div key={item.id} className="grid gap-2 rounded-xl border border-[var(--app-border)] p-3 sm:grid-cols-[40px_1fr_150px_auto_auto]">
      <span className="grid size-10 place-items-center rounded-lg bg-slate-100"><AppIcon name={item.icon} className="size-5" /></span>
      <input aria-label={`Nom de ${item.label}`} className={inputClass} value={item.label} onChange={(event) => updateSettings((draft) => { const target = draft.navigation.find((entry) => entry.id === item.id); if (target) target.label = event.target.value; }, "Menu principal personnalisé")} />
      <IconSelect label={`Icône de ${item.label}`} value={item.icon} onChange={(value) => updateSettings((draft) => { const target = draft.navigation.find((entry) => entry.id === item.id); if (target) target.icon = value; }, "Icône du menu modifiée")} />
      <label className="flex items-center gap-2 px-2 text-sm"><input type="checkbox" checked={item.visible} onChange={(event) => updateSettings((draft) => { const target = draft.navigation.find((entry) => entry.id === item.id); if (target) target.visible = event.target.checked; }, "Visibilité du menu modifiée")} /> Visible</label>
      <div className="flex gap-1"><button className={buttonClass} disabled={index === 0} onClick={() => updateSettings((draft) => { draft.navigation = move(draft.navigation, index, -1); }, "Ordre du menu modifié")}>↑</button><button className={buttonClass} disabled={index === items.length - 1} onClick={() => updateSettings((draft) => { draft.navigation = move(draft.navigation, index, 1); }, "Ordre du menu modifié")}>↓</button></div>
    </div>)}</div>
  </SettingsPanel>;
}

export function WorkspaceDesigner() {
  const { settings, updateSettings } = useSettings();
  const cards = [...settings.workspaceCards].sort((a, b) => a.order - b.order);
  const reset = <button className={buttonClass} onClick={() => updateSettings((draft) => { draft.workspaceCards = structuredClone(defaultSettings.workspaceCards); }, "Mon Espace réinitialisé")}>Valeurs par défaut</button>;
  return <SettingsPanel title="Mon Espace" description="Configurez le contenu, la couleur, la taille et l’ordre des cartes." actions={reset}>
    <div className="space-y-3">{cards.map((card, index) => <div key={card.id} className="rounded-xl border border-[var(--app-border)] p-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_150px_100px_140px]">
        <input className={inputClass} value={card.label} aria-label="Nom de la carte" onChange={(event) => updateSettings((draft) => { const target = draft.workspaceCards.find((entry) => entry.id === card.id); if (target) target.label = event.target.value; }, "Carte de Mon Espace renommée")} />
        <IconSelect label="Icône" value={card.icon} onChange={(value) => updateSettings((draft) => { const target = draft.workspaceCards.find((entry) => entry.id === card.id); if (target) target.icon = value; }, "Icône de carte modifiée")} />
        <input type="color" className={`${inputClass} p-1`} value={card.color} aria-label="Couleur" onChange={(event) => updateSettings((draft) => { const target = draft.workspaceCards.find((entry) => entry.id === card.id); if (target) target.color = event.target.value; }, "Couleur de carte modifiée")} />
        <select className={inputClass} value={card.size} aria-label="Taille" onChange={(event) => updateSettings((draft) => { const target = draft.workspaceCards.find((entry) => entry.id === card.id); if (target) target.size = event.target.value as typeof card.size; }, "Taille de carte modifiée")}><option value="small">Petite</option><option value="medium">Moyenne</option><option value="wide">Large</option></select>
      </div>
      <textarea className={`${inputClass} mt-3 min-h-20 py-2`} value={card.description} aria-label="Description" onChange={(event) => updateSettings((draft) => { const target = draft.workspaceCards.find((entry) => entry.id === card.id); if (target) target.description = event.target.value; }, "Description de carte modifiée")} />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={card.visible} onChange={(event) => updateSettings((draft) => { const target = draft.workspaceCards.find((entry) => entry.id === card.id); if (target) target.visible = event.target.checked; }, "Visibilité de carte modifiée")} /> Afficher</label><div className="flex gap-1"><button className={buttonClass} disabled={index === 0} onClick={() => updateSettings((draft) => { draft.workspaceCards = move(draft.workspaceCards, index, -1); }, "Ordre des cartes modifié")}>Monter</button><button className={buttonClass} disabled={index === cards.length - 1} onClick={() => updateSettings((draft) => { draft.workspaceCards = move(draft.workspaceCards, index, 1); }, "Ordre des cartes modifié")}>Descendre</button></div></div>
    </div>)}</div>
  </SettingsPanel>;
}
