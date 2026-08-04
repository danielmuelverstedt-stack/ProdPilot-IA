/* eslint-disable @next/next/no-img-element */

type PhotoThumbnailSize = "xs" | "md";

const FALLBACK_CLASSES: Record<PhotoThumbnailSize, string> = {
  xs: "h-4 w-4 rounded text-[9px]",
  md: "h-12 w-12 rounded-lg border border-[var(--app-border)] text-xs",
};

const IMAGE_CLASSES: Record<PhotoThumbnailSize, string> = {
  xs: "h-4 w-4 rounded",
  md: "h-12 w-12 rounded-lg border border-[var(--app-border)]",
};

/**
 * Vignette photo générique (machine, contact…), avec repli explicite « — » sans photo. Réutilisée
 * partout où une entité doit être identifiée visuellement en petit format : sélecteur machine de
 * l'Atelier (`xs`), revue par machine des réunions (`md`), registre Contacts (`md`).
 */
export function PhotoThumbnail({ photoDataUrl, alt = "", size = "xs" }: { photoDataUrl: string | undefined; alt?: string; size?: PhotoThumbnailSize }) {
  if (!photoDataUrl) return <span className={`inline-flex shrink-0 items-center justify-center bg-slate-100 text-slate-400 ${FALLBACK_CLASSES[size]}`} aria-hidden="true">—</span>;
  return <img src={photoDataUrl} alt={alt} className={`shrink-0 object-cover ${IMAGE_CLASSES[size]}`} />;
}
