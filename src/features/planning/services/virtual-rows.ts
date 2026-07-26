export interface VirtualRowRange {
  startIndex: number;
  endIndex: number;
  topSpacerPx: number;
  bottomSpacerPx: number;
}

/**
 * Fenêtre de lignes à réellement monter dans le DOM pour un cadre défilant à hauteur de ligne
 * fixe (tableau de l'Atelier) : tout le reste est représenté par deux lignes d'espacement de la
 * bonne hauteur, pour que la barre de défilement et la position restent correctes sans qu'aucune
 * opération ne soit perdue — seulement non montée tant qu'elle n'est pas (presque) visible.
 */
export function computeVirtualRowRange(scrollTopPx: number, viewportHeightPx: number, rowHeightPx: number, totalRows: number, overscan = 6): VirtualRowRange {
  if (totalRows <= 0 || rowHeightPx <= 0) return { startIndex: 0, endIndex: 0, topSpacerPx: 0, bottomSpacerPx: 0 };
  const startIndex = Math.max(0, Math.floor(scrollTopPx / rowHeightPx) - overscan);
  const visibleRowCount = Math.ceil(viewportHeightPx / rowHeightPx) + overscan * 2;
  const endIndex = Math.min(totalRows, startIndex + visibleRowCount);
  return { startIndex, endIndex, topSpacerPx: startIndex * rowHeightPx, bottomSpacerPx: (totalRows - endIndex) * rowHeightPx };
}
