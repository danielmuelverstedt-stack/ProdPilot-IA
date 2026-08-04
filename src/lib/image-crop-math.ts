export interface CropPoint { x: number; y: number }

/** Échelle minimale pour qu'une image de taille (naturalWidth, naturalHeight) couvre entièrement un cadre carré de côté `frameSize`, sans laisser d'espace vide (équivalent de `background-size: cover`). */
export function coverScale(naturalWidth: number, naturalHeight: number, frameSize: number): number {
  return Math.max(frameSize / naturalWidth, frameSize / naturalHeight);
}

/** Borne le déplacement (centré par défaut) pour que l'image affichée à `scale` continue de couvrir entièrement le cadre, quelle que soit la direction du glissement. */
export function clampCropOffset(offset: CropPoint, scale: number, naturalWidth: number, naturalHeight: number, frameSize: number): CropPoint {
  const maxX = Math.max(0, (naturalWidth * scale - frameSize) / 2);
  const maxY = Math.max(0, (naturalHeight * scale - frameSize) / 2);
  return { x: Math.min(maxX, Math.max(-maxX, offset.x)), y: Math.min(maxY, Math.max(-maxY, offset.y)) };
}

/** Rectangle source (espace image naturelle) correspondant à la zone actuellement visible dans le cadre, pour l'export final via `CanvasRenderingContext2D.drawImage`. */
export function cropSourceRect(offset: CropPoint, scale: number, naturalWidth: number, naturalHeight: number, frameSize: number): { sx: number; sy: number; size: number } {
  const size = frameSize / scale;
  return {
    sx: (naturalWidth - size) / 2 - offset.x / scale,
    sy: (naturalHeight - size) / 2 - offset.y / scale,
    size,
  };
}
