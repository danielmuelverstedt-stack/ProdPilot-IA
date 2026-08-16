"use client";

import { useEffect } from "react";
import { formatEuropeanDate, primaryButton, secondaryButton } from "@/components/ui/ModuleUi";
import { useSettings } from "@/features/settings/components/SettingsProvider";
import { deriveVisaInitials } from "@/features/pallet-label/services/pallet-label-lookup";
import { PalletLabelPoster } from "@/features/pallet-label/components/PalletLabelPoster";
import type { PalletLabelPrintRequest } from "@/features/pallet-label/types/pallet-label";

/**
 * Vue plein format de l'affiche palette, en remplacement de la page hôte (même principe que
 * `WorkshopMachinePrintView`) : seule cette vue est visible à l'impression, le reste de
 * l'interface (menu, en-tête) est masqué par les règles `@media print` globales existantes.
 * Une affiche par palette est générée à partir du nombre demandé, numérotée automatiquement de 1
 * à N, chacune sur sa propre page imprimée (`break-after: page`). L'impression démarre
 * automatiquement à l'ouverture, puisque l'aperçu a déjà été validé dans la fenêtre de saisie ; le
 * bouton reste disponible pour relancer l'impression si besoin.
 */
export function PalletLabelPrintView({ fields, onBack }: { fields: PalletLabelPrintRequest; onBack: () => void }) {
  const { settings } = useSettings();
  const palletCount = Math.max(1, Math.floor(Number(fields.palletCount)) || 1);
  const palletNumbers = Array.from({ length: palletCount }, (_, index) => index + 1);

  useEffect(() => {
    const timer = window.setTimeout(() => window.print(), 150);
    return () => window.clearTimeout(timer);
  }, []);

  return <div className="mx-auto max-w-[1200px]">
    <style>{`@page { size: A4 landscape; margin: 0; } @media print { .pallet-label-sheet { break-after: page; } .pallet-label-sheet:last-child { break-after: auto; } }`}</style>
    <div className="mb-4 flex justify-end gap-2 print:hidden">
      <button type="button" onClick={onBack} className={secondaryButton}>← Retour</button>
      <button type="button" onClick={() => window.print()} className={primaryButton}>Imprimer</button>
    </div>
    <div className="flex flex-col items-center gap-6 overflow-x-auto print:gap-0">
      {palletNumbers.map((palletNumber) => <div key={palletNumber} className="pallet-label-sheet">
        <PalletLabelPoster
          fields={{ ...fields, palletNumber: String(palletNumber) }}
          companyName={settings.company.name}
          logoDataUrl={settings.company.logoDataUrl}
          editedAt={formatEuropeanDate(new Date().toISOString())}
          visaInitials={deriveVisaInitials(settings.users)}
        />
      </div>)}
    </div>
  </div>;
}
