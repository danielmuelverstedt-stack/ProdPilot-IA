/* Les aperçus locaux en data URL ne passent pas par l’optimiseur d’images. */
/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import { secondaryButton } from "@/components/ui/ModuleUi";
import { readImageFileAsCompressedDataUrl } from "@/lib/image-file";

export function MachinePhotoUploader({ photoDataUrl, alt, onChange }: { photoDataUrl: string; alt: string; onChange: (dataUrl: string) => Promise<void> }) {
  const [zoomed, setZoomed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!zoomed) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setZoomed(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [zoomed]);

  async function readPhoto(file?: File) {
    if (!file) return;
    setError(null);
    setPending(true);
    try {
      const dataUrl = await readImageFileAsCompressedDataUrl(file);
      await onChange(dataUrl);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Cette photo n’a pas pu être ajoutée.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-wrap items-start gap-4">
      {photoDataUrl ? (
        <button type="button" onClick={() => setZoomed(true)} className="group relative overflow-hidden rounded-xl border border-[var(--app-border)]" aria-label="Agrandir la photo">
          <img src={photoDataUrl} alt={alt} className="h-40 w-64 object-cover transition group-hover:opacity-90" />
          <span className="pointer-events-none absolute bottom-2 right-2 rounded-md bg-black/55 px-2 py-1 text-xs font-medium text-white opacity-0 transition group-hover:opacity-100">Agrandir</span>
        </button>
      ) : (
        <div className="flex h-40 w-64 items-center justify-center rounded-xl border border-dashed border-[var(--app-border)] bg-slate-50 text-center text-xs text-slate-400">Aucune photo</div>
      )}
      <div>
        <label className={`${secondaryButton} cursor-pointer ${pending ? "pointer-events-none opacity-60" : ""}`}>
          {pending ? "Traitement…" : photoDataUrl ? "Changer la photo" : "Ajouter une photo"}
          <input type="file" accept="image/*" className="hidden" disabled={pending} onChange={(event) => { void readPhoto(event.target.files?.[0]); event.target.value = ""; }} />
        </label>
        {error ? <p role="alert" className="mt-2 max-w-xs rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">{error}</p> : null}
      </div>
      {zoomed && photoDataUrl ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4"
          role="presentation"
          onMouseDown={(event) => { if (event.target === event.currentTarget) setZoomed(false); }}
        >
          <div role="dialog" aria-modal="true" aria-label={alt} className="relative max-h-[90vh] max-w-4xl">
            <img src={photoDataUrl} alt={alt} className="max-h-[90vh] max-w-full rounded-xl object-contain shadow-2xl" />
            <button type="button" onClick={() => setZoomed(false)} className="absolute -top-3 -right-3 flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-700 shadow-lg hover:bg-slate-100" aria-label="Fermer">✕</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
