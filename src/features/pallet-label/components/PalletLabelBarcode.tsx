"use client";

import { useEffect, useRef, useState } from "react";
import { loadExternalScript } from "@/lib/external-script";

const JSBARCODE_CDN_URL = "https://cdnjs.cloudflare.com/ajax/libs/jsbarcode/3.12.3/JsBarcode.all.min.js";

type JsBarcodeFunction = (element: SVGSVGElement, value: string, options: Record<string, unknown>) => void;

/**
 * Code-barres Code 128 du n° d'OF, généré via JsBarcode chargé depuis le CDN cdnjs au premier
 * usage. Si le CDN est indisponible, l'affiche reste utilisable : le code-barres est simplement
 * masqué, sans erreur visible.
 */
export function PalletLabelBarcode({ value, heightMm }: { value: string; heightMm: number }) {
  const svgRef = useRef<SVGSVGElement>(null);
  // Valeur pour laquelle le chargement a échoué : comparée à `trimmedValue` plutôt qu'un simple
  // booléen, pour se réinitialiser naturellement dès que l'OF change, sans setState synchrone.
  const [failedValue, setFailedValue] = useState<string | null>(null);
  const trimmedValue = value.trim();

  useEffect(() => {
    if (!trimmedValue) return;
    let active = true;
    loadExternalScript(JSBARCODE_CDN_URL)
      .then(() => {
        if (!active || !svgRef.current) return;
        const jsBarcode = (window as unknown as { JsBarcode?: JsBarcodeFunction }).JsBarcode;
        if (!jsBarcode) throw new Error("JsBarcode indisponible après chargement.");
        jsBarcode(svgRef.current, trimmedValue, { format: "CODE128", displayValue: false, margin: 0, height: heightMm * 3.7795275591, width: 1.6 });
      })
      .catch(() => { if (active) setFailedValue(trimmedValue); });
    return () => { active = false; };
  }, [trimmedValue, heightMm]);

  if (!trimmedValue || failedValue === trimmedValue) return null;
  return <svg ref={svgRef} aria-hidden="true" style={{ height: `${heightMm}mm` }} />;
}
