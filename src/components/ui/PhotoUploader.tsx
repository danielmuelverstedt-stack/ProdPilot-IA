/* Les aperçus locaux en data URL ne passent pas par l’optimiseur d’images. */
/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import { ImageCropperDialog } from "@/components/ui/ImageCropperDialog";
import { secondaryButton } from "@/components/ui/ModuleUi";
import { readImageFileAsCompressedDataUrl } from "@/lib/image-file";

/** Champ photo générique (machine, contact…) : aperçu, remplacement, recadrage (zoom + repositionnement) en cliquant directement sur la photo. Réutilisé par toute fiche ayant une photo. */
export function PhotoUploader({ photoDataUrl, alt, onChange }: { photoDataUrl: string; alt: string; onChange: (dataUrl: string) => Promise<void> }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  /** Image source à recadrer : soit fraîchement sélectionnée, soit la photo déjà enregistrée (clic direct sur la photo). */
  const [cropSource, setCropSource] = useState<string | null>(null);

  async function readPhoto(file?: File) {
    if (!file) return;
    setError(null);
    setPending(true);
    try {
      setCropSource(await readImageFileAsCompressedDataUrl(file));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Cette photo n’a pas pu être ajoutée.");
    } finally {
      setPending(false);
    }
  }

  async function confirmCrop(dataUrl: string) {
    setError(null);
    try {
      await onChange(dataUrl);
      setCropSource(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Cette photo n’a pas pu être enregistrée.");
    }
  }

  return (
    <div className="flex flex-wrap items-start gap-4">
      {photoDataUrl ? (
        <button type="button" onClick={() => setCropSource(photoDataUrl)} className="group relative overflow-hidden rounded-xl border border-[var(--app-border)]" aria-label="Recadrer la photo" title="Cliquer pour déplacer et zoomer la photo">
          <img src={photoDataUrl} alt={alt} className="h-40 w-64 object-cover transition group-hover:opacity-90" />
          <span className="pointer-events-none absolute bottom-2 right-2 rounded-md bg-black/55 px-2 py-1 text-xs font-medium text-white opacity-0 transition group-hover:opacity-100">Recadrer</span>
        </button>
      ) : (
        <div className="flex h-40 w-64 items-center justify-center rounded-xl border border-dashed border-[var(--app-border)] bg-slate-50 text-center text-xs text-slate-400">Aucune photo</div>
      )}
      <div className="flex flex-wrap gap-2">
        <label className={`${secondaryButton} cursor-pointer ${pending ? "pointer-events-none opacity-60" : ""}`}>
          {pending ? "Traitement…" : photoDataUrl ? "Changer la photo" : "Ajouter une photo"}
          <input type="file" accept="image/*" className="hidden" disabled={pending} onChange={(event) => { void readPhoto(event.target.files?.[0]); event.target.value = ""; }} />
        </label>
        {error ? <p role="alert" className="mt-2 w-full max-w-xs rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">{error}</p> : null}
      </div>
      {cropSource ? <ImageCropperDialog imageSrc={cropSource} alt={alt} onCancel={() => setCropSource(null)} onConfirm={confirmCrop} /> : null}
    </div>
  );
}
