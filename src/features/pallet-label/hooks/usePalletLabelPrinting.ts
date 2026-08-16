"use client";

import { useState } from "react";
import type { PalletLabelPrintRequest } from "@/features/pallet-label/types/pallet-label";

/**
 * État partagé du parcours « Affiche palette » : ouverture de la fenêtre de saisie/aperçu, puis
 * bascule de la page hôte (liste des OF ou fiche d'un OF) vers la vue d'impression plein format.
 * Un seul hook, réutilisé par `WorkOrdersModule` et `WorkOrderDetail`, pour ne pas dupliquer ce
 * parcours en trois étapes.
 */
export function usePalletLabelPrinting() {
  const [dialogOfNumber, setDialogOfNumber] = useState<string | null>(null);
  const [printRequest, setPrintRequest] = useState<PalletLabelPrintRequest | null>(null);

  return {
    isDialogOpen: dialogOfNumber !== null,
    dialogOfNumber: dialogOfNumber ?? "",
    printFields: printRequest,
    openPalletLabelDialog: (ofNumber: string = "") => setDialogOfNumber(ofNumber),
    closePalletLabelDialog: () => setDialogOfNumber(null),
    confirmPalletLabelPrint: (request: PalletLabelPrintRequest) => { setDialogOfNumber(null); setPrintRequest(request); },
    exitPalletLabelPrint: () => setPrintRequest(null),
  };
}
