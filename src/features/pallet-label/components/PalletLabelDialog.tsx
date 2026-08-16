"use client";

import { useEffect, useRef, useState } from "react";
import { fieldClass, formatEuropeanDate, primaryButton, secondaryButton, StatusPill } from "@/components/ui/ModuleUi";
import { PlanningDialogShell } from "@/features/planning/components/PlanningDialogShell";
import { useSettings } from "@/features/settings/components/SettingsProvider";
import { usePalletLabelLookup } from "@/features/pallet-label/hooks/usePalletLabelLookup";
import { deriveVisaInitials } from "@/features/pallet-label/services/pallet-label-lookup";
import { PalletLabelPoster } from "@/features/pallet-label/components/PalletLabelPoster";
import type { PalletLabelPrintRequest } from "@/features/pallet-label/types/pallet-label";

/**
 * Fenêtre unique de l'affiche palette : recherche de l'OF, champs de l'OF affichés en lecture
 * seule (jamais modifiables — seul le n° de plan se saisit, absent de toute source), nombre de
 * palettes et aperçu de la première affiche. À l'impression, une affiche par palette est générée,
 * numérotée automatiquement (voir `PalletLabelPrintView`).
 */
export function PalletLabelDialog({ initialOfNumber, onClose, onPrint }: {
  initialOfNumber: string;
  onClose: () => void;
  onPrint: (request: PalletLabelPrintRequest) => void;
}) {
  const { settings } = useSettings();
  const [request, setRequest] = useState<PalletLabelPrintRequest>({ ofNumber: initialOfNumber, client: "", quantity: "", articleCode: "", description: "", planNumber: "", palletCount: "1" });
  const lookup = usePalletLabelLookup(request.ofNumber);
  const appliedForRef = useRef<string | null>(null);

  useEffect(() => {
    const trimmedId = request.ofNumber.trim();
    if (!trimmedId || lookup.isLoading || appliedForRef.current === trimmedId) return;
    appliedForRef.current = trimmedId;
    setRequest((current) => ({ ...current, client: lookup.fields.client, quantity: lookup.fields.quantity, articleCode: lookup.fields.articleCode, description: lookup.fields.description }));
  }, [request.ofNumber, lookup.fields, lookup.isLoading]);

  function updateOfNumber(value: string) {
    appliedForRef.current = null;
    setRequest((current) => ({ ...current, ofNumber: value }));
  }

  function updatePlanNumber(value: string) {
    setRequest((current) => ({ ...current, planNumber: value }));
  }

  function updatePalletCount(value: string) {
    setRequest((current) => ({ ...current, palletCount: value }));
  }

  const canPrint = request.ofNumber.trim().length > 0;
  const palletCount = Math.max(1, Math.floor(Number(request.palletCount)) || 1);

  return <PlanningDialogShell
    title="Affiche palette"
    description="Retrouvez un OF, indiquez le nombre de palettes : une affiche numérotée est générée pour chacune."
    maxWidthClassName="max-w-5xl"
    onClose={onClose}
    actions={<><button type="button" className={secondaryButton} onClick={onClose}>Annuler</button><button type="button" className={primaryButton} disabled={!canPrint} onClick={() => onPrint(request)}>Imprimer{palletCount > 1 ? ` (${palletCount} affiches)` : ""}</button></>}
  >
    <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
      <div className="space-y-3">
        <label className="block text-sm font-medium">N° d&apos;OF
          <input className={`${fieldClass} mt-1 w-full`} value={request.ofNumber} onChange={(event) => updateOfNumber(event.target.value)} placeholder="Ex. 11879" autoFocus />
        </label>
        {request.ofNumber.trim() ? <p className="text-xs">
          {lookup.isLoading ? <span className="text-slate-500">Recherche en cours…</span>
            : lookup.found ? <StatusPill tone="success">OF trouvé</StatusPill>
            : <StatusPill tone="warning">OF introuvable</StatusPill>}
        </p> : null}
        <ReadOnlyField label="Client" value={request.client} />
        <div className="grid grid-cols-2 gap-3">
          <ReadOnlyField label="Quantité" value={request.quantity} />
          <ReadOnlyField label="Code article" value={request.articleCode} />
        </div>
        <ReadOnlyField label="Description" value={request.description} />
        <label className="block text-sm font-medium">N° de plan
          <input className={`${fieldClass} mt-1 w-full`} value={request.planNumber} onChange={(event) => updatePlanNumber(event.target.value)} placeholder="Ex. 5.99.52.00126 ind. E" />
        </label>
        <label className="block text-sm font-medium">Nombre de palettes
          <input className={`${fieldClass} mt-1 w-full`} value={request.palletCount} onChange={(event) => updatePalletCount(event.target.value)} inputMode="numeric" />
        </label>
        <p className="text-xs text-slate-500">Une affiche par palette sera imprimée, numérotée automatiquement de 1 à {palletCount}.</p>
      </div>
      <div className="flex items-start justify-center overflow-hidden rounded-xl border border-[var(--app-border)] bg-slate-100 p-4">
        <div className="shadow-lg">
          <PalletLabelPoster fields={{ ...request, palletNumber: "1" }} companyName={settings.company.name} logoDataUrl={settings.company.logoDataUrl} editedAt={formatEuropeanDate(new Date().toISOString())} visaInitials={deriveVisaInitials(settings.users)} previewScale={0.34} />
        </div>
      </div>
    </div>
  </PlanningDialogShell>;
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return <div className="block text-sm font-medium">{label}
    <p className={`${fieldClass} mt-1 flex w-full items-center bg-slate-50 text-slate-700`}>{value.trim() || "—"}</p>
  </div>;
}
