"use client";

import { useState } from "react";
import { primaryButton, secondaryButton } from "@/components/ui/ModuleUi";
import { useSettings } from "@/features/settings/components/SettingsProvider";
import { findMachineForFileName } from "@/features/machines/services/machine-photo-import-service";
import { setMachinePhoto } from "@/features/machines/services/machine-photo-store";
import { readImageFileAsCompressedDataUrl } from "@/lib/image-file";

interface ImportResult {
  savedCount: number;
  unmatched: string[];
  processingFailed: string[];
  notSaved: string[];
}

export function MachinePhotoBulkImport() {
  const { settings } = useSettings();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function importFiles(fileList: FileList | null) {
    if (!fileList || !fileList.length) return;
    setPending(true);
    setResult(null);
    setSaveError(null);
    let savedCount = 0;
    const unmatched: string[] = [];
    const processingFailed: string[] = [];
    const notSaved: string[] = [];
    let storageFailed = false;

    for (const file of Array.from(fileList)) {
      if (!file.type.startsWith("image/")) continue;
      const machine = findMachineForFileName(settings.production.machines, file.name);
      if (!machine) { unmatched.push(file.name); continue; }
      if (storageFailed) { notSaved.push(file.name); continue; }
      let dataUrl: string;
      try {
        dataUrl = await readImageFileAsCompressedDataUrl(file, { maxDimension: 1300, quality: 0.8 });
      } catch {
        processingFailed.push(file.name);
        continue;
      }
      try {
        await setMachinePhoto(machine.id, dataUrl);
        savedCount += 1;
      } catch (cause) {
        storageFailed = true;
        notSaved.push(file.name);
        setSaveError(cause instanceof Error ? cause.message : "Le stockage local des photos est indisponible.");
      }
    }
    setResult({ savedCount, unmatched, processingFailed, notSaved });
    setPending(false);
  }

  return (
    <div className="rounded-2xl border border-[var(--app-border)] bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Importer des photos en masse</h2>
          <p className="mt-1 text-xs text-slate-500">Ouvre le dossier de tes photos, sélectionne-les toutes (Ctrl+A) et valide : chaque image est associée à la machine dont le nom technique, le nom affiché ou l’identifiant correspond à son nom de fichier, puis enregistrée immédiatement (une photo à la fois, pour ne rien perdre en cas d’incident).</p>
        </div>
        <button className={open ? secondaryButton : primaryButton} onClick={() => setOpen((value) => !value)}>{open ? "Fermer" : "Importer des photos"}</button>
      </div>
      {open ? (
        <div className="mt-4">
          <label className={`${secondaryButton} cursor-pointer ${pending ? "pointer-events-none opacity-60" : ""}`}>
            {pending ? "Import en cours…" : "Choisir les photos"}
            <input type="file" accept="image/*" multiple disabled={pending} className="hidden" onChange={(event) => { void importFiles(event.target.files); event.target.value = ""; }} />
          </label>
          {result ? (
            <div className="mt-3 space-y-2 text-sm">
              <p className="font-medium text-emerald-700">{result.savedCount} photo(s) associée(s) et enregistrée(s).</p>
              {result.unmatched.length ? <p className="text-xs text-slate-500">{result.unmatched.length} fichier(s) sans machine correspondante : {result.unmatched.join(", ")}</p> : null}
              {result.processingFailed.length ? <p className="text-xs text-red-700">{result.processingFailed.length} fichier(s) n’ont pas pu être lus comme image : {result.processingFailed.join(", ")}</p> : null}
              {result.notSaved.length ? <p className="text-xs text-red-700">{result.notSaved.length} fichier(s) non enregistrés (voir message ci-dessous) : {result.notSaved.join(", ")}</p> : null}
            </div>
          ) : null}
          {saveError ? <p role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">{saveError}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
