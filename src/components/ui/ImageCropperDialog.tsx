/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useRef, useState } from "react";
import { AppIcon } from "@/components/ui/AppIcon";
import { primaryButton, secondaryButton } from "@/components/ui/ModuleUi";
import { clampCropOffset, coverScale, cropSourceRect, type CropPoint } from "@/lib/image-crop-math";

const FRAME_SIZE_PX = 288;
const OUTPUT_SIZE_PX = 480;
const OUTPUT_QUALITY = 0.9;
const MAX_ZOOM_MULTIPLIER = 4;

/**
 * Recadrage interactif (zoom + déplacement) d'une photo avant enregistrement : la photo reste
 * carrée pour un rendu cohérent en vignette (fiche machine, registre Contacts…). Implémenté sans
 * dépendance externe (canvas + événements pointeur), sur le même principe que les autres widgets
 * faits main du projet (mini-graphiques, fenêtrage de lignes).
 */
export function ImageCropperDialog({ imageSrc, alt, onCancel, onConfirm }: { imageSrc: string; alt: string; onCancel: () => void; onConfirm: (dataUrl: string) => Promise<void> }) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState<CropPoint>({ x: 0, y: 0 });
  const [saving, setSaving] = useState(false);
  const dragRef = useRef<{ start: CropPoint; startOffset: CropPoint } | null>(null);

  useEffect(() => {
    let active = true;
    const loaded = new Image();
    loaded.onload = () => {
      if (!active) return;
      setImage(loaded);
      setScale(coverScale(loaded.naturalWidth, loaded.naturalHeight, FRAME_SIZE_PX));
      setOffset({ x: 0, y: 0 });
    };
    loaded.src = imageSrc;
    return () => { active = false; };
  }, [imageSrc]);

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { start: { x: event.clientX, y: event.clientY }, startOffset: offset };
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!dragRef.current || !image) return;
    const dx = event.clientX - dragRef.current.start.x;
    const dy = event.clientY - dragRef.current.start.y;
    setOffset(clampCropOffset({ x: dragRef.current.startOffset.x + dx, y: dragRef.current.startOffset.y + dy }, scale, image.naturalWidth, image.naturalHeight, FRAME_SIZE_PX));
  }

  function handlePointerUp() {
    dragRef.current = null;
  }

  function handleZoom(nextScale: number) {
    if (!image) return;
    setScale(nextScale);
    setOffset((current) => clampCropOffset(current, nextScale, image.naturalWidth, image.naturalHeight, FRAME_SIZE_PX));
  }

  async function confirm() {
    if (!image) return;
    setSaving(true);
    try {
      const { sx, sy, size } = cropSourceRect(offset, scale, image.naturalWidth, image.naturalHeight, FRAME_SIZE_PX);
      const canvas = document.createElement("canvas");
      canvas.width = OUTPUT_SIZE_PX;
      canvas.height = OUTPUT_SIZE_PX;
      const context = canvas.getContext("2d");
      if (!context) return;
      context.drawImage(image, sx, sy, size, size, 0, 0, OUTPUT_SIZE_PX, OUTPUT_SIZE_PX);
      await onConfirm(canvas.toDataURL("image/jpeg", OUTPUT_QUALITY));
    } finally {
      setSaving(false);
    }
  }

  const minZoom = image ? coverScale(image.naturalWidth, image.naturalHeight, FRAME_SIZE_PX) : 1;

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel(); }}>
    <section role="dialog" aria-modal="true" aria-label="Recadrer la photo" className="w-full max-w-sm rounded-2xl border border-[var(--app-border)] bg-white p-5 shadow-2xl">
      <div className="flex items-center justify-between"><h2 className="font-bold">Recadrer la photo</h2><button type="button" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" onClick={onCancel} aria-label="Fermer"><AppIcon name="close" className="size-4" /></button></div>
      <p className="mt-1 text-xs text-slate-500">Glissez la photo pour la repositionner, utilisez le curseur pour zoomer.</p>

      <div
        className="relative mt-4 touch-none select-none overflow-hidden rounded-xl border border-[var(--app-border)] bg-slate-100"
        style={{ width: FRAME_SIZE_PX, height: FRAME_SIZE_PX, cursor: image ? "grab" : "default" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {image ? <img
          src={imageSrc}
          alt={alt}
          draggable={false}
          className="pointer-events-none absolute left-1/2 top-1/2"
          style={{ width: image.naturalWidth * scale, height: image.naturalHeight * scale, transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px)` }}
        /> : <div className="flex h-full items-center justify-center text-xs text-slate-400">Chargement…</div>}
      </div>

      <label className="mt-4 flex items-center gap-2 text-xs font-semibold uppercase text-slate-500">
        Zoom
        <input type="range" className="flex-1" min={minZoom} max={minZoom * MAX_ZOOM_MULTIPLIER} step={minZoom / 100 || 0.001} value={scale} disabled={!image} onChange={(event) => handleZoom(Number(event.target.value))} />
      </label>

      <div className="mt-4 flex justify-end gap-2">
        <button type="button" className={secondaryButton} onClick={onCancel} disabled={saving}>Annuler</button>
        <button type="button" className={primaryButton} onClick={confirm} disabled={!image || saving}>{saving ? "Enregistrement…" : "Valider le cadrage"}</button>
      </div>
    </section>
  </div>;
}
