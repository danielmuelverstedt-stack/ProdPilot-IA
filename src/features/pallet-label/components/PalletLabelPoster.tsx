/* Le logo local enregistré en data URL (Réglages → Identité société) ne passe pas par l'optimiseur d'images. */
/* eslint-disable @next/next/no-img-element */
import type { ReactNode } from "react";
import { FitText } from "@/components/ui/FitText";
import { PalletLabelBarcode } from "@/features/pallet-label/components/PalletLabelBarcode";
import type { PalletLabelFormData } from "@/features/pallet-label/types/pallet-label";

const POSTER_WIDTH_MM = 297;
const POSTER_HEIGHT_MM = 210;
const MM_TO_PX = 96 / 25.4;

/**
 * Affiche d'identification palette au format exact A4 paysage (297 × 210 mm), en mm pour un rendu
 * fidèle à l'impression à l'échelle 100 %. Sans `previewScale`, le rendu est en taille réelle (vue
 * d'impression) ; avec `previewScale`, le même DOM est réduit visuellement via `transform: scale`
 * pour l'aperçu de la fenêtre de saisie — aucune duplication de la mise en page entre les deux usages.
 */
export function PalletLabelPoster({ fields, companyName, logoDataUrl, editedAt, visaInitials, previewScale }: {
  fields: PalletLabelFormData;
  companyName: string;
  logoDataUrl?: string;
  editedAt: string;
  visaInitials: string;
  previewScale?: number;
}) {
  const paletteLabel = `${fields.palletNumber.trim() || "1"} / ${fields.palletCount.trim() || "1"}`;
  const quantityDisplay = fields.quantity.trim() || "—";

  const poster = <div
    className="flex flex-col bg-white text-black"
    style={{ width: `${POSTER_WIDTH_MM}mm`, height: `${POSTER_HEIGHT_MM}mm`, border: "0.6mm solid #000" }}
  >
    <header className="flex shrink-0 items-center justify-between gap-4 border-b-[0.4mm] border-black" style={{ height: "20mm", padding: "0 8mm" }}>
      {logoDataUrl ? <img src={logoDataUrl} alt={companyName} className="shrink-0 object-contain" style={{ height: "15mm" }} /> : <span />}
      <p className="text-right font-semibold uppercase text-gray-500" style={{ fontSize: "2.6mm", letterSpacing: "0.15em" }}>Identification palette · Ordre de fabrication</p>
    </header>

    {/* Zone OF : hauteur en flex-1 (pas de mm fixe), pour absorber exactement l'espace restant une
        fois l'en-tête, le tableau et le pied de page dimensionnés — garantit un total de 210 mm sans
        recalcul manuel si l'une de ces trois hauteurs change. */}
    <div className="flex flex-1 flex-col" style={{ minHeight: 0, padding: "3mm 8mm 0" }}>
      <div className="flex shrink-0 items-start justify-between">
        <p className="font-bold uppercase text-gray-500" style={{ fontSize: "3mm", letterSpacing: "0.12em" }}>N° d&apos;OF</p>
        <div className="text-right">
          <p className="font-bold uppercase text-gray-500" style={{ fontSize: "3mm", letterSpacing: "0.12em" }}>Palette</p>
          <div className="mt-1 inline-block font-extrabold" style={{ border: "0.6mm solid #000", padding: "1.5mm 4mm", fontSize: "6mm" }}>{paletteLabel}</div>
        </div>
      </div>
      <div className="flex flex-1 items-center justify-center" style={{ minHeight: 0 }}>
        <FitText maxFontSizePx={320} minFontSizePx={60} className="text-center font-extrabold tracking-tight">{fields.ofNumber.trim() || "—"}</FitText>
      </div>
    </div>

    <div className="flex shrink-0 flex-col border-t-[0.4mm] border-black">
      <LabelRow label="Client">
        <FitText maxFontSizePx={78} minFontSizePx={16} className="font-extrabold uppercase">{fields.client.trim() || "—"}</FitText>
      </LabelRow>
      <LabelRow label="Quantité">
        <span className="flex items-baseline gap-2 font-extrabold" style={{ fontSize: "13mm" }}>{quantityDisplay}<span className="font-semibold text-gray-500" style={{ fontSize: "5mm" }}>pcs</span></span>
      </LabelRow>
      <LabelRow label="Code article">
        <FitText maxFontSizePx={40} minFontSizePx={14} className="font-mono font-bold">{fields.articleCode.trim() || "—"}</FitText>
      </LabelRow>
      <LabelRow label="Description">
        <FitText maxFontSizePx={30} minFontSizePx={12} singleLine={false} className="font-bold">{fields.description.trim() || "—"}</FitText>
      </LabelRow>
      <LabelRow label="N° de plan" isLast>
        <FitText maxFontSizePx={32} minFontSizePx={12} className="font-mono font-bold">{fields.planNumber.trim() || "—"}</FitText>
      </LabelRow>
    </div>

    <footer className="grid shrink-0 grid-cols-3 items-center gap-4 border-t-[0.4mm] border-black" style={{ height: "16mm", padding: "0 8mm" }}>
      <p className="text-left text-gray-500" style={{ fontSize: "2.8mm" }}>Édité le {editedAt} · Visa : {visaInitials || "—"}</p>
      <p className="text-center text-gray-500" style={{ fontSize: "2.8mm" }}>FOR-LOG-001 · Ind. A</p>
      <div className="flex justify-end"><PalletLabelBarcode value={fields.ofNumber.trim()} heightMm={11} /></div>
    </footer>
  </div>;

  if (!previewScale) return poster;
  return <div style={{ width: POSTER_WIDTH_MM * MM_TO_PX * previewScale, height: POSTER_HEIGHT_MM * MM_TO_PX * previewScale, overflow: "hidden" }}>
    <div style={{ transform: `scale(${previewScale})`, transformOrigin: "top left" }}>{poster}</div>
  </div>;
}

function LabelRow({ label, children, isLast = false }: { label: string; children: ReactNode; isLast?: boolean }) {
  return <div className={`flex items-stretch ${isLast ? "" : "border-b-[0.3mm] border-gray-300"}`} style={{ height: "16mm" }}>
    <div className="flex shrink-0 items-center border-r-[0.3mm] border-gray-300" style={{ width: "58mm", padding: "0 6mm" }}>
      <p className="font-bold uppercase text-gray-500" style={{ fontSize: "3mm", letterSpacing: "0.1em" }}>{label}</p>
    </div>
    <div className="flex flex-1 items-center" style={{ padding: "0 8mm" }}>{children}</div>
  </div>;
}
