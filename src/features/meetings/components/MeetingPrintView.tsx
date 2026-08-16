/* Le logo local enregistré en data URL ne passe pas par l’optimiseur d’images. */
/* eslint-disable @next/next/no-img-element */
"use client";

import { primaryButton, secondaryButton } from "@/components/ui/ModuleUi";
import { useSettings } from "@/features/settings/components/SettingsProvider";

/**
 * Vue plein écran imprimable pour un document de réunion (ordre du jour ou compte rendu) — même
 * principe que `WorkshopMachinePrintView.tsx` (remplace tout l'écran pendant l'aperçu, `@page`
 * dédiée, barre `print:hidden`) : le texte du document est déjà entièrement composé par l'appelant
 * (`buildMeetingPreparationDocument`/`buildMeetingRecapEmail`), cette vue ne fait qu'y ajouter
 * l'en-tête entreprise. « PDF » s'obtient via « Enregistrer en PDF » dans la boîte d'impression du
 * navigateur — aucune génération de fichier côté application.
 */
export function MeetingPrintView({ title, bodyText, onBack, onPrinted }: {
  title: string;
  bodyText: string;
  onBack: () => void;
  /** Appelé au clic sur « Imprimer » — pour le document de préparation, c'est cette confirmation qui fait passer la réunion en Envoyée (comme le clic « Envoyer » du canal e-mail). */
  onPrinted?: () => void;
}) {
  const { settings } = useSettings();

  function print() {
    onPrinted?.();
    window.print();
  }

  return <div className="mx-auto max-w-[900px]">
    <style>{`@page { size: ${settings.print.paperSize} portrait; margin: 15mm; }`}</style>
    <div className="mb-4 flex justify-end gap-2 print:hidden">
      <button type="button" onClick={onBack} className={secondaryButton}>← Retour</button>
      <button type="button" onClick={print} className={primaryButton}>Imprimer</button>
    </div>
    <section className="rounded-2xl border border-[var(--app-border)] bg-white p-8 shadow-sm print:rounded-none print:border-0 print:p-0 print:shadow-none">
      <header className="flex items-center gap-4 border-b-2 pb-4" style={{ borderColor: "var(--app-primary)" }}>
        {settings.company.logoDataUrl ? <img src={settings.company.logoDataUrl} alt={`Logo ${settings.company.name}`} className="h-14 w-16 shrink-0 object-contain" /> : null}
        <div>
          <p className="text-sm font-semibold" style={{ color: "var(--app-primary)" }}>{settings.company.name}</p>
          <h1 className="text-xl font-bold uppercase tracking-tight text-slate-900">{title}</h1>
        </div>
      </header>
      <pre className="mt-6 whitespace-pre-wrap font-sans text-sm leading-6 text-slate-800">{bodyText}</pre>
      <footer className="mt-10 border-t border-slate-200 pt-4 text-xs text-slate-500">{settings.company.footerText}</footer>
    </section>
  </div>;
}
